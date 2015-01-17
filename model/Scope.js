define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "./ModelBase",
    "./Expression",
    "./variables/Variable",
    "xide/factory",
    "xide/utils",
    "xide/types",
    "dojo/store/Memory",
    "dojo/store/Observable",
    'dstore/legacy/StoreAdapter',
    "xide/mixins/ReloadMixin"], function(declare,lang,ModelBase,Expression,Variable,factory,utils,types,Memory,Observable,StoreAdapter,ReloadMixin){

    // summary:
    //		The scope acts as a real scope as usual. All registered variables and blocks are excecuted in this
    //      scope only.


    // module:
    //		xblox.model.Scope
    /**
     *
     * @class
     */
    return declare('xblox.model.Scope',[ModelBase,ReloadMixin],{

        context:null,

        /////////////////////////////////////////////////////////
        //
        //  Service uplink related
        //
        /////////////////////////////////////////////////////////

        /** @member {Object} */
        serviceObject:null,
        getService:function(){
            return this.serviceObject;
        },
        /////////////////////////////////////////////////////////
        //
        //  Store related
        //
        /////////////////////////////////////////////////////////
        blockStore:null,
        /**
         *
         */
        variableStore:null,
        clearCache:function(){
            this.expressionModel.expressionCache={};
            this.expressionModel.variableFuncCache={};
        },
        /**
         * @returns {dojo/store/Memory}
         */
        getVariableStore:function(){
            return this.variableStore;
        },
        getBlockStore:function(){
            return this.blockStore;
        },
        getVariables:function(query){
            //no store,
            if(!this.variableStore){
                return [];
            }
            query = query||{id:/\S+/};//all variables
            return this.variableStore.query(query);
        },
        loopBlock:function(block){

            if(block && block.auto>0){
                var thiz=this;
                setTimeout(function(){
                    block.solve(thiz);
                    thiz.loopBlock(block);
                },block.auto);
            }

        },
        getEventsAsOptions:function(selected){

            var result = [];
            for(var e in types.EVENTS){
                var label = types.EVENTS[e];

                var item = {
                    label:label,
                    value:types.EVENTS[e]
                };

                /*if(selected===types.EVENTS[e]){
                    item.selected=true;
                }*/

                result.push(item);
            }


            result = result.concat([{label:"onclick", value:"onclick"},
                {label:"ondblclick",value:"ondblclick"},
                {label:"onmousedown",value:"onmousedown"},
                {label:"onmouseup",value:"onmouseup"},
                {label:"onmouseover",value:"onmouseover"},
                {label:"onmousemove",value:"onmousemove"},
                {label:"onmouseout",value:"onmouseout"},
                {label:"onkeypress",value:"onkeypress"},
                {label:"onkeydown",value:"onkeydown"},
                {label:"onkeyup",  value:"onkeyup"},
                {label:"onfocus",  value:"onfocus"},
                {label:"onblur",  value:"onblur"},
                {label:"onchange",  value:"onchange"}]);

            //select the event we are listening to
            for (var i = 0; i < result.length; i++) {
                var obj = result[i];
                if(obj.value===selected){
                    obj.selected=true;
                    break;
                }
            }


            return result;

        },
        getVariablesAsOptions:function(){

            var variables = this.getVariables();
            var result = [];
            if(variables){

                for(var i=0; i<variables.length;i++){
                    result.push({
                        label:variables[i].title,
                        value:variables[i].title
                    })
                }
            }

            return result;
        },
        getCommandsAsOptions:function(){

            var items = this.getBlocks({
                declaredClass:'xcf.model.Command'
            });
            var result = [];
            if(items){
                for(var i=0; i<items.length;i++){
                    result.push({
                        label:items[i].name,
                        value:items[i].name
                    })
                }
            }
            return result;
        },
        getBlocks:function(query){
            //no store,
            if(!this.blockStore){
                return [];
            }
            query = query||{id:/\S+/};//all blocks
            return this.blockStore.query(query);

        },
        //declaredClass: String (dcl internals, private!)
        declaredClass: "xblox.model.Scope",
        /**
         *
         */
        expressionModel: new Expression(),
        /***
         * Register a variable into the scope
         *
         * The variable title is unique within the scope
         *
         * @param variable  =>  xblox.model.Variable
         */
        registerVariable:function(variable) {
            this.variables[variable.title] = variable;
            if(this.variableStore){
                this.variableStore.put(variable);
            }
        },
        /***
         * Returns a variable from the scope
         *
         * @param title => variable title
         * @return variable
         */
        getVariable:function(title) {
            //return this.variables[title];

            var _var = this.variableStore.data[title];
            if(_var){
                return _var;
            }
            var _var = this.variableStore.query({title:title});
            if(_var){
                return _var[0];
            }
            console.error('couldnt find variable with name ' + title);
            return null;
        },
        /***
         * Register a block into the scope
         *
         * The block name is unique within the scope
         *
         * @param block   =>    xblox.model.Block
         */
        registerBlock:function(block) {

            if (block.id) {
                this.blocks[block.id] = block;
            }
            if(this.blockStore){
                var added = this.blockStore.getSync(block.id);
                if(added){
                    return;
                }
                if(block.addToStore){
                    block.addToStore(this.blockStore);
                }else{
                    this.blockStore.putSync(block);
                }
            }
        },
        /***
         * Return all blocks
         *
         * @param block   =>    Array(xblox.model.Block)
         */
        allBlocks:function(block) {

            var result = [];
            for(var b in this.blocks){
                if(this.blocks[b].id!=null){
                    result.push(this.blocks[b]);
                }
            }
            return result;
        },
        /**
         * Returns whether there is any block belongs to a given group
         * @param group {String}
         * @returns {boolean}
         */
        hasGroup:function(group){

            var all = this.allGroups();
            for (var i = 0; i < all.length; i++) {
                var obj = all[i];
                if (obj === group) {
                    return true;
                }
            }
            return false;
        },
        /**
         * Return all block groups
         */
        allGroups:function(){

            var result = [];
            var all = this.allBlocks();

            var _has = function(what){
                for (var i = 0; i < result.length; i++) {
                    if(result[i]===what){
                        return true;
                    }
                }
                return false;
            };


            for (var i = 0; i < all.length; i++) {
                var obj = all[i];

                if(obj.parentId){
                    continue;
                }

                if(obj.group){
                    if(!_has(obj.group)){
                        result.push(obj.group);
                    }
                }else{
                    if(!_has('No Group')){
                        result.push('No Group');
                    }
                }
            }

            return result;
        },
        /**
         * Serializes all variables
         * @returns {Array}
         */
        variablesToJson:function(){
            var result = [];
            var data = this.variableStore ? this.variableStore.data : this.variables;
            for(var e in data){
                var variable = data[e];
                if(variable.serializeMe===false){
                    continue;
                }
                if(variable.keys==null){
                    continue;
                }
                var varOut={
                };
                for(var prop in variable){

                    //copy all serializables over
                    if(
                        this.isString(variable[prop])||
                        this.isNumber(variable[prop])||
                        this.isBoolean(variable[prop])
                        )
                    {
                        varOut[prop]=variable[prop];
                    }
                }

                result.push(varOut);
            }
            //return JSON.stringify(result);
            //console.log('saving all variables  ' + JSON.stringify(result),result);
            return result;
        },
        isScript:function(val){
            return this.isString(val) && (
                    val.indexOf('return')!=-1||
                    val.indexOf(';')!=-1||
                    val.indexOf('[')!=-1||
                    val.indexOf('{')!=-1||
                    val.indexOf('}')!=-1
                );
        },
        /*
        parseVariable:function(_var){

            var value = ''+ _var.value;
            try{
                //put other variables on the stack;
                var _otherVariables = this.variablesToJavascript(_var,false);
                if(_otherVariables){
                    value = _otherVariables + value;
                }
                var _parsed = (new Function("{" + value+ "}")).call(this.expressionModel.context||{});
                //wasnt a script
                if(_parsed==='undefined' || typeof _parsed ==='undefined'){
                    //console.error(' parsed variable to undefined : ' + _var.title + ' with value : ' + value);
                    value = '' + _var.value;
                }else{
                    value = ''+_parsed;
                    value = "'" + value + "'";
                }
            }catch(e){
                console.error('parse variable failed : ' + )
            }
            return value;
        },*/
        /**
         * Serializes all variables
         * @returns {Array}
         */
        variablesToJavascriptEx:function(skipVariable,expression){

            var result=[];
            var data = this.variableStore ? this.variableStore.data : this.variables;
            for(var i = 0 ; i  < data.length ; i++){
                var _var = data[i];
                if(_var == skipVariable){
                    continue;
                }
                var _varVal = ''+_var.value;

                //optimization
                if(skipVariable && skipVariable.value && skipVariable.value.indexOf(_var.title)==-1){
                    continue;
                }
                if(expression && expression.indexOf(_var.title)==-1){
                    continue;
                }

                if(_varVal.length==0){
                    continue;
                }
                if(!this.isScript(_varVal) && _varVal.indexOf("'")==-1){
                    _varVal = "'" + _varVal + "'";
                }
                else if(this.isScript(_varVal)){
                    _varVal = this.expressionModel.parseVariable(this,_var);
                }
                if(_varVal==="''"){
                    _varVal="'0'";
                }

                //result+="var " + _var.title + " = " + _varVal + ";";
                //result+="\n";
                result.push(_varVal);
            }

            return result;
        },
        variablesToJavascript:function(skipVariable,expression){

            var result='';
            var data = this.variableStore ? this.variableStore.data : this.variables;
            for(var i = 0 ; i  < data.length ; i++){
                var _var = data[i];
                if(_var == skipVariable){
                    continue;
                }
                var _varVal = ''+_var.value;

                //optimization
                if(skipVariable && skipVariable.value && skipVariable.value.indexOf(_var.title)==-1){
                    continue;
                }
                if(expression && expression.indexOf(_var.title)==-1){
                    continue;
                }

                if(_varVal.length==0){
                    continue;
                }
                if(!this.isScript(_varVal)  && _varVal.indexOf("'")==-1){
                    _varVal = "'" + _varVal + "'";
                }
                else if(this.isScript(_varVal)){
                    //_varVal = "''";
                    _varVal = this.expressionModel.parseVariable(this,_var);
                }

                if(_varVal==="''"){
                    _varVal="'0'";
                }

                result+="var " + _var.title + " = " + _varVal + ";";
                result+="\n";
            }

            return result;
        },
        /**
         * Convert from JSON data. Creates all Variables in this scope
         * @param data
         * @returns {Array}
         */
        variablesFromJson:function(data){
            var result = [];
            for(var i = 0; i < data.length ; i++){
                var variable = data[i];
                variable['scope']  = this;
                if(!variable.declaredClass){
                    console.log('   variable has no class ');
                    continue;
                }
                var _class = utils.replaceAll('.','/',variable.declaredClass);
                var variableClassProto = require(_class);
                if(!variableClassProto){
                    console.log('couldnt resolve ' + _class);
                    continue;
                }
                result.push(new variableClassProto(variable));//looks like a leak but the instance is tracked and destroyed in this scope
            }
            return result;
        },
        regenerateIDs:function(blocks){

            var thiz=this;
            var updateChildren=function(block){
                var newId = utils.createUUID();
                var children = thiz.getBlocks({
                    parentId:block.id
                });
                if(children && children.length>0){
                    for(var i = 0 ; i < children.length ; i ++) {
                        var child = children[i];
                        child.parentId=newId;
                        updateChildren(child);
                    }
                }
                block.id=newId;
            };

            for(var i = 0 ; i < blocks.length ; i ++){
                var block=blocks[i];
                updateChildren(block);
            }
        },
        /**
         * Clone blocks
         * @param blocks
         */
        cloneBlocks2:function(blocks,forceGroup){

            var blocksJSON = this.blocksToJson(blocks);
            var tmpScope = this.owner.getScope(utils.createUUID(),null,false);
            var newBlocks = tmpScope.blocksFromJson(blocksJSON,false);
            newBlocks = tmpScope.allBlocks();

            tmpScope.regenerateIDs(newBlocks);
            blocksJSON = tmpScope.blocksToJson(newBlocks);

            if(forceGroup) {
                for (var i = 0; i < blocksJSON.length; i++) {
                    var block = blocksJSON[i];
                    if(block.parentId==null) {//groups are only needed for top level blocks
                        block.group = forceGroup;
                    }
                }
            }
            newBlocks = this.blocksFromJson(blocksJSON);//add it us
            return newBlocks;

        },
        /**
         * Clone blocks
         * @param blocks
         */
        cloneBlocks:function(blocks){

            var blocksJSON = this.blocksToJson(blocks);
            var tmpScope = this.owner.getScope(utils.createUUID(),null,false);
            var newBlocks = tmpScope.blocksFromJson(blocksJSON,false);
            newBlocks = tmpScope.allBlocks();

            for(var i = 0 ; i < newBlocks.length ; i ++){
                var block=newBlocks[i];
                block.id = utils.createUUID();
                block.parentId=null;
            }

            blocksJSON = this.blocksToJson(newBlocks);
            this.blocksFromJson(newBlocks);//add it us
            return newBlocks;

        },
        /**
         * Serializes all blocks to JSON data.
         * It needs a custom conversation because we're having cyclic
         * object dependencies.
         * @returns {Array}
         */
        blocksToJson:function(data){
            try{
                var result = [];
                data = (data && data.length) ? data :  (this.blockStore ? this.blockStore.data : this.blocks);
            //    console.log('blocks to json before : ',data);
                for(var b in data){
                    var block = data[b];
                    if(block.keys==null){
                        continue;
                    }
                    var blockOut={

                        // this property is used to recreate the child blocks in the JSON -> blocks process
                        _containsChildrenIds: []
                    };

                    for(var prop in block){

                        if (prop == 'ctrArgs') {
                            continue;
                        }

                        if( typeof block[prop] !=='function' && !block.serializeField(prop)){
                            continue;
                        }

                        //copy all strings over
                        if( this.isString(block[prop])||
                            this.isNumber(block[prop])||
                            this.isBoolean(block[prop]))
                        {
                            blockOut[prop]=block[prop];
                        }


                        //flatten children to ids. Skip "parent" field

                        if (prop != 'parent') {
                            if ( this.isBlock(block[prop]) )
                            {
                                // if the field is a single block container, store the child block's id
                                blockOut[prop] = block[prop].id;

                                // register this field name as children ID container
                                blockOut._containsChildrenIds.push(prop);

                            } else if ( this.areBlocks(block[prop]))
                            {
                                // if the field is a multiple blocks container, store all the children blocks' id
                                blockOut[prop] = [];

                                for(var i = 0; i < block[prop].length ; i++){
                                    blockOut[prop].push(block[prop][i].id);
                                }

                                // register this field name as children IDs container
                                blockOut._containsChildrenIds.push(prop);
                            }
                        }

                    }

                    result.push(blockOut);
                }
            }catch(e){
                console.error('from json failed : ' +e);
            }
            //return JSON.stringify(result);
           // console.log(JSON.stringify(result));
            return result;
        },
        _createBlockStore:function(){

            debugger;
            var blockData={
                identifier: "id",
                label: "title",
                items:[]
            };

            var blockStore = new StoreAdapter(Observable(new Memory({
                data: blockData,
                getChildren: function(parent, options){

                    if(parent.getChildren){
                        return parent.getChildren(parent);
                    }

                    // Support persisting the original query via options.originalQuery
                    // so that child levels will filter the same way as the root level
                    var op = lang.mixin({}, options && options.originalQuery || null, { parentId: parent.id });
                    var res = this.query(op, options);


                    return res;
                },
                mayHaveChildren: function(parent){
                    if(parent.mayHaveChildren){
                        return parent.mayHaveChildren(parent);
                    }
                    return parent.items!=null && parent.items.length>0;
                },
                query: function (query, options){
                    query = query || {};
                    options = options || {};

                    if (!query.parentId && !options.deep) {
                        // Default to a single-level query for root items (no parent)
                        query.parentId = undefined;
                    }
                    return this.queryEngine(query, options)(this.data);
                }

            })));

            return blockStore;
        },
        /**
         * Convert from JSON data. Creates all blocks in this scope
         * @param data
         * @returns {Array}
         */
        blocksFromJson:function(data,check) {

            var resultSelected = [];
            for(var i = 0; i < data.length ; i++){
                var block = data[i];
                block['scope']  = this;
                if(block._containsChildrenIds==null){
                    block._containsChildrenIds=[];
                }

                // Store all children references into "children"
                var children = [];
                for(var cf = 0 ; cf < block._containsChildrenIds.length ; cf ++)
                {
                    var propName = block._containsChildrenIds[cf];
                    children[propName] = block[propName];
                    block[propName] = null;
                }
                delete block._containsChildrenIds;

                // Create the block
                if(!block.declaredClass){
                    console.log('   not a class ');
                    continue;
                }
                var blockClassProto=null;
                var _class=null;
                try{
                    _class = utils.replaceAll('.','/',block.declaredClass);
                    blockClassProto = require(_class);
                }catch(e){
                    console.error('couldnt resolve class '+_class);

                }
                if(!blockClassProto){
                    console.log('couldnt resolve ' + _class);
                    continue;
                }

                var blockOut = factory.createBlock(blockClassProto,block);

                // assign the children references into block._children
                blockOut._children=children;
                resultSelected.push(blockOut);

            }

            //2nd pass, update child blocks
            var allBlocks = this.allBlocks();
            for(var i = 0; i < allBlocks.length ; i++){
                var block = allBlocks[i];

                if(block._children) {
                    // get all the block container fields
                    for (var propName in block._children)
                    {
                        if (typeof block._children[propName] == "string")
                        {
                            // single block
                            var child = this.getBlockById( block._children[propName] );
                            if (!child) {
                                console.log('   couldnt resolve child: ' + block._children[propName],block);
                                continue;
                            }
                            block[propName] = child;
                            child.parent=block;
                        }
                        else if (typeof block._children[propName] == "object")
                        {
                            // multiple blocks
                            block[propName] = [];
                            for(var j = 0; j < block._children[propName].length ; j++){
                                var child = this.getBlockById(block._children[propName][j]);
                                if (!child) {
                                    console.log('   couldnt resolve child: ' + block._children[propName][j]);
                                    continue;
                                }
                                block[propName].push(child);
                            }

                        }
                    }
                    delete block._children;
                }

                if(check!==false && block.parentId!=null){
                    var parent = this.getBlockById(block.parentId);
                    if(parent==null){
                        console.error('have orphan block!',block);
                        debugger;
                        block.remove();
                    }
                }
            }
            var result = this.allBlocks();
            //console.log('after json deserialize ' , result);
            return resultSelected;
        },
        /***
         * Returns a block from the scope
         *
         * @param name  =>  block name
         * @return block
         */
        getBlockByName:function(name) {
            for(var b in this.blocks){
                if(this.blocks[b].name===name){
                    return this.blocks[b];
                }
            }
        },
        /***
         * Returns a block from the scope
         *
         * @param name  =>  block name
         * @return block
         */
        getBlockById:function(id) {
            return this.blocks[id];
        },
        /**
         * Returns an array of blocks
         * @param blocks
         */
        flatten:function(blocks){
            var result = [];

            for(var b in blocks){

                var block = blocks[b];

                if(block.keys==null){
                    continue;
                }
                result.push(block);

                for(var prop in block){

                    if (prop == 'ctrArgs') {
                        continue;
                    }

                    //flatten children to ids. Skip "parent" field
                    if (prop != 'parent') {
                        if ( this.isBlock(block[prop]) )
                        {
                            // if the field is a single block container, store the child block's id
                            result.push(block[prop]);

                        } else if ( this.areBlocks(block[prop]))
                        {
                            for(var i = 0; i < block[prop].length ; i++){
                                result.push(block[prop][i]);
                            }
                        }
                    }
                }
            }
            return result;
        },
        /***
         * Runs the block
         *
         * @param mixed
         * @returns result
         */
        solveBlock:function(mixed,settings,force) {


            settings = settings || {
                highlight:false
            };


            var block = null;
            if(this.isString(mixed)){
                block = this.getBlockByName(mixed);
            }else if(this.isObject(mixed)){
                block = mixed;
            }
            var result = null;
            if(block){
                if(settings.force !==true && block.enabled==false){
                    console.error('block is not enabled');
                    return null;
                }
                if(settings.force===true){
                    settings.force=false;
                }
                result = block.solve(this,settings);
            }else{
                console.error('solving block failed, have no block! ' , mixed);
            }
            return result;
        },
        /***
         * Solves all the commands into [items]
         *
         * @param manager   =>  BlockManager
         * @return  list of commands to send
         */
        solve:function(scope,settings) {
            var ret='';

            for(var n = 0; n < this.items.length ; n++)
            {
                ret += this.items[n].solve(scope,settings);
            }

            return ret;
        },
        /***
         * Parses an expression
         *
         * @param expression
         * @returns {String} parsed expression
         */
        parseExpression:function(expression,addVariables) {
            return this.expressionModel.parse(this,expression,addVariables);
        },
        isString: function (a) {
            return typeof a == "string"
        },
        isNumber: function (a) {
            return typeof a == "number"
        },
        isBoolean: function (a) {
            return typeof a == "boolean"
        },
        isObject:function(a){
            return typeof a === 'object';
        },
        isBlock:function (a) {
            var ret = false;

            if ( ( typeof a == "object" ) && ( a!=null ) && (a.length == undefined) )
            {
                if ( a.serializeMe )
                {
                    ret = true;
                }
            }
            return ret;
        },
        areBlocks:function(a) {
            var ret = false;

            if ( ( typeof a == "object" ) && ( a!=null ) && (a.length > 0) )
            {
                if ( this.isBlock( a[0] )) {
                    ret = true;
                }
            }
            return ret;
        },
        /**
         *
         * @private
         */
        _onVariableChanged:function(evt){
            if(evt.item && this.expressionModel.variableFuncCache[evt.item.title]){
                delete this.expressionModel.variableFuncCache[evt.item.title];
            }
        },
        init:function(){
            this.subscribe(types.EVENTS.ON_DRIVER_VARIABLE_CHANGED,this._onVariableChanged);
        },
        /**
         *
         */
        _destroy:function(){

            var allblocks = this.allBlocks();
            for (var i = 0; i < allblocks.length; i++) {
                var obj = allblocks[i];
                if(obj._destroy){
                    obj._destroy();
                }
                if(obj.destroy){
                    obj.destroy();
                }
            }

        },

        /**
         *
         * @param source
         * @param target
         * @param before
         * @param add
         * @returns {boolean}
         */
        moveTo:function(source,target,before,add){


            /**
             * treat first the special case of adding an item
             */
            if(add){

                //remove it from the source parent and re-parent the source
                if(target.canAdd && target.canAdd()){

                    var sourceParent = this.getBlockById(source.parentId);
                    if(sourceParent){
                        sourceParent.removeBlock(source,false);
                    }
                    target.add(source,null,null);
                    return;
                }else{
                    console.error('cant reparent');
                    return false;
                }
            }


            //for root level move
            if(!target.parentId && add==false){

                console.error('root level move');

                //if source is part of something, we remove it
                var sourceParent = this.getBlockById(source.parentId);
                if(sourceParent && sourceParent.removeBlock){
                    sourceParent.removeBlock(source,false);
                    source.parentId=null;
                    source.group=target.group;
                }

                var itemsToBeMoved=[];
                var groupItems = this.getBlocks({
                    group:target.group
                });

                var rootLevelIndex=[];
                var store = this.getBlockStore();

                var sourceIndex = store.index[source.id];
                var targetIndex = store.index[target.id];
                for(var i = 0; i<groupItems.length;i++){

                    var item = groupItems[i];
                    //keep all root-level items

                    if( groupItems[i].parentId==null && //must be root
                        groupItems[i]!=source// cant be source
                        ){

                        var itemIndex = store.index[item.id];
                        var add = before ? itemIndex >= targetIndex : itemIndex <= targetIndex;
                        if(add){
                            itemsToBeMoved.push(groupItems[i]);
                            rootLevelIndex.push(store.index[groupItems[i].id]);
                        }
                    }
                }

                //remove them the store
                for(var j = 0; j<itemsToBeMoved.length;j++){
                    store.remove(itemsToBeMoved[j].id);
                }

                //remove source
                this.getBlockStore().remove(source.id);

                //if before, put source first
                if(before){
                    this.getBlockStore().put(source);
                }

                //now place all back
                for(var j = 0; j<itemsToBeMoved.length;j++){
                    store.put(itemsToBeMoved[j]);
                }

                //if after, place source back
                if(!before){
                    this.getBlockStore().put(source);
                }

                return true;

            //we move from root to lower item
            }else if( !source.parentId && target.parentId && add==false){
                source.group = target.group;
                if(target){

                }

            //we move from root to into root item
            }else if( !source.parentId && !target.parentId && add){

                console.error('we are adding an item into root root item');
                if(target.canAdd && target.canAdd()){
                    source.group=null;
                    target.add(source,null,null);
                }
                return true;

            // we move within the same parent
            }else if( source.parentId && target.parentId && add==false && source.parentId === target.parentId){
                console.error('we move within the same parents');
                var parent = this.getBlockById(source.parentId);
                if(!parent){
                    console.error('     couldnt find parent ');
                    return false;
                }

                var maxSteps = 20;
                var items = parent[parent._getContainer(source)];

                var cIndexSource = source.indexOf(items,source);
                var cIndexTarget = source.indexOf(items,target);
                var direction = cIndexSource > cIndexTarget ? -1 : 1;
                var distance = Math.abs(cIndexSource - ( cIndexTarget + (before ==true ? -1 : 1)));
                for(var i = 0 ; i < distance -1;  i++){
                    parent.move(source,direction);
                }
                return true;

                // we move within the different parents
            }else if( source.parentId && target.parentId && add==false && source.parentId !== target.parentId){                console.log('same parent!');

                console.error('we move within the different parents');
                //collect data

                var sourceParent = this.getBlockById(source.parentId);
                if(!sourceParent){
                    console.error('     couldnt find source parent ');
                    return false;
                }

                var targetParent = this.getBlockById(target.parentId);
                if(!targetParent){
                    console.error('     couldnt find target parent ');
                    return false;
                }


                //remove it from the source parent and re-parent the source
                if(sourceParent && sourceParent.removeBlock && targetParent.canAdd && targetParent.canAdd()){
                    sourceParent.removeBlock(source,false);
                    targetParent.add(source,null,null);
                }else{
                    console.error('cant reparent');
                    return false;
                }

                //now proceed as in the case above : same parents
                var items = targetParent[targetParent._getContainer(source)];
                if(items==null){
                    console.error('weird : target parent has no item container');
                }
                var cIndexSource = targetParent.indexOf(items,source);
                var cIndexTarget = targetParent.indexOf(items,target);
                if(!cIndexSource || !cIndexTarget){
                    console.error(' weird : invalid drop processing state, have no valid item indicies');
                    return;
                }
                var direction = cIndexSource > cIndexTarget ? -1 : 1;
                var distance = Math.abs(cIndexSource - ( cIndexTarget + (before ==true ? -1 : 1)));
                for(var i = 0 ; i < distance -1;  i++){
                    targetParent.move(source,direction);
                }
                return true;
            }

            return false;
        }

    });
});