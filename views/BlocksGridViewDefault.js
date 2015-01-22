define([
        'dojo/_base/declare',
        'dojo/_base/lang',
        'xide/views/BeanView',
        'xide/grid/_Base',
        'xide/types',
        "dgrid/OnDemandGrid",
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
              OnDemandGrid, Editor, Tree, Dnd, DojoDndMixin, BlocksGridDndSource, BlocksGridView, BlockGridRowEditor,Grouped) {

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

                    var baseClasses = [OnDemandGrid,_Base,Editor,Tree,Dnd];

                    baseClasses = this.getGridBaseClasses(baseClasses,{
                        keyboardNavigation:true,
                        keyboardSelect:false,
                        selection:true
                    });

                    var _ctorArgs = {
                        cellNavigation: false,
                        sort:null,
                        collection: store,
                        dndConstructor: SharedDndGridSource, // use extension defined above*/
                        shouldHandleKey:function(key){
                            return !(key == 39 || key == 37);
                        },
                        columns: [
                            {renderExpando: true, label: "Name", field:"name", sortable: false,editor:BlockGridRowEditor}
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

                    try {
                        var grid = new (declare(baseClasses))(_ctorArgs, this.containerNode);
                        grid.refresh();
                        this.grid = grid;
                        this.onGridCreated(grid);
                    }catch(e){
                        debugger;
                    }
                },
                startup: function () {
                    this.inherited(arguments);
                    if (this.store) {
                        this.createWidgets(this.store);
                    }
                }
            });
    })
;