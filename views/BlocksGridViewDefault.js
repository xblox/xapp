define([
        'dojo/_base/declare',
        'dojo/_base/lang',
        'xide/views/BeanView',
        'xide/grid/_Base',
        'xide/types',
        "dgrid/OnDemandGrid",
        "dgrid/Selection",
        "dgrid/Editor",
        "dgrid/Tree",
        "dgrid/extensions/DnD",
        'xblox/widgets/DojoDndMixin',
        'xblox/views/BlocksGridDndSource',
        'xblox/views/BlocksGridView',
        "xblox/widgets/BlockGridRowEditor",
        'xide/bean/Grouped'
    ],
    function (declare, lang, BeanView,_Base,types,
              OnDemandGrid, Selection, Editor, Tree, Dnd, DojoDndMixin, BlocksGridDndSource, BlocksGridView, BlockGridRowEditor,Grouped) {

        return declare("xblox.views.BlocksGridViewDefault", [BeanView, BlocksGridView,Grouped],
            {
                cssClass: 'basicCommandsGridView',
                beanType:'BLOCK',
                //////////////////////////////////////////////////////////////////////////////////
                //
                //  Implement bean interface
                //
                //////////////////////////////////////////////////////////////////////////////////
                hasItemActions:function(){
                    return true;
                },
                getItem: function () {
                    return this.activeItem;
                },
                getItemActions:function(){
                    return this.inherited(arguments);//in Grouped
                },
                onPreview: function (){
                    if (this.delegate.onPreview) {
                        this.delegate.onPreview(this.activeItem);
                    }
                },
                onReloaded: function () {
                    if (this.delegate) {
                        this.delegate.onReloaded();
                    }
                },
                onShow: function () {

                    this.setCurrentGroup(this.delegate.blockGroup);

                    this.inherited(arguments);
                    this.publish(types.EVENTS.RESIZE);

                },
                onGridDataChanged: function (evt) {
                    console.log('on grid data changed ', evt);
                },
                createWidgets: function (store) {


                    var thiz = this;
                    var SharedDndGridSource = declare([BlocksGridDndSource, DojoDndMixin],{
                            blockScope: this.blockScope,
                            delegate: this.delegate,
                            onDndDrop: function (source, nodes, copy, target) {
                                if (this.targetAnchor) {
                                    this._removeItemClass(this.targetAnchor, "Hover");
                                }
                                if (this == target) {
                                    // this one is for us => move nodes!
                                    this.onDrop(source, nodes, copy, target);
                                }
                                this.onDndCancel();
                            }
                        });

                    var baseClasses = [OnDemandGrid,Tree,Editor,_Base,Selection, Dnd];
                    baseClasses = this.getGridBaseClasses(baseClasses,{
                        keyboardNavigation:true,
                        keyboardSelect:false,
                        selection:true

                    });

                    var _ctorArgs = {
                        /*sort: "id",*/
                        cellNavigation: false,
                        sort:null,
                        collection: store,
                        dndConstructor: SharedDndGridSource, // use extension defined above*/
                        columns: [
                            {renderExpando: true, label: "Name", field:"name", sortable: false/*,editor:BlockGridRowEditor*/}
                            /*
                            Tree(editor({
                                label: " Name",
                                field: "name",
                                sortable: true
                            }, BlockGridRowEditor))
                            */
                        ],
                        dndParams: {
                            allowNested: true, // also pick up indirect children w/ dojoDndItem class
                            checkAcceptance: function (source, nodes) {
                                return true;//source !== this; // Don't self-accept.
                            },
                            isSource: true
                        }
                    };

                    if (this.gridParams) {
                        _ctorArgs = lang.mixin(_ctorArgs, this.gridParams);
                    }
                    _ctorArgs.deselectOnRefresh = false;

                    //var grid = new (declare([OnDemandGrid,Selection]))(_ctorArgs, this.containerNode);
                    try {
                        var gridBase = declare(baseClasses,{});
                        //var grid = new (declare(baseClasses))(_ctorArgs, this.containerNode);
                        var grid = new gridBase(_ctorArgs, this.containerNode);
                        //grid.sort("name");
                        //grid.refresh();
                        this.grid = grid;
                        this.onGridCreated(grid);
                    }catch(e){
                        debugger;
                    }
                },
                startup: function () {
                    if (this.didLoad)
                        return;
                    this.inherited(arguments);
                    if (this.store) {
                        this.createWidgets(this.store);
                    }
                    this.didLoad = true;
                }
            });
    })
;