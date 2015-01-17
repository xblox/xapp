define([
        'dojo/_base/declare',
        'dojo/_base/lang',
        'xide/utils',
        'xide/factory',
        'xide/types',
        'xide/mixins/EventedMixin',
        'xide/views/ActionTogglePane',
        'xide/widgets/ActionToolbar',
        'dojo/store/Memory',
        'dojo/store/Observable',
        'xblox/model/variables/VariableAssignmentBlock',
        'xblox/delegate/BlockActionMixin',
        'dojo/Stateful'
    ],
    function (declare,
              lang,
              utils, factory, types, EventedMixin, ActionTogglePane, ActionToolbar, Memory, Observable, VariableAssignmentBlock,
              BlockActionMixin,
              Stateful) {
        return declare("xblox.views.GroupedBlockView", [Stateful, EventedMixin, BlockActionMixin],
            {
                cssClass: 'commandSettings',
                settingsPane: null,
                view: null,
                currentItem: null,
                gridView: null,
                attachTo: null,
                title: null,
                gridViewProto: null,
                newRootItemFunction: null,
                newRootItemLabel: 'New Command',
                newRootItemIcon: 'el-icon-video',
                createTestBlocks: false,
                showAllBlocks: false,
                open: true,
                storeField: 'blockStore',
                handleContainerClick: true,
                clearSelection: true,
                keyboardNavigation: true,
                mouseNavigation: true,
                gridParams: null,
                lazy: false,
                titlePane: true,
                canToggle: true,
                onPreview: function (item) {
                    if (item) {
                        this.execute(item);
                    }
                },
                onTitlebarToggled: function (state) {

                    if (this.blockToolbar) {
                        if (!state) {
                            this.blockToolbar.clear();
                        } else {
                            this.onItemSelected(this.currentItem);
                        }
                    }
                },
                onResize: function () {
                    if (this.gridView) {
                        this.gridView.onResize();
                    }
                },
                /////////////////////////////////////////////////////////////////////////
                //
                //  Blox-Editor related
                //
                /////////////////////////////////////////////////////////////////////////
                onGridKeyEnter: function () {
                    this.editBlock(this.getItem());
                },
                onGridMouseDoubleClick: function () {
                    this.editBlock(this.getItem());
                },
                /////////////////////////////////////////////////////////////////////////
                //
                //  Internals
                //
                /////////////////////////////////////////////////////////////////////////
                /**
                 * Callback when we are reloaded: empty root node and re-create all widgets
                 */
                onReloaded: function () {
                    if (this.containerNode) {
                        dojo.empty(this.containerNode);
                    }
                    this.createdWidgets();
                },
                reload: function () {

                    var scope = this.blockScope;
                    var store = scope[this.storeField];
                    this.gridView.grid.set("collection", store.filter({
                        group: this.blockGroup
                    }));

                    //this.gridView.grid.sort("order");
                    this.gridView.refresh();
                },
                addItem2: function (menuItem) {

                    var item = menuItem.item;
                    if (!item) {
                        return;
                    }
                    var target = item.target;
                    var proto = item.proto;
                    var ctorArgs = item.ctrArgs;
                    var where = null;

                    if (target && proto && ctorArgs) {

                        if (target.owner && target.dstField) {
                            where = target.dstField;
                            target = target.owner;
                        }

                        ctorArgs['parentId'] = target.id;
                        ctorArgs['group'] = null;
                        ctorArgs['parent'] = target;//should be obselete

                        var _newBlock = target.add(proto, ctorArgs, where);
                        _newBlock.parent = target;
                    } else if (!target && proto && ctorArgs) {
                        factory.createBlock(proto, ctorArgs);//root block
                    }

                    this.onItemAction();
                    this.gridView.grid.set("store", this.blockScope.blockStore, {
                        group: this.blockGroup
                    });
                },
                getAddActions: function (item) {

                    var thiz = this;
                    if (item && item.canAdd) {
                        if (item.canAdd() == null) {
                            return null;
                        }
                    }
                    var items = [];
                    if (this.showAllBlocks || item) {
                        var variables = this.blockScope.getVariables();
                        var variableItems = [];

                        for (var i = 0; i < variables.length; i++) {
                            variableItems.push({
                                name: variables[i].title,
                                target: item,
                                iconClass: 'el-icon-compass',
                                proto: VariableAssignmentBlock,
                                item: variables[i],
                                ctrArgs: {
                                    variable: variables[i].title,
                                    scope: this.blockScope,
                                    value: '0'
                                }
                            });
                        }
                        items = factory.getAllBlocks(this.blockScope, this, item, this.blockGroup);
                        items.push({
                            name: 'Set Variable',
                            target: item,
                            iconClass: 'el-icon-pencil-alt',
                            items: variableItems
                        });
                        //tell everyone
                        factory.publish(types.EVENTS.ON_BUILD_BLOCK_INFO_LIST_END, {
                            items: items
                        });
                        return items;
                    }
                    if (!item) {

                        if (this.newRootItemFunction) {
                            items.push({
                                name: this.newRootItemLabel,
                                iconClass: this.newRootItemIcon,
                                handler: function () {
                                    thiz.newRootItemFunction();
                                    thiz.onItemAction();
                                }
                            });
                            return items;
                        }

                    }

                },
                excecuteCommand: function (block) {

                    if (!block || !block.scope) {
                        return;
                    }
                    //console.log(' excecuting block -  ' + block.name);
                    try {
                        console.dir(block.scope.solveBlock(block.name));
                    } catch (e) {
                        console.log(' excecuting block -  ' + block.name + ' failed! : ' + e);
                        console.log(printStackTrace().join('\n\n'));
                        console.dir(block.scope);
                    }
                },
                /***
                 * Internal factory to create an Action Toggle Pane
                 * @param name
                 * @param options
                 * @returns {xide.views.ActionTogglePane}
                 */
                createTitlePane: function (name, options) {

                    var thiz = this;
                    var pane = utils.addWidget(ActionTogglePane, {
                        title: name,
                        open: options['open'] != null ? options['open'] : true,
                        lazy: options['lazy'] != null ? options['lazy'] : false,
                        delegate: this,
                        toggleable: options['canToggle'] != null ? options['canToggle'] : true,
                        actions: []
                    }, this, this.attachTo, true);
                    this.view = pane;
                    this.blockToolbar = this.view.toolbar;
                    return pane;
                },
                /***
                 * Internal factory to an data store
                 * @param name
                 * @param options
                 * @returns {dojo/store/Observable}
                 */
                _createVariablesStore: function (data) {
                    var sdata = {
                        identifier: "id",
                        label: "title",
                        items: data
                    };
                    var store = Observable(Memory({data: sdata}));
                    return store;
                },
                /***
                 * Internal factory to create the variable grid view, does also creates the needed store for the grid
                 * @param name
                 * @param options
                 * @returns {xide.views.TitlePane}
                 */
                _createSettingsPane: function (lazy) {

                    var where = null;

                    if (this.titlePane) {
                        this.settingsPane = this.createTitlePane(this.title, {
                            open: this.open,
                            lazy: this.lazy,
                            canToggle: this.canToggle
                        });

                        where = this.settingsPane.containerNode;
                    } else {

                        this.toolbar = utils.addWidget(ActionToolbar, {
                            delegate: this,
                            style: 'display:inline-block;min-height:30px;width:auto;',
                            actions: []
                        }, this, this.attachTo, true);
                        this.blockToolbar = this.toolbar;
                        where = this.attachTo;
                    }


                    //var blockStore = this.blockScope.getBlockStore();
                    var store = this.blockScope[this.storeField] || this.blockStore || this.blockScope.blockStore;

                    var _gridCtorArgs = {
                        store: store,
                        blockScope: this.blockScope,
                        delegate: this,
                        handleContainerClick: this.handleContainerClick,
                        clearSelection: this.clearSelection,
                        keyboardNavigation: this.keyboardNavigation,
                        mouseNavigation: this.mouseNavigation
                    };
                    if (this.gridParams) {
                        _gridCtorArgs = lang.mixin(_gridCtorArgs, this.gridParams);
                    }
                    var gridView = utils.addWidget(this.gridViewProto, _gridCtorArgs, this, where, true);

                    this.gridView = gridView;
                    this.blockStore = store;
                    this.blockGridView = gridView;

                    this.gridView.grid.set("collection", store.filter({group: this.blockGroup}));

                    return this.settingsPane ? this.settingsPane : null;

                },
                onShow: function (evt) {

                    if (evt && evt.view && evt.view == this.parentContainer) {
                        if (this.gridView) {
                            this.gridView.onShow();
                            this.gridView.onResize();
                        }
                    } else if (this.gridView && this.gridView.onShow) {
                        this.gridView.onShow();
                        this.gridView.onResize();
                        if (this.parentContainer) {
                            this.parentContainer.resize();
                        }

                        //this.gridView.domNode.offsetTop=0;
                        this.gridView.domNode.scrollTop = 0;


                    }
                },
                save: function () {

                    if (this.delegate && this.delegate.onSave) {
                        this.delegate.onSave(this);
                    }
                    return;
                    var variables = this.blockScope.variablesToJson();
                    try {
                        var _testData = dojo.fromJson(JSON.stringify(variables));
                    } catch (e) {
                        console.error('invalid data');
                        return;
                    }
                    this.setValue(JSON.stringify(variables));
                },
                onGridDataChanged: function (evt) {
                    return null;
                    var item = this.store.get(evt.id);
                    if (item) {
                        item[evt.field] = evt.newValue;
                    }
                    this.save();
                },
                createdWidgets: function () {
                    try {

                        var thiz = this;
                        this._createSettingsPane();
                        this.registerUpdateFunction(function () {
                            if (thiz.gridView) {
                                thiz.gridView.grid.refresh();
                                thiz.gridView.onResize();
                            }
                        })
                    } catch (e) {
                        debugger;
                    }
                },
                onBlockPropertyChanged: function (evt) {

                    if (evt && evt.item && evt.item.scope == this.blockScope) {

                        if (this.gridView) {
                            this.gridView.refresh();
                        }
                    }
                },
                onVariableChanged: function () {

                    if (this.gridView) {
                        this.gridView.refresh();
                    }
                },
                startup: function () {
                    this.inherited(arguments);
                    try {
                        this.createdWidgets();
                        if (this.blockGroup === 'Variables') {
                            var thiz = this;
                            factory.subscribe(types.EVENTS.ON_VARIABLE_CHANGED, function (evt) {
                                thiz.onVariableChanged(evt);
                            }, thiz);
                        }
                        this.subscribe(types.EVENTS.ON_BLOCK_PROPERTY_CHANGED, this.onBlockPropertyChanged);
                    } catch (e) {
                        console.error('response settings widget crashed : ' + e);
                    }
                }

            });
    });
