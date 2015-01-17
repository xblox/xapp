define([
    'dojo/_base/declare',
    'dojo/dom-class',
    'dijit/Tree',
    'xide/views/BeanView',
    'xide/views/BeanTreeView',
    'xide/factory',
    'xide/types',
    "dojo/store/Memory",
    "dojo/store/Observable",
    "dijit/tree/ObjectStoreModel",
    "dijit/tree/dndSource"

],
    function (declare, domClass,Tree, BeanView,BeanTreeView,factory,types,Memory,Observable,
              ObjectStoreModel,dndSource
        )
    {
        return declare("xblox.views.BlockTreeView", [BeanView,BeanTreeView],
            {
                model:null,
                store:null,
                tree:null,
                currentItem:null,
                pMenu:null,
                pMenuContextItem:null,
                currentInsertionNode:null,
                newItemData:null,
                didLoad:false,
                selectable:false,
                rootLabel:'',
                reCreateStore:true,
                beanType:null,
                hasItemActions:function(){
                  return false;
                },
                onReloaded:function(){
                  this.initWidgets();
                },
                _createTreeStore:function(blockData){
                    var data = {
                        items:blockData,
                        identifier:'name',
                        label:'name'
                    };



                    return Observable(new Memory({
                        data: data,
                        getChildren: function(object){
                            return object.items;
                        },
                        mayHaveChildren: function(parent){
                            return parent.items!=null && parent.items.length>0;

                        }
                    }));
                },
                initWidgets:function () {
                    dojo.empty(this.containerNode);
                    var items = [];

                    items = factory.getAllBlocks(null,this,null,null);

                    /*
                    items = factory._getFlowBlocks(null,this,null,null);
                    items = items.concat(factory._getLoopBlocks(null,this,null,null));
                    items = items.concat(factory._getCommandBlocks(null,this,null,null));
                    items = items.concat(factory._getCodeBlocks(null,this,null,null));
                    items = items.concat(factory._getEventBlocks(null,this,null,null));
                    items = items.concat(factory._getLoggingBlocks(null,this,null,null));
                    */


                    //tell everyone
                    factory.publish(types.EVENTS.ON_BUILD_BLOCK_INFO_LIST_END,{
                        items:items
                    });

                    this.store = this._createTreeStore(items);

                    //,DojoDndMixin
                    var SharedDndGridSource = declare([dndSource], {

                        /*
                         copyState: function(){
                         return false; // never copy, only swap
                         },
                         onDropExternal: function(source, nodes, copy, targetItem){

                         },
                         onDropInternal: function(source, nodes, copy, targetItem){
                         console.log('on drop internal');
                         },*/
                        onDrop: function(sourceSource, nodes, copy){
                            console.log('drp',sourceSource);
                            console.log('drp2',nodes);

                        }

                    });
                    /*this.itemSelectEvent=types.EVENTS.ON_DEVICE_SELECTED;
                     this.itemGroupSelectEvent=types.EVENTS.ON_DEVICE_GROUP_SELECTED;*/

                    var root = {
                        name:'Root',
                        items:items
                    };

                    var model = new ObjectStoreModel({
                        store: this.store,
                        root:root,
                        mayHaveChildren: function(parent){
                            return parent.items!=null && parent.items.length>0;
                        }
                    });

                    //on item tree , we want to drop on containers, the root node itself, or between items in the containers
                    var itemTreeCheckItemAcceptance = function(node, source, position){
                        return true;
                    };

                    // on collection tree, only accept itself as the source tree
                    var collectionTreeCheckItemAcceptance = function(node,source,position){
                        return false;
                    };

                    var dndAccept = function(source, nodes){
                        return true;
                    };

                    var tree = new Tree({
                        showRoot:false,
                        model: model,
                        dndController:SharedDndGridSource,
                        checkAcceptance:dndAccept,
                        checkItemAcceptance:itemTreeCheckItemAcceptance,
                        dragThreshold:8,
                        betweenThreshold:5,
                        getIconClass:function (/*dojo.data.Item*/ item, /*Boolean*/ opened) {
                            var iclass = (!item || this.model.mayHaveChildren(item)) ? (opened ? "dijitFolderOpened" : "dijitFolderClosed") : "dijitLeaf";
                            if(item && item.iconClass!=null){
                                return item.iconClass;
                            }
                            return iclass;
                        },
                        persist: false		// persist==true is too hard to test
                    }).placeAt(this.containerNode);

                    tree.startup();

                    domClass.add(tree.domNode,'ui-widget');
                    domClass.add(tree.domNode,'ui-state-default');

                    this.resize();

                },
                startup:function () {

                    if (this.didLoad)
                        return;

                    this.inherited(arguments);
                    this.initWidgets();
                    this.didLoad = true;
                }
            });
    })
;