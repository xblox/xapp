define([
    "dojo/_base/declare",
    "xblox/model/Block",
    "xblox/model/Statement"], function(declare,Block,Statement){

    // summary:
    //		The If Block model. Contains a condition and some blocks to be run depending on the condition result

    // module:
    //		xblox.model.logic.IfBlock
    return declare("xblox.model.logic.IfBlock",[Block],{

        // condition: (String) expression to be evaluated
        condition: 'Invalid Expression',

        // consequent: (Block) block to be run if the condition is true
        consequent:null,

        // elseIfBlocks: (optional) Array[ElseIfBlock] -> blocks to be run if the condition is false. If any of these blocks condition is
        //          true, the elseIf/else sequence stops
        elseIfBlocks:null,

        // alternate: (optional) (Block) -> block to be run if the condition is false and none of the "elseIf" blocks is true
        alternate: null,

        //  standard call from interface
        canAdd:function(){
            return [];
        },

        //  autoCreateElse : does auto creates the else part
        autoCreateElse:true,

        //  name : this name is displayed in the block row editor
        name:'if',
        //  add
        //
        // @param proto {mixed : Prototype|Object} : the new block's call prototype or simply a ready to use block
        // @param ctrArgs {Array} : constructor arguments for the new block
        // @param where {String} : consequent or alternate or elseif
        // @returns {Block}
        //
        add:function(proto,ctrArgs,where){
            var _args = arguments;
            if(where==null){
                where = 'consequent';
            }
            var _block = this._add(proto,ctrArgs,where);
            return _block;

        },

        //  overrides default store integration
        addToStore:function(store){
            //add our self to the store
            store.put(this);
        },

        /**
         * Store function override
         * @param parent
         * @returns {boolean}
         */
        mayHaveChildren:function(parent){
            return this.consequent!=null && this.consequent.length>0;
        },

        /**
         * Store function override
         * @param parent
         * @returns {Array}
         */
        getChildren:function(parent){
            var result=[];

            if(this.consequent){
                result=result.concat(this.consequent);
            }
            return result;
        },

        /**
         * Block row editor, returns the entire text for this block
         * @returns {string}
         */
        toText:function(){
            return this.getBlockIcon('E') + this.name + ' ' + this.toFriendlyName(this.condition);
        },

        /***
         * Solves the if block
         * @param scope
         */
        solve:function(scope,settings) {
            // 1. Check the condition
            var solvedCondition = this._checkCondition(scope);
            // 2. TRUE? => run consequent
            if (solvedCondition) {
                this.onSuccess(this,settings);
                var result = null;
                if(this.consequent && this.consequent.length ){
                    for(var i = 0;i <this.consequent.length ; i++){

                        result = this.consequent[i].solve(scope,settings);
                    }
                }
                return result;
            } else {
                // 3. FALSE?
                var anyElseIf = false;

                this.onFailed(this,settings);

                if (this.elseIfBlocks)
                {
                    // 4. ---- check all elseIf blocks. If any of the elseIf conditions is true, run the elseIf consequent and
                    //           stop the process
                    for( var n = 0;  ( n < this.elseIfBlocks.length ) && (!anyElseIf) ; n++)
                    {
                        if ( this.elseIfBlocks[n].declaredClass == "xblox.model.logic.ElseIfBlock" )
                        {
                            if (this.elseIfBlocks[n]._checkCondition(scope))
                            {
                                anyElseIf = true;
                                return this.elseIfBlocks[n].consequent.solve(scope,settings);
                            }
                        }
                    }
                }

                // 5. ---- If none of the ElseIf blocks has been run, run the alternate
                if ((this.alternate && this.alternate.length>0) && (!anyElseIf))
                {
                    var result = null;
                    for(var i = 0;i <this.alternate.length ; i++){

                        result = this.alternate[i].solve(scope,settings);
                    }
                    //return this.alternate.solve(scope);
                    return result;
                }
            }
            return [];
        },

        /**
         * Default override empty. We have 3 arrays to clean : items, alternate and consequent
         * @param what
         */
        empty:function(what){
            this._empty(this.alternate);
            this._empty(this.consequent);
            this._empty(this.items);
        },

        /**
         * Deletes us or children block in alternate or consequent
         * @param what
         */
        removeBlock:function(what){
            if(what){

                if(what && what.empty){
                    what.empty();
                }
                delete what.items;
                what.parent=null;

                this.alternate.remove(what);
                this.consequent.remove(what);
            }
        },
        // evaluate the if condition
        _checkCondition:function(scope) {
            return scope.parseExpression(this.condition +';',true);
        },
        _getContainer:function(item){
            if(this.consequent.contains(item)){
                return 'consequent';
            }else if(this.alternate.contains(item)){
                return 'alternate';
            }
            return '_';
        },
        /**
         * Default override, prepare all variables
         */
        init:function(){

            this.alternate = this.alternate||[];
            this.consequent = this.consequent||[];
            for(var i = 0;i <this.alternate.length ; i++){
                this.alternate[i].parentId=this.id;
                this.alternate[i].parent=this;
            }
            for(var i = 0;i <this.consequent.length ; i++){
                this.consequent[i].parentId=this.id;
                this.consequent[i].parent=this;
            }
            var store = this.scope.blockStore;
        },
        /**
         * UI
         * @returns {*}
         */
        getFields:function(){

            var thiz=this;
            var fields = this.inherited(arguments);
            fields.push(
                this.utils.createCI('condition',25,this.condition,{
                    group:'General',
                    title:'Expression',
                    dst:'condition',
                    delegate:{
                        runExpression:function(val,run,error){
                            return thiz.scope.expressionModel.parse(thiz.scope,val,false,run,error);
                        }
                    }
                })
            );

            return fields;
        },
        postCreate:function(){

            var store = this.scope.blockStore;

            if(this.autoCreateElse || this.alternate.length>0 ){

                //create store wrapper for tree representation
                var _statement = new Statement({
                    name:'else',
                    items:this.alternate,
                    group:this.group,//if we are child, don't set the group, otherwise it goes as top-level-block!
                    owner:this,
                    dstField:'alternate',
                    parentId:this.parentId,
                    parent:this.parent,
                    scope:this.scope,
                    canAdd:function(){
                        return [];
                    },
                    canEdit:function(){
                        return false;
                    }
                });

                this.items.push(_statement);//deletes the statement on remove()
                for(var i=0; i < this.alternate.length ; i++){
                    this.alternate[i].parentId=_statement.id;
                    this.alternate[i].parent=_statement;
                }
                store.put(_statement);

                if(this.parent && this.parent.declaredClass==='xblox.model.logic.IfBlock'){
                    this.parent.consequent.push(_statement);
                }
                if(this.parent && this.parent.items!=null){
                    this.parent.items.push(_statement);
                }
            }
        },
        /////////////////////////////////////////////////////////
        //
        //  Code generation
        //
        /////////////////////////////////////////////////////////
        _toPHP:function(params){

        },
        _toJavascript:function(params){

        },
        toCode:function(lang,params){
            switch(lang){
                case 'Javascript':
                    return this._toJavascript();
                case 'PHP':
                    return this._toPHP();
            }
        }

    });
});