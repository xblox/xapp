define([
    "dojo/_base/array",
    "dojo/_base/declare",
    "dojo/_base/html",
    "dojo/on",
    "dojo/_base/lang", // lang.mixin lang.hitch
    "dojo/dom-class", // domClass.add domClass.contains
    "dojo/dom-geometry", // domGeometry.position
    "dojo/dom-style",
    'xide/views/MainView',
    'xcf/layout/BorderContainer',
    'xcf/layout/ContentPane',
    'xide/types',
    'xide/factory',
    'xide/utils',
    'xcf/handler/DriverHandler',
    'xide/views/ToggleSplitter',
    'xcf/widgets/MainMenu',
    'xide/widgets/ActionToolbar',
    "dojo/store/Memory",
    "dojo/store/Observable",
    "dijit/tree/ObjectStoreModel"
],
    function (array, declare, html, on,lang,domClass, domGeometry, domStyle,MainView,BorderContainer,ContentPane,types,factory,utils,DriverHandler,ToggleSplitter,MainMenu,ActionToolbar,Memory,Observable,ObjectStoreModel)
    {
        return declare("xblox.views.ExpressionEditor", [MainView,DriverHandler],
            {
                /////////////////////////////////////////////////////////////////////////////////////
                //
                //  Variables
                //
                /////////////////////////////////////////////////////////////////////////////////////
                /***
                 * var mainMenu, instance to our main menu
                 */
                mainMenu:null,
                templateString:
                "<div>"+
                    "<div data-dojo-attach-point='layoutMain' data-dojo-type='xcf.layout.BorderContainer' data-dojo-props=\"design:'headline'\" class='layoutMain '>"+
                    "<div data-dojo-attach-point='layoutTop' data-dojo-type='xcf.layout.ContentPane' data-dojo-props=\"region:'top',splitter:'true'\" class='layoutTop ui-state-default'></div>" +
                    "<div data-dojo-attach-point='layoutLeft' data-dojo-type='xcf.layout.ContentPane' data-dojo-props=\"region:'leading',splitter:'true'\" class='layoutLeft'></div>"+
                    "<div data-dojo-attach-point='layoutCenter' data-dojo-type='xcf.layout.ContentPane' data-dojo-props=\"region:'center',splitter:'false'\" class='layoutCenter'></div>"+
                    "<div data-dojo-attach-point='layoutRight' data-dojo-type='xcf.layout.ContentPane' data-dojo-props=\"region:'right',splitter:'true',minSize:'200',toggleSplitterState:'full',toggleSplitterFullSize:'200px' \" class='layoutRightui-state-default'></div>"+
                    "<div data-dojo-attach-point='layoutBottom' data-dojo-type='xcf.layout.ContentPane' data-dojo-props=\"region:'bottom',splitter:'true',toggleSplitterState:'closed',toggleSplitterClosedSize:'0px',toggleSplitterFullSize:'150px'\" class='layoutBottom ui-state-default'><div data-dojo-attach-point='layoutBottomPlaceHolder' style='height: 80px;'></div></div>"+
                    "</div>"+
                    "</div>",
                initMainMenu:function(){

                    this.mainMenu = utils.addWidget(MainMenu,{

                    },this,this.layoutTop.containerNode,true);

                    factory.publish(types.EVENTS.ON_MAIN_MENU_READY,{
                        widget:this.mainMenu
                    });
                },
                initToolbar:function(){

                    this.toolbar = utils.addWidget(ActionToolbar,{
                        delegate:this
                    },this,this.layoutTop.containerNode,true);

                },
                _createExpressionData:function(){

                    var data = {
                        items:[],
                        identifier:'name',
                        label:'name'
                    };

                    data.items = [{
                        name:'Basic Functions',
                        group:'top',
                        children:[
                            {
                                _reference:'Abs'
                            }
                        ],
                        value:null
                    }];


                    return data;

                },
                _creteExpressionStore:function(){

                    var blockData = this._createExpressionData();

                    var blockStore = Observable(new Memory({
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
                    }));

                    return blockStore;
                },
                _createTreeView:function(){

                    var store = this._creteExpressionStore();
                    var model = new ObjectStoreModel({store: store, query: {group: "top"}});

                    var tree = new Tree({
                        model: model,
                        persist: false		// persist==true is too hard to test
                    }).placeAt(this.layoutLeft.containerNode);


                },
                createWidgets:function(){
                    this.initMainMenu();
                    this.initToolbar();
                },
                onReady:function(){
                    var thiz=this;
                    setTimeout(function(){
                        thiz.resize();
                        factory.showStandBy(false);
                    },4000);
                    setTimeout(function(){
                        thiz.layoutMain.resize();
                    },4000);

                },
                ////////////////////////////////////////////////////////////////////////////
                //
                //  Action toolbar & view lifecycle handling
                //
                ////////////////////////////////////////////////////////////////////////////
                onViewAdded:function(){
                	
                },
                /***
                 *
                 * @param evt
                 */
                onViewShow:function(evt){

                    //take care about the action toolbar
                    var view = evt['view'];
                    if( view &&                         // must have a valid view
                        view['hasItemActions']!=null && // must comply with the bean protocol
                        view.hasItemActions()===true)
                    {
                        evt['owner']=view;
                        this.onItemSelected(evt);
                    }
                },
                updateItemActions:function(items,owner,actions,where){

                    //we update only when the action context changed
                    if(this.toolbar && this.toolbar.getCurrentItem()!=items){

                        /*
                        this.publish(types.EVENTS.ON_ACTION_CONTEXT_CHANGED,{
                            newItems:items,
                            owner:owner,
                            actions:actions,
                            where:where
                        });
                        */

                        this.toolbar.clear();
                        if(actions&& actions.length>0){
                            this.toolbar.addActions(actions,owner,items);
                        }
                    }

                },
                onItemSelected:function(evt){
                    var owner = evt['owner'] || evt['view'];
                    if( owner &&                         // must have a valid view
                        owner['hasItemActions']!=null && // must comply with the bean protocol
                        owner.hasItemActions()===true)
                    {
                        var actions = owner.getItemActions();
                        this.updateItemActions(owner.getItem(),owner,actions);
                    }
                },
                onViewRemoved:function(){

                },
                startup:function(){
                    var thiz=this;

                    this.inherited(arguments);

                    this.createWidgets();
                    this.onReady();

                    //done in driver handler
                    this.subscribe(types.EVENTS.ON_DRIVER_SELECTED,this.onDriverSelected);
                    this.subscribe(types.EVENTS.ON_VIEW_SHOW,this.onViewShow);
                    this.subscribe(types.EVENTS.ON_VIEW_REMOVED,this.onViewRemoved);
                    this.subscribe(types.EVENTS.ON_ITEM_SELECTED,this.onItemSelected);
                }
            });
    });