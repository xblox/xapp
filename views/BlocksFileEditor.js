define([
        'dojo/_base/declare',
        'dojo/_base/lang',
        'xide/views/BeanView',
        'xide/views/BeanTreeView',
        'xide/factory',
        'xide/utils',
        "dojo/store/Memory",
        "dojo/store/Observable",
        "xfile/views/_EditorMixin",
        "xide/layout/ContentPane",
        'xblox/views/GroupedBlockView',
        'xblox/views/BlocksGridViewDefault',
        'xblox/views/VariablesGridView',
        'xblox/model/variables/Variable'
    ],
    function (declare, lang, BeanView, BeanTreeView, factory, utils, Memory, Observable,
              _EditorMixin, ContentPane, GroupedBlockView, BlocksGridViewDefault, VariablesGridView, Variable) {

        return declare("xblox.views.BlocksFileEditor", [BeanView, BeanTreeView, _EditorMixin],
            {

                //////////////////////////////////////////////////////////
                //
                //  object instances
                //

                /**
                 * xFile item, tracked due to openItem
                 */
                _item: null,
                cssClass: 'bloxEditor',
                blockManager: null,
                blockManagerClass: 'xblox.manager.BlockManager',
                model: null,
                store: null,
                tree: null,
                currentItem: null,
                didLoad: false,
                selectable: false,
                beanType: 'BLOCK',
                /**
                 * Current Blox Scope {xblox.model.Scope}
                 */
                blockScope: null,
                //////////////////////////////////////////////////////////
                //
                //  Widget Instances
                //
                groupContainer: null,

                ////////////////////////////////////////////////////////////////
                //
                //  item bean protocol
                //
                ///////////////////////////////////////////////////////////////
                hasItemActions: function () {
                    return true;
                },
                /**
                 * Returns item actions
                 * @returns {Array}
                 */
                getItemActions: function () {
                    return this.inherited(arguments);//done in xide/bean/Grouped
                },
                //////////////////////////////////////////////////////////
                //
                //  Public API
                //
                onReloaded: function () {
                    this.destroyWidgets();
                    this.openItem(this._item);
                },
                /**
                 * default entry when opening a file item through xfile
                 * @param item
                 */
                openItem: function (item) {

                    this._item = item;
                    var thiz = this;
                    try {
                        var _loaded = function (content) {
                            thiz.initWithContent(content);
                        }.bind(thiz);
                    } catch (e) {
                        console.error('trouble loading xblox file : ', e);
                    }

                    this.getContent(item, _loaded);

                },
                /**
                 * Init with serialized string, forward to
                 * @param content
                 */
                initWithContent: function (content) {

                    var data = null;
                    try {
                        data = utils.getJson(content);
                    } catch (e) {
                        console.error('invalid block data');
                    }
                    if (data) {
                        this.initWithData(data);
                    }

                },
                /**
                 * Entry point when a blox scope is fully parsed
                 * @param blockScope
                 */
                initWithScope: function (blockScope) {

                    this.blockScope = blockScope;
                    var allBlockGroups = blockScope.allGroups(),
                        thiz = this;

                    console.log('       block groups', allBlockGroups);

                    /*
                    if (allBlockGroups.indexOf('Variables') == -1) {
                        allBlockGroups.push('Variables');
                    }*/


                    if (allBlockGroups.indexOf('Events') == -1) {
                        allBlockGroups.push('Events');
                    }

                    if (allBlockGroups.indexOf('On Load') == -1) {
                        allBlockGroups.push('On Load');
                    } else {

                    }


                    /*setTimeout(function () {
                        try {*/
                            thiz.renderGroups(allBlockGroups, blockScope);/*
                        } catch (e) {
                            debugger;
                        }
                    }, 100);*/
                },
                getScopeUserData: function () {
                    return {
                        owner: this
                    };
                },
                initWithData: function (data) {

                    console.log('init with data', data);

                    var scopeId = utils.createUUID();
                    var blockInData = data;
                    var variableInData = data;

                    //check structure
                    if (lang.isArray(data)) {// a flat list of blocks

                    } else if (lang.isObject(data)) {
                        scopeId = data.scopeId || scopeId;
                        blockInData = data.blocks || [];
                        variableInData = data.variables || [];
                    }

                    var blockManager = this.getBlockManager();
                    this.blockManager = blockManager;
                    var scopeUserData = this.getScopeUserData();

                    var blockScope = blockManager.getScope(scopeId, scopeUserData, true);
                    var allBlocks = blockScope.blocksFromJson(blockInData);

                    for (var i = 0; i < allBlocks.length; i++) {
                        var obj = allBlocks[i];

                        obj._lastRunSettings = {
                            force: false,
                            highlight: true
                        }
                    }

                    var allVariables = blockScope.variablesFromJson(variableInData);
                    blockManager.onBlocksReady(blockScope);
                    console.log('   got blocks', allBlocks);
                    console.log('   got variables', allVariables);
                    if (allBlocks) {
                        return this.initWithScope(blockScope);
                    }
                    /**
                     * a blocks file must be in that structure :
                     */
                },

                _createTreeStore: function (blockData) {

                    var data = {
                        items: blockData,
                        identifier: 'name',
                        label: 'name'
                    };

                    var blockStore = Observable(new Memory({
                        data: data,
                        getChildren: function (object) {
                            return object.items;
                        },
                        mayHaveChildren: function (parent) {
                            return parent.items != null && parent.items.length > 0;

                        }
                    }));
                    return blockStore;
                },
                //////////////////////////////////////////////////////////
                //
                //  utils
                //
                destroyWidgets: function () {
                    utils.destroyWidget(this.groupContainer);
                    if (this.blockManager && this.blockScope) {
                        this.blockManager.removeScope(this.blockScope.id);
                    }
                    this.groupContainer = null;
                    this.blockManager = null;
                },
                destroy: function () {
                    this.destroyWidgets();
                    this.inherited(arguments);
                },
                /**
                 * Get/Create a block manager implicit
                 * @returns {xblox.manager.BlockManager}
                 */
                getBlockManager: function () {

                    if (!this.blockManager) {

                        if (this.ctx.blockManager) {
                            return this.ctx.blockManager;
                        }

                        this.blockManager = factory.createInstance(this.blockManagerClass, {
                            ctx: this.ctx
                        });
                        console.log('_createBlockManager ', this.blockManager);
                    }
                    return this.blockManager;
                },
                //////////////////////////////////////////////////////////
                //
                //  UI - Factory
                //
                createGroupContainer: function () {
                    var tabContainer = utils.addWidget(dijit.layout.TabContainer, {
                        tabStrip: true,
                        tabPosition: "top",
                        splitter: true,
                        style: "min-width:450px;height:inherit;padding:0px;",
                        "className": "ui-widget-content"
                    }, null, this.containerNode, true);
                    return tabContainer;
                },
                getGroupContainer: function () {
                    if (this.groupContainer) {
                        return this.groupContainer;
                    }
                    this.groupContainer = this.createGroupContainer();
                    return this.groupContainer;
                },
                createGroupView: function (groupContainer, group) {
                    return utils.addWidget(ContentPane, {
                        delegate: this,
                        title: group,
                        closable: false,
                        style: 'padding:0px',
                        cssClass: 'blocksEditorPane',
                        blockView: null,
                        onShow: function () {
                            //this.inherited(arguments);
                            if (this.blockView) {
                                this.blockView.onShow();
                            }
                        }
                    }, this, groupContainer, true);
                },
                createGroupedBlockView: function (container, group, scope, extra) {

                    var thiz = this;

                    var args = {
                        attachTo: container,
                        blockGroup: group,
                        title: group,
                        gridViewProto: BlocksGridViewDefault,
                        blockScope: scope,
                        ctx: this.ctx,
                        delegate: this,
                        showAllBlocks: true,
                        open: true,
                        lazy: true,
                        titlePane: false,
                        canToggle: false,
                        gridParams: {
                            cssClass: 'bloxGridView'
                        }
                    };

                    if (extra) {
                        args = lang.mixin(args, extra);
                    }

                    var view = new GroupedBlockView(args);
                    view.startup();

                    return view;
                },
                renderGroups: function (_array, blockScope) {
                    var groupContainer = this.getGroupContainer();
                    var lastChild = null, thiz = this;

                    for (var i = 0; i < _array.length; i++) {
                        try {

                            var groupBlocks = blockScope.getBlocks({
                                group: _array[i]
                            });

                            if (_array[i] !== 'Variables' && (!groupBlocks || !groupBlocks.length)) {//skip empty
                                continue;
                            }

                            var contentPane = this.createGroupView(groupContainer, _array[i]);
                            var gridViewConstructurArgs = {};

                            if (_array[i] === 'Variables') {

                                gridViewConstructurArgs.newRootItemFunction = function () {
                                    try {
                                        var newItem = new Variable({
                                            title: 'No-Title-Yet',
                                            type: 13,
                                            value: 'No Value',
                                            enumType: 'VariableType',
                                            save: false,
                                            initialize: '',
                                            group: 'Variables',
                                            id: utils.createUUID(),
                                            scope: blockScope
                                        });
                                    } catch (e) {
                                        debugger;
                                    }
                                };

                                gridViewConstructurArgs.onGridDataChanged = function (evt) {

                                    console.log('onGridDataChanged', evt);
                                    var item = evt.item;
                                    if (item) {
                                        item[evt.field] = evt.newValue;
                                    }
                                    thiz.save();
                                };
                                gridViewConstructurArgs.showAllBlocks = false;
                                gridViewConstructurArgs.newRootItemLabel = 'New Variable';
                                gridViewConstructurArgs.newRootItemIcon = 'fa-code';
                                gridViewConstructurArgs.storeField = 'variableStore';
                                gridViewConstructurArgs.gridViewProto = VariablesGridView;
                            }

                            gridViewConstructurArgs.newRootItemGroup = _array[i];

                            lastChild = this.createGroupedBlockView(contentPane.containerNode, _array[i], blockScope, gridViewConstructurArgs);
                            contentPane.blockView = lastChild;
                            lastChild.parentContainer = contentPane;


                        } catch (e) {
                            debugger;
                        }
                    }


                    groupContainer.resize();
                    if(lastChild){
                        //
                    }

                    //groupContainer.selectChild(lastChild);

                    setTimeout(function () {
                        //thiz.resize();
                        if (thiz.parentContainer) {
                            thiz.parentContainer.resize();
                        }
                    }, 500);
                },
                onSave: function (groupedBlockView) {
                    this.save();
                },
                //////////////////////////////////////////////////////////
                //
                //  Editor related
                //
                save: function () {

                    //console.log('save blocks');

                    if (this.blockScope) {

                        var all = {
                            blocks: null,
                            variables: null
                        };
                        var blocks = this.blockScope.blocksToJson();
                        try {
                            //test integrity
                            var _testData = dojo.fromJson(JSON.stringify(blocks));
                        } catch (e) {
                            console.error('invalid data');
                            return;
                        }
                        var _onSaved = function () {

                        };

                        var variables = this.blockScope.variablesToJson();
                        try {
                            //test integrity
                            var _testData = dojo.fromJson(JSON.stringify(variables));
                        } catch (e) {
                            console.error('invalid data');
                            return;
                        }
                        all.blocks = blocks;
                        all.variables = variables;

                        this.saveContent(JSON.stringify(all, null, 2), this._item, _onSaved);


                    }
                },
                onGridKeyEnter: function () {
                    this.editBlock(this.getItem());
                },
                onGridMouseDoubleClick: function () {
                    this.editBlock(this.getItem());
                },
                startup: function () {

                    if (this.didLoad)
                        return;
                    this.inherited(arguments);
                    this.didLoad = true;

                }
            });
    })
;