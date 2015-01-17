define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    'dojo/has',
    'xide/types',
    'xide/factory',
    'xblox/model/ModelBase',
    'xblox/model/Scope',
    'xide/mixins/ReloadMixin',
    'xide/manager/ManagerBase',
    'xide/mixins/EventedMixin',
    "dstore/Memory",
    "dojo/store/Observable",
    'dstore/legacy/StoreAdapter',
    'xblox/data/Store',
    "./ClipboardManager",
    "dojo/has!host-browser?xblox/manager/BlockManagerUI"
],
    function (declare,lang,has,types,factory,ModelBase,Scope,ReloadMixin,ManagerBase,EventedMixin,Memory,Observable,StoreAdapter,Store,ClipboardManager,
              BlockManagerUI)
    {
        var blockManager = declare("xblox/manager/BlockManager",[ManagerBase,ReloadMixin],
        {
            clipboardManager:null,
            serviceObject:null,
            _registerActions:function(){},
            getClipboardManager:function(){

                if(!this.clipboardManager) {
                    this.clipboardManager = new ClipboardManager({});
                    this.clipboardManager.init();
                }
                return this.clipboardManager;
            },
            onBlocksReady:function(scope){

                var blocks = scope.allBlocks();
                for (var i = 0; i < blocks.length; i++) {
                    var obj = blocks[i];
                    this.setScriptFunctions(obj,scope,this);
                }
                /**
                 * pick 'On Load' blocks
                 */

                var loadBlocks = scope.getBlocks({
                    group:'On Load'
                });


                if(loadBlocks && loadBlocks.length>0){
                    for (var i = 0; i < loadBlocks.length; i++) {
                        var loadBlock  = loadBlocks[i];
                        if(loadBlock.onLoad){
                            loadBlock.onLoad();
                        }
                    }
                }
            },
            setScriptFunctions:function(obj,scope,owner){

                var thiz=owner;

                //scope.context = obj;//set the context of the blox scope


                ///////////////////////////////////////////////////////////////////////////////
                //
                //  Variables
                //
                ///////////////////////////////////////////////////////////////////////////////
                /**
                 * Add 'setVariable'
                 * @param title
                 * @param value
                 */
                obj.setVariable=function(title,value,save,publish,source){
                    var _variable = this.scope.getVariable(title);
                    if(_variable){
                        _variable.value=value;
                        console.log('setting variable '+title + ' to ' + value);
                    }else{
                        console.log('no such variable : ' + title);
                        return;
                    }
                    if(publish!==false){

                        thiz.publish(types.EVENTS.ON_VARIABLE_CHANGED,{
                            item:_variable,
                            scope:scope,
                            driver:obj,
                            owner:thiz,
                            save:save===true,
                            source:source || types.MESSAGE_SOURCE.BLOX  //for prioritizing
                        });
                    }
                };

                /**
                 * Add getVariable
                 * @param title
                 */
                obj.getVariable=function(title){
                    var _variable = this.scope.getVariable(title);
                    if(_variable){
                        return _variable.value;
                    }
                    return '';
                };

            },
            /***
             *  scope: storage for all registered variables / commands
             */
            scope:null,
            scopes:null,
            //track original create block function
            _createBlock:null,
            getScope:function(id,userData,publish){

                if(!this.scopes){
                  this.scopes={};
                }
                if(!this.scopes[id]){
                    this.scopes[id]=this.createScope(id);
                    this.scopes[id].userData=userData;
                    if(publish!==false){
                        try{
                            factory.publish(types.EVENTS.ON_SCOPE_CREATED,this.scopes[id]);
                        }catch(e){

                        }
                    }
                }
                return this.scopes[id];
            },
            removeScope:function(id){
                if(!this.scopes){
                    this.scopes={};
                }
                if(this.scopes[id]){
                    this.scopes[id]._destroy();
                    delete this.scopes[id];
                }
                return null;
            },
            createScope:function(id){

                var varData={
                    identifier: "id",
                    label: "title",
                    items:[]
                };

                var blockData={
                    identifier: "id",
                    label: "title",
                    items:[]
                };

                //var blockStore = Observable(new Memory({
                var blockStore = new Store({
                    data: blockData,
                    idProperty:'id',
                    _getChildren: function(parent, options){

                        if(parent.getChildren){
                            return parent.getChildren(parent);
                        }
                        // Support persisting the original query via options.originalQuery
                        // so that child levels will filter the same way as the root level
                        var op = lang.mixin({}, options && options.originalQuery || null, { parentId: parent.id });
                        var res = this.query(op, options);


                        return res;
                    },
                    _mayHaveChildren: function(parent){
                        if(parent.mayHaveChildren){
                            return parent.mayHaveChildren(parent);
                        }
                        return parent.items!=null && parent.items.length>0;
                    },
                    _query: function (query, options){
                        return null;
                        query = query || {};
                        options = options || {};

                        if (!query.parentId && !options.deep) {
                            // Default to a single-level query for root items (no parent)
                            query.parentId = undefined;
                        }
                        return this.queryEngine(query, options)(this.data);
                    }
                });

                var variableStore = new Store({
                    data: varData,
                    idProperty:'id',
                    _getChildren: function(parent, options){


                        if(parent.getChildren){
                            return parent.getChildren(parent);
                        }

                        // Support persisting the original query via options.originalQuery
                        // so that child levels will filter the same way as the root level
                        var op = lang.mixin({}, options && options.originalQuery || null, { parentId: parent.id });
                        var res = this.query(op, options);


                        return res;
                    },
                    _mayHaveChildren: function(parent){
                        if(parent.mayHaveChildren){
                            return parent.mayHaveChildren(parent);
                        }
                        return parent.items!=null && parent.items.length>0;
                    }

                });




                var scope = new Scope({
                    variables:[],
                    blocks: [],
                    id:id,
                    owner:this,
                    variableStore:variableStore,
                    blockStore:blockStore,
                    serviceObject:this.serviceObject,
                    config:this.config
                });

                ReloadMixin.prototype.mergeFunctions(scope,EventedMixin.prototype);
                ReloadMixin.prototype.mergeFunctions(scope,ReloadMixin.prototype);
                scope.initReload();
                return scope;
            },

            init:function() {


                this.scope = {
                    variables:[],
                    blocks: []
                };
                ModelBase.prototype.types=types;
                ModelBase.prototype.factory=factory;
                this.getClipboardManager();
                if(this.onReady){
                    this.onReady();
                }
                this.inherited(arguments);

            }
        });

        if(has("host-browser")){
            blockManager = blockManager.extend(BlockManagerUI.prototype);
        }

        return blockManager;
    });