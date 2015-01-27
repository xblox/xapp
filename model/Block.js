define([
    "dojo/_base/declare",
    "dojo/Deferred",
    "dojo/_base/lang",
    "./ModelBase",
    "xide/factory",
    "xide/utils"
], function(declare,Deferred,lang,ModelBase,factory,utils){

    // summary:
    //		The command model. A 'command' consists out of a few parameters and a series of
    //      expresssions. Those expressions need to be evaluated before send them to the device

    // module:
    //		xblox.model.Block
    return declare("xblox.model.Block",[ModelBase],{


        //declaredClass: String (dcl internals, private!)


        // add the block to the JSON serialization
        serializeMe: true,

        //name: String
        //  the action's name, it should be unique within a scope
        name:null,

        //name: description
        //  the blocks internal user description
        description:'No Description',

        //name: enabled
        //  enables or disables the block
        enabled:true,

        /**
         * @member shareTitle {string}
         */
        shareTitle:'',
        /**
         *
         */
        sharable:false,

        //items: Array (xblox.model.ModelBase)
        //  This is plain and simple a series of commands to send to the device. The send field however can contain
        //  also variable names, those expressions needs to be evaluated before sending it to the device
        //
        items:null,

        //parent: String
        //  Internal field to specifiy a parent command by its Id
        parent:null,

        canDelete:true,

        renderBlockIcon:true,

        /**
         * @var temporary variable to hold remainin blocks to run
         */
        _return:null,

        /**
         * @var temporary variable to store the last result
         */
        _lastResult:null,

        _deferredObject:null,

        _currentIndex:0,

        _lastRunSettings:null,

        _onLoaded:false,

        beanType:'BLOCK',

        /**
         * ignore these due to serialization
         */
        ignoreSerialize:[
            '_currentIndex',
            '_deferredObject',
            '_return',
            'parent',
            'ignoreSerialize',
            '_lastRunSettings',
            '_onLoaded',
            'beanType',
            'sharable'
        ],

        //  standard call from interface
        canAdd:function(){
            return null;
        },

        // adds array2 at the end of array1 => useful for returned "solve" commands
        addToEnd:function(array1,array2) {
            if(array2 && array1.length!=null && array2.length!=null){
                array1.push.apply(array1,array2);
            }else{
                console.error('add to end failed : invalid args in'  +this.name);
            }
            return array1;
        },
        removeBlock:function(what,del){
            if(what){

                if(del!==false && what.empty){
                    what.empty();
                }

                if(del!==false){
                    delete what.items;
                }
                what.parent=null;
                if(this.items){
                    this.items.remove(what);
                }
            }
        },
        /////////////////////////////////////////////////////////////////////////////////////
        //
        //  Accessors
        //
        /////////////////////////////////////////////////////////////////////////////////////
        _getContainer:function(item){
            return 'items';
        },
        /////////////////////////////////////////////////////////////////////////////////////
        //
        //  Utils
        //
        /////////////////////////////////////////////////////////////////////////////////////
        empty:function(what){
            try{
                this._empty(what)
            }catch(e){

                debugger;
            }
        },
        /*
         * Empty : removes all child blocks, recursivly
         * @param proto : prototype|instance
         * @param ctrArgs
         * @returns {*}
         */
        _empty:function(what){

            var data = what || this.items;
            if(data){
                for(var i = 0 ; i< data.length ; i++){
                    var subBlock = data[i];

                    if(subBlock && subBlock.empty){
                        subBlock.empty();
                    }
                    if(subBlock && this.scope && this.scope.blockStore){
                        this.scope.blockStore.remove(subBlock.id);
                    }
                }
            }
        },
        /**
         * This was needed. FF bug.
         * @param data
         * @param obj
         * @returns {boolean}
         */
        containsItem:function(data,obj) {
            var i = data.length;
            while (i--) {
                if (data[i].id === obj.id) {
                    return true;
                }
            }
            return false;
        },
        /**
         * This was needed. FF bug
         * @param data
         * @param obj
         * @returns {*}
         */
        indexOf:function(data,obj) {
            var i = data.length;
            while (i--) {
                if (data[i].id === obj.id) {
                    return i;
                }
            }
            return -1;
        },
        _getBlock:function(dir){
            try{
                var item=this;
                if(!item || !item.parentId){
                    return false;
                }
                //get parent
                var parent = this.scope.getBlockById(item.parentId);
                if(!parent){
                    return null;
                }
                var items = parent[parent._getContainer(item)];
                if(!items || items.length<2  || !this.containsItem(items,item)){
                    return null;
                }
                var cIndex = this.indexOf(items,item);
                if(cIndex+(dir) < 0){
                    return false;
                }
                var upperItem = items[cIndex +(dir)];
                if(upperItem){
                    return upperItem;
                }
            }catch(e){
                debugger;
            }
            return null;
        },
        getPreviousBlock:function(){
            return this._getBlock(-1);
        },
        getNextBlock:function(){
            return this._getBlock(1);
        },
        getPreviousResult:function(){

            var parent = this.getPreviousBlock() || this.getParent();
            if(parent && parent._lastResult!=null){

                if(this.isArray(parent._lastResult)){
                    return parent._lastResult;
                }else{
                    return [parent._lastResult];
                }
            }
            return null;
        },
        _getArg:function(val){

            //try auto convert to number
            var _float = parseFloat(val);
            if(!isNaN(_float)){
                return _float;
            }else{

                if(val==='true' || val==='false'){
                    return utils.toBoolean(val);
                }
                return val;

            }
            return val;
        },
        /**
         *
         * @returns {Array}
         */
        getArgs:function(){

            var result = [];

            if(this.args) {//direct json
                result = utils.getJson(this.args);
                if (result != null && this.isArray(result)) {
                    //return result;
                }
            }

            //try comma separated list
            if(result.length==0 && this.args && this.args.length && this.isString(this.args)){

                if(this.args.indexOf(',')!==-1){
                    var _splitted = this.args.split(',');
                    for(var i = 0 ; i <_splitted.length ; i++){

                        //try auto convert to number
                        var _float = parseFloat(_splitted[i]);
                        if(!isNaN(_float)){
                            result.push(_float);
                        }else{

                            if(_splitted[i]==='true' || _splitted[i]==='false'){
                                result.push(utils.toBoolean(_splitted[i]));
                            }else{
                                result.push(_splitted[i]);//whatever
                            }
                        }
                    }
                    return result;
                }else{
                    result = [this._getArg(this.args)];//single argument
                }
            }
            
            //add previous result
            var previousResult = this.getPreviousResult();
            if(previousResult!=null){
                if(lang.isArray(previousResult) && previousResult.length==1) {
                    result.push(previousResult[0]);
                }else{
                    result.push(previousResult);
                }
            }

            return result;
        },
        /**
         * Called by UI, determines whether a block can be moved up or down
         * @param item
         * @param dir
         * @returns {boolean}
         */
        canMove:function(item,dir){
            try{
                item=item||this;
                if(!item || !item.parentId){
                    return false;
                }
                var parent = this.scope.getBlockById(item.parentId);
                if(!parent){
                    return false;
                }
                var items = parent[parent._getContainer(item)];
                if(!items || items.length<2  || !this.containsItem(items,item)){
                    return false;
                }
                var cIndex = this.indexOf(items,item);
                if(cIndex+(dir) < 0){
                    return false;
                }
                var upperItem = items[cIndex +(dir)];
                if(!upperItem){
                    return false;
                }
            }catch(e){
                debugger;
            }
            return true;
        },
        /**
         * Moves an item up/down in the container list
         * @param item
         * @param dir
         * @returns {boolean}
         */
        move:function(item,dir){

            item=item||this;

            if(!item || !item.parentId){
                return false;
            }
            var parent = this.scope.getBlockById(item.parentId);
            if(!parent){
                return false;
            }
            var items = parent[parent._getContainer(item)];
            if(!items || items.length<2  || !this.containsItem(items,item)){
                return false;
            }

            var cIndex = this.indexOf(items,item);
            if(cIndex+(dir) < 0){
                return false;
            }
            var upperItem = items[cIndex + (dir)];
            if(!upperItem){
                return false;
            }
            items[cIndex + (dir)]=item;
            items[cIndex]=upperItem;
            return true;
        },
        /*
         * Remove : as expected, removes a block
         * @param proto : prototype|instance
         * @param ctrArgs
         * @returns {*}
         */
        remove:function(what){

            if(this.parentId !=null && this.parent==null){
                this.parent = this.scope.getBlockById(this.parentId);
            }

            if(this.parent && this.parent.removeBlock){
                this.parent.removeBlock(this);
                return;
            }
            what = what || this;
            if(what){

                if(what.empty){
                    what.empty();
                }

                delete what.items;
                what.parent=null;
                if(this.items){
                    this.items.remove(what);
                }
            }

        },
        prepareBlockContructorArgs:function(ctorArgs){
            if(!ctorArgs){
                ctorArgs={};
            }
            //prepare items
            if(!ctorArgs['id']){
                ctorArgs['id']=this.createUUID();
            }
            if(!ctorArgs['items']){
                ctorArgs['items']=[];
            }

            //create a global scope if none has been provided
            if(!ctorArgs['scope']){
                //ctorArgs['scope']=thiz.getScope('global')
            }
        },
        /**
         * Private add-block function
         * @param proto
         * @param ctrArgs
         * @param where
         * @returns {*}
         * @private
         */
        _add:function(proto,ctrArgs,where){

            var _block=null;
            try{
                //create or set
                if(ctrArgs){

                    //use case : normal object construction
                    this.prepareBlockContructorArgs(ctrArgs);
                    _block = factory.createBlock(proto,ctrArgs);
                }else{
                    //use case : object has been created so we only do the leg work
                    if(ctrArgs==null){
                        _block =  proto;
                    }
                    //@TODO : allow use case to use ctrArgs as mixin for overriding
                }
                ///////////////////////
                //  post work

                //inherit scope
                _block.scope=this.scope;

                //add to scope
                if (this.scope) {
                    this.scope.registerBlock(_block);
                }
                //pass parent
                _block.parent=this;
                //pass parent id
                _block.parentId=this.id;

                //add to items
                if(where==null){

                    if(!this.items){
                        this.items=[];
                    }
                    this.items.push(_block);//@TODO data integrity?

                }else{
                    if(this[where] && this[where].push){
                        this[where].push(_block);
                    }
                }
                //register in scope? @TODO: introduce and handle object creation bitmask
                //this.scope.blocks[]

                //@TODO :   check dirty
                //      :   add watchers
                //      :   spit events (ctor flags)
                return _block;

            }catch(e){
                debugger;
            }
            return null;

        },
        /**
         * Public add block function
         * @param proto
         * @param ctrArgs
         * @param where
         * @returns {*}
         */
        add:function(proto,ctrArgs,where){
            return this._add(proto,ctrArgs,where);
        },
        /////////////////////////////////////////////////////////////////////////////////////
        //
        //  Run 
        //
        /////////////////////////////////////////////////////////////////////////////////////
        getContext:function(){

            if(this.scope.context && this.scope.context.instance){
                return this.scope.context.instance;
            }
            return null;
        },
        resolved:function(){

            if(this._deferredObject){
                this._deferredObject.resolve();
                delete this._deferredObject;
            }
        },
        /***
         * Solves all the commands into items[]
         *
         * @param manager   =>  BlockManager
         * @return  list of commands to send
         */
        _solve:function(scope,settings) {

            settings = settings || {
                highlight:false
            };
            var ret=[];
            for(var n = 0; n < this.items.length ; n++)
            {
                var block = this.items[n];
                this.addToEnd( ret , block.solve(scope,settings));
            }

            return ret;
        },
        /***
         * Solves all the commands into items[]
         *
         * @param manager   =>  BlockManager
         * @return  list of commands to send
         */
        solve:function(scope,settings) {

            settings = settings || {
                highlight:false
            };
            var ret=[];

            for(var n = 0; n < this.items.length ; n++)
            {
                var block = this.items[n];
                this.addToEnd( ret , block.solve(scope,settings));
            }
            return ret;
        },
        /***
         * Solves all the commands into items[]
         *
         * @param manager   =>  BlockManager
         * @return  list of commands to send
         */
        solveMany:function(scope,settings) {

            if(!this._lastRunSettings && settings){
                this._lastRunSettings= settings;
            }

            settings = this._lastRunSettings || settings;


            this._currentIndex=0;
            this._return=[];

            var ret=[], items = this[this._getContainer()];
            if(items.length) {
                var res = this.runFrom(items,0,settings);
                this.onSuccess(this, settings);
                return res;
            }else{
                this.onSuccess(this, settings);
            }
            return ret;
        },
        runFrom:function(blocks,index,settings){

            var thiz=this,
                blocks = blocks || this.items;

            var onFinishBlock = function(block,results){
                block._lastResult=block._lastResult || results;
                thiz._currentIndex++;
                thiz.runFrom(blocks,thiz._currentIndex,settings);
            };

            var wireBlock = function(block){
                block._deferredObject.then(function(results){
                    onFinishBlock(block,results);
                });
            };
            
            if(blocks.length) {
                for (var n = index; n < blocks.length; n++) {
                    var block = blocks[n];
                    if(block.deferred===true){
                        block._deferredObject = new Deferred();
                        this._currentIndex=n;
                        wireBlock(block);
                        this.addToEnd(this._return, block.solve(this.scope, settings));
                        break;
                    }else {
                        this.addToEnd(this._return, block.solve(this.scope, settings));
                    }
                }

            }else{
                this.onSuccess(this, settings);
            }

            return this._return;
        },
        /////////////////////////////////////////////////////////
        //
        //  UI related
        //
        /////////////////////////////////////////////////////////
        onActivity:function(block,settings,event){
            this.publish(event,null,block);
        },
        /**
         *
         * @param block
         * @param settings
         */
        onRun:function(block,settings){

            var highlight = settings && settings.highlight;
            if(block && highlight){
                this.onActivity(block,settings,this.types.EVENTS.ON_RUN_BLOCK);
            }
        },
        onFailed:function(block,settings){
            var highlight = settings && settings.highlight;
            if(block && highlight){
                this.onActivity(block,settings,this.types.EVENTS.ON_RUN_BLOCK_FAILED);
            }
        },
        onSuccess:function(block,settings){
            var highlight = settings && settings.highlight;
            if(block && highlight){
                this.onActivity(block,settings,this.types.EVENTS.ON_RUN_BLOCK_SUCCESS);
            }
        },
        canDisable:function(){
          return true;
        },
        getParent:function(){
            if(this.parentId){
                return this.scope.getBlockById(this.parentId);
            }
            return null;
        },
        getDefaultFields:function(){

            var fields = [];

            if(this.canDisable && this.canDisable()!==false){
                fields.push(
                    this.utils.createCI('enabled',0,this.enabled,{
                        group:'General',
                        title:'Enabled',
                        dst:'enabled'
                    })
                );
            }

            fields.push(this.utils.createCI('condition',26,this.description,{
                    group:'Description',
                    title:'Description',
                    dst:'description',
                    useACE:false
            }));

            if(this.sharable){

                fields.push(
                    this.utils.createCI('enabled',13,this.shareTitle,{
                        group:'Share',
                        title:'Title',
                        dst:'shareTitle',
                        toolTip:'Enter an unique name to share this block!'
                    })
                );
            }

            return fields;
        },
        getFields:function(){
            return this.getDefaultFields();
        },
        toFriendlyName:function(str){
            var special = [ "[" ,"]" , "(" , ")" , "{", "}"];
            for (var n = 0; n < special.length ; n++ )
            {
                str = str.replace(special[n],'');
            }
            str = utils.replaceAll('==',' equals ',str);
            str = utils.replaceAll("'",'',str);
            return str;
        },
        getIconClass:function(){
          return null;
        },
        getBlockIcon:function(symbol){
            symbol = symbol || '';
            return this.renderBlockIcon ==true ? '<span class="xBloxIcon">' + symbol + '</span>' : '';
        },
        serializeField:function(name){
            return this.ignoreSerialize.indexOf(name)==-1;//is not in our array
        },
        onLoad:function(){

        },
        activate:function(){

        },
        deactivate:function(){

        },
        onFieldsRendered:function(block,cis){

        },
        onChangeField:function(field,newValue){

            if(field == 'enabled'){
                if(newValue==true){
                    this.activate();
                }else{
                    this.deactivate();
                }
            }
        }

    });
});