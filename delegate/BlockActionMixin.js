define([
        "dojo/_base/array",
        "dojo/_base/declare",
        'xide/factory',
        "xblox/widgets/AddBlockWidget"
    ],
    function (array, declare, factory, AddBlockWidget) {
        return declare("xblox.delegate.BlockActionMixin", null,
            {
                /**
                 * Selection : current selected item
                 */
                currentItem: null,
                /**
                 * Selection : last selected item
                 */
                prevItem: null,
                /**
                 * Selection : next item to select (after block added, removed)
                 */
                nextItem: null,
                /**
                 *  Array of functions to be called when an item has been added or removed
                 *  {Array(Function)}
                 * @private
                 */
                _watchers: null,
                blockScope: null,        //must be set
                blockToolbar: null,      //a toolbar to populate our item actions
                blockProvider: null,     //not used yet
                blockStore: null,        //block-store, actually this is in block scope
                blockGroup: null,        //sets the group for new blocks but also acts as filter
                blockGridView: null,     //the grid view rendering all blocks, needed to expand items
                newRootItemGroup: null,  //set a group for new items at root level
                save: true,
                /////////////////////////////////////////////////////////////////////////
                //
                //  Cut, Copy, Paste
                //
                /////////////////////////////////////////////////////////////////////////
                paste: function (items, owner, cut) {

                    //we only emulate a drop, see below

                    var target  = this.getItem(),
                        _flatten,
                        source,
                        thiz    =this;

                    if (!owner || !owner.gridView) {
                        return;//@TODO : support
                    }

                    //special case when paste on nothing
                    if(!target){
                        //save parentIds
                        for (var i = 0; i < items.length; i++) {
                            var obj = items[i];
                            if(obj.parentId) {
                                obj._parentOri = '' + obj.parentId;
                                obj.parentId=null;
                            }
                        }

                        //flatten them
                        _flatten = this.blockScope.flatten(items);

                        //clone them
                        var _clones = this.blockScope.cloneBlocks2(_flatten,this.newRootItemGroup);
                        var firstItem = null;

                        for (var i = 0; i < _clones.length; i++) {
                            var clone = _clones[i];
                            /*
                            clone.group = '' + this.newRootItemGroup;//set new group*/
                            if(!firstItem) {
                                firstItem = clone;
                            }
                        }

                        //restore parentIds
                        for (var i = 0; i < items.length; i++) {
                            var obj = items[i];
                            if(obj._parentOri) {//restore
                                obj.parentId=obj._parentOri;
                                delete obj['_parentOri'];
                            }
                        }
                        this.gridView.refresh();
                        this.onItemAdded(firstItem,firstItem);

                        this.currentItem=firstItem;
                        setTimeout(function(){
                            if (thiz.blockGridView.select) {
                                thiz.blockGridView.select(firstItem, true);
                            }
                        },50);


                        return;
                    }



                    var grid = owner.gridView.grid;
                    var srcScope = items[0].scope;
                    var dstScope = target.scope;
                    if (srcScope != dstScope) {
                        return;
                    }

                    if (!cut) {
                        return;
                    }
                    var insert = target.canAdd() || false;

                    var parent = srcScope.getBlockById(target.parentId);
                    if(!parent){
                        parent=target;
                    }
                    var targetState = 'Moved';
                    var before = false;

                    _flatten = this.blockScope.flatten(items);
                    items = srcScope.cloneBlocks(_flatten);
                    for (var i = 0; i < items.length; i++) {
                        source = items[i];
                        /**
                         * Case source=target
                         */
                        if (source == target) {
                            console.log('source=target!');
                        }
                        source.parentId = parent.id;
                        if (parent) {
                            parent.add(source);
                        }
                        this.onDrop(source, target, before, grid, targetState, insert);
                    }


                },
                /////////////////////////////////////////////////////////////////////////
                //
                //  Drag'n drop
                //
                /////////////////////////////////////////////////////////////////////////
                onDrop: function (source, target, before, grid, targetState, insert) {


                    var ctrArgs = source.ctrArgs || {};
                    var proto = source.proto;

                    var add = !before == true && target.parentId == null;
                    var newBlock = null;
                    var isNewItem = false;

                    //prepare args
                    if (source.ctrArgs) {//comes from factory
                        ctrArgs.scope = ctrArgs.scope || target.scope;
                        ctrArgs.group = ctrArgs.group || target.group;
                        ctrArgs.parentId = ctrArgs.parentId || target.id;
                        isNewItem = true;
                    }

                    if (isNewItem) {
                        //new item at root level
                        if (target.parentId == null && !insert) {
                            ctrArgs.parentId = null;
                            newBlock = factory.createBlock(proto, ctrArgs);//root block

                        } else if (insert && target.canAdd && target.canAdd() != null) {//new item at item level
                            newBlock = target.add(proto, ctrArgs, null);
                        }
                    } else {

                        //real item move, before or after
                        if (targetState === 'Moved') {

                            if (source.scope && target.scope && source.scope == target.scope) {

                                var moved = target.scope.moveTo(source, target, before, insert);
                                if (moved) {
                                    this.saveItems();
                                } else {
                                    console.error('weird, didnt move');
                                }

                                var store = this.blockScope[this.storeField] || this.blockStore || this.blockScope.blockStore;
                                this.gridView.grid.set("store", store, {
                                    group: this.blockGroup
                                });
                                return;
                            } else {
                                console.error('weird');
                            }
                        }
                    }

                    if (newBlock && newBlock.postCreate) {
                        newBlock.postCreate();
                    }
                    //this.onItemAction();

                    var store = this.blockScope[this.storeField] || this.blockStore || this.blockScope.blockStore;
                    this.gridView.grid.set("store", store, {
                        group: this.blockGroup
                    });
                    if (newBlock) {
                        this.onItemAdded(target, newBlock);
                    }

                },
                ////////////////////////////////////////////////////////////////
                //
                //  Block Execution
                //
                ////////////////////////////////////////////////////////////////
                execute: function (block) {
                    if (!block || !block.scope) {
                        console.error('have no scope');
                        return;
                    }
                    try {
                        var result = block.scope.solveBlock(block, {
                            highlight: true,
                            force:true
                        });
                    } catch (e) {
                        console.error(' excecuting block -  ' + block.name + ' failed! : ' + e);
                        console.error(printStackTrace().join('\n\n'));
                    }
                },
                ////////////////////////////////////////////////////////////////
                //
                //  Item editing
                //
                ///////////////////////////////////////////////////////////////
                editBlock: function (item) {
                    if (!item) {
                        return;//shouldnt happen
                    }

                    var thiz = this;
                    var _edited = function (item) {

                        if (thiz.save && thiz.delegate && thiz.delegate.save) {
                            thiz.delegate.save(thiz);
                        }
                        thiz.onItemAction(item, false);
                    };
                    var blockManager = this.delegate.getBlockManager ? this.delegate.getBlockManager() : this.ctx.getBlockManager();
                    blockManager.editBlock(item, _edited);
                },
                ////////////////////////////////////////////////////////////////
                //
                //  Item management
                //
                ///////////////////////////////////////////////////////////////
                /**
                 * Removes an item.
                 * @param item
                 * @param updateWatchers
                 * @returns {boolean}
                 */
                removeItem: function (item, updateWatchers) {

                    item = item || this.currentItem;
                    console.log('removing block : ' + item.name + ' | ' + item.id);
                    try {

                        if (!item) {
                            return false;
                        }

                        //try individual item remove function
                        if (item.remove) {
                            item.remove();
                        }

                        //this should be redundant as item.remove should do the same too
                        var store = this.blockScope[this.storeField] || this.blockStore || this.blockScope.blockStore;
                        if (store) {
                            store.remove(item.id);
                        }

                        if (updateWatchers !== false) {
                            this.onItemAction(item);
                        }

                        return true;
                    } catch (e) {
                        debugger;
                    }
                },
                /**
                 * Callback if any new item has been added to the list
                 * @param parent
                 * @param newItem
                 */
                onItemAdded: function (parent, newItem) {

                    if (!parent || !newItem) {
                        return false;
                    }

                    if (this.blockGridView) {
                        try{
                            if (this.blockGridView.expand) {
                                this.blockGridView.expand(parent, true);
                            }
                            if (this.blockGridView.select) {
                                this.blockGridView.select(newItem, true);
                            }
                        }catch(e){
                            console.error('error expanding new blocks!',e);
                        }
                    }
                    this.saveItems();
                },
                /**
                 * @param menuItem
                 */
                addItem: function (menuItem) {

                    var item = menuItem.item;
                    if (!item) {
                        return;
                    }
                    var target = item.target;
                    var proto = item.proto;
                    var ctorArgs = item.ctrArgs;
                    var where = null;
                    var newBlock = null;

                    //cache problem:
                    if(!target){
                        var _item = this.getItem();
                        if(_item){
                            target=_item;
                        }
                    }

                    if (target && proto && ctorArgs) {

                        if (target.owner && target.dstField) {
                            where = target.dstField;
                            target = target.owner;
                        }

                        ctorArgs['parentId'] = target.id;
                        ctorArgs['group'] = null;
                        ctorArgs['parent'] = target;//should be obselete

                        newBlock = target.add(proto, ctorArgs, where);
                        newBlock.parent = target;

                    } else if (!target && proto && ctorArgs) {

                        if(ctorArgs.group==="No Group" && this.newRootItemGroup){
                            ctorArgs.group = this.newRootItemGroup;
                        }
                        if (!ctorArgs.group && this.newRootItemGroup) {
                            ctorArgs.group = this.newRootItemGroup;
                        }


                        newBlock = factory.createBlock(proto, ctorArgs);//root block

                    }

                    if (newBlock && newBlock.postCreate) {
                        newBlock.postCreate();
                    }
                    //this.onItemAction();

                    var store = this.blockScope[this.storeField] || this.blockStore || this.blockScope.blockStore;

                    this.gridView.grid.set("store", store.filter({
                        group: this.blockGroup
                    }));

                    this.onItemAdded(target, newBlock);

                },
                ////////////////////////////////////////////////////////////////
                //
                //  Item selection
                //
                ///////////////////////////////////////////////////////////////

                /***
                 * onItemSelected sets the current item and updates the action toolbar
                 * @param item  null|mixed
                 */
                onItemSelected: function (item) {

                    try {
                        /*
                         factory.publish(types.EVENTS.ON_BLOCK_SELECTED,{
                         item:item
                         },this);
                         */
                    } catch (e) {
                        console.error('publish ON_BLOCK_SELECTED failed ' + e);
                    }


                    this.currentItem = item;
                    if (!this.hasItemActions(item)) {
                        return;
                    }
                    var actions = this.getItemActions(item);
                    if (this.blockToolbar) {
                        this.blockToolbar.clear();
                        this.blockToolbar.addActions(actions, this, null);
                    }

                },

                ////////////////////////////////////////////////////////////////
                //
                //  item bean protocol
                //
                ///////////////////////////////////////////////////////////////

                hasItemActions: function (item) {
                    return true;
                },
                getItem: function () {
                    return this.currentItem;
                },
                move: function (dir) {
                    var item = this.getItem();
                    if (!item || !item.parentId) {
                        return;
                    }
                    //parent.items = items.swap(item,upperItem);

                    try {
                        item.move(item, dir);
                        this.onItemAction(true);
                        console.log('move up to' + item.name);
                    } catch (e) {
                        debugger;
                    }

                },
                saveItems: function () {
                    if (this.save && this.delegate && this.delegate.save) {
                        this.delegate.save();
                    }
                },
                getItemActions: function (item) {

                    item = item || this.currentItem;

                    var thiz = this;
                    var actions = [];

                    var _createAction = this.createAddBlockWidget(item);

                    actions.push(_createAction);

                    if (item) {

                        if (item.canDelete !== false) {
                            actions.push(this._createAction('Remove', 'el-icon-remove-sign', item, function () {
                                thiz.removeItem()
                            }));
                        }
                        if (item.canMove(null, -1)) {
                            actions.push(this._createAction('Up', 'el-icon-circle-arrow-up', item, function () {
                                thiz.move(-1)
                            }));
                        }
                        if (item.canMove(null, 1)) {
                            actions.push(this._createAction('Down', 'el-icon-circle-arrow-down', item, function () {
                                thiz.move(1)
                            }));
                        }

                        actions.push({
                            title: 'Play',
                            icon: 'el-icon-play',
                            place: 'last',
                            emit: false,
                            style: '',
                            handler: function () {
                                thiz.execute(item);
                            }
                        });

                        actions.push({
                            title: 'Reload',
                            icon: 'el-icon-refresh',
                            place: 'last',
                            emit: false,
                            style: '',
                            handler: function () {
                                thiz.reload();
                            }
                        });
                    }
                    return actions;
                },
                update: function () {
                    try {
                        array.forEach(this._watchers, function (item) {
                            item();
                        });
                    } catch (e) {
                        debugger;
                    }
                },
                /**
                 * Invoked when any action has been performed : delete, added
                 */
                onItemAction: function (save) {

                    try {
                        array.forEach(this._watchers, function (item) {
                            item();
                        });
                    } catch (e) {
                        debugger;
                    }

                    if (save !== false) {
                        this.saveItems();
                    }
                },
                /**
                 *
                 * @param fn
                 */
                registerUpdateFunction: function (fn) {
                    if (!this._watchers) {
                        this._watchers = [];
                    }
                    //if(!this._watchers.contains(fn)){
                    this._watchers.push(fn);
                    //}
                },
                /**
                 *
                 * @param item
                 * @returns {xblox.widgets.AddBlockWidget}
                 */
                createAddBlockWidget: function (item) {
                    var _addBlock = new AddBlockWidget({
                        item: item,
                        delegate: this,
                        style: 'float:left;'
                    }, dojo.doc.createElement('div'));
                    _addBlock.startup();
                    return _addBlock;
                },
                /**
                 *
                 * @param label
                 * @param icon
                 * @param item
                 * @param clickFunction
                 * @returns {{title: *, icon: (item.icon|*), place: string, emit: boolean, style: string, handler: *}}
                 * @private
                 */
                _createAction: function (label, icon, item, clickFunction) {

                    return {
                        title: label,
                        icon: item ? (item.icon || icon) : null,
                        place: 'last',
                        emit: false,
                        style: '',
                        handler: clickFunction
                    };
                }


            });
    });