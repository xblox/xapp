define([
    'dojo/_base/declare',
    "dojo/dnd/Source",
    "dojo/_base/Deferred",
    "dojo/dnd/Manager",
    "dojo/_base/NodeList",
    "dojo/topic",
    "dojo/has"
],
    function (declare,
              Source,
              Deferred,
              DnDManager,
              NodeList,
              topic, has)
    {
        var blockGridDndSource = declare(Source,{

            grid: null,
            hover:true,
            onDndCancel: function(){
                this.inherited(arguments);
                this.hover=false;
                if(this.targetAnchor){
                    this._removeItemClass(this.targetAnchor, "Hover");
                }
            },
            // topic event processors
            onDndSourceOver: function(source){
                // summary:
                //		topic event processor for /dnd/source/over, called when detected a current source
                // source: Object
                //		the source which has the mouse over it
                if(this !== source){
                    this.mouseDown = false;
                    if(this.targetAnchor){
                        this._unmarkTargetAnchor();
                        /*this._unmarkTargetAnchorOn();*/
                    }
                }else if(this.isDragging){
                    var m = DnDManager.manager();
                    m.canDrop(this.targetState != "Disabled" && (!this.current || m.source != this || !(this.current.id in this.selection)));
                }
            },
            _markTargetAnchorOn: function(hover){
                // summary:
                //		assigns a class to the current target anchor based on "before" status
                // before: Boolean
                //		insert before, if true, after otherwise
                if(this.current == this.targetAnchor && this.hover == hover){ return; }

                if(this.targetAnchor){
                    this._removeItemClass(this.targetAnchor, this.hover ? "Hover" : "");
                }
                this.hover = hover;
                if(this.targetAnchor){
                    this._addItemClass(this.targetAnchor, this.hover ? "Hover" : "");
                }
            },
            _unmarkTargetAnchorOn: function(){
                // summary:
                //		removes a class of the current target anchor based on "before" status
                if(!this.targetAnchor){ return; }
                this._removeItemClass(this.targetAnchor, "Hover");
                this.targetAnchor = null;
                this.targetBox = null;
                this.hover = false;
            },
            getObject: function(node){
                // summary:
                //		getObject is a method which should be defined on any source intending
                //		on interfacing with dgrid DnD.

                var grid = this.grid;
                // Extract item id from row node id (gridID-row-*).
                return grid.store.get(node.id.slice(grid.id.length + 5));
            },
            _legalMouseDown: function(evt){
                // Fix _legalMouseDown to only allow starting drag from an item
                // (not from bodyNode outside contentNode).
                var legal = this.inherited(arguments);
                return legal && evt.target != this.grid.bodyNode;
            },

            // DnD method overrides
            onDrop: function(sourceSource, nodes, copy){

                if(this.targetAnchor){
                    this._removeItemClass(this.targetAnchor, "Hover");
                }

                var targetSource = this,
                    targetRow = this._targetAnchor = this.targetAnchor, // save for Internal
                    grid = this.grid,
                    store = grid.store;

                if(!this.before && targetRow){
                    // target before next node if dropped within bottom half of this node
                    // (unless there's no node to target at all)
                    targetRow = targetRow.nextSibling;
                }
                targetRow = targetRow && grid.row(targetRow);

                Deferred.when(targetRow && store.get(targetRow.id), function(target){
                    // Note: if dropping after the last row, or into an empty grid,
                    // target will be undefined.  Thus, it is important for store to place
                    // item last in order if options.before is undefined.

                    // Delegate to onDropInternal or onDropExternal for rest of logic.
                    // These are passed the target item as an additional argument.
                    if(targetSource != sourceSource){
                        targetSource.onDropExternal(sourceSource, nodes, copy, target);
                    }else{
                        targetSource.onDropInternal(nodes, copy, target);
                    }
                });
            },
            onDropInternal: function(nodes, copy, targetItem){
                var store = this.grid.store,
                    targetSource = this,
                    grid = this.grid,
                    anchor = targetSource._targetAnchor,
                    targetRow;

                if(anchor){ // (falsy if drop occurred in empty space after rows)
                    targetRow = this.before ? anchor.previousSibling : anchor.nextSibling;
                }

                // Don't bother continuing if the drop is really not moving anything.
                // (Don't need to worry about edge first/last cases since dropping
                // directly on self doesn't fire onDrop, but we do have to worry about
                // dropping last node into empty space beyond rendered rows.)
                if(!copy && (targetRow === nodes[0] ||
                    (!targetItem && grid.down(grid.row(nodes[0])).element == nodes[0]))){
                    return;
                }

                nodes.forEach(function(node){
                    Deferred.when(targetSource.getObject(node), function(object){
                        // For copy DnD operations, copy object, if supported by store;
                        // otherwise settle for put anyway.
                        // (put will relocate an existing item with the same id, i.e. move).
                        store[copy && store.copy ? "copy" : "put"](object, {
                            before: targetItem
                        });
                    });
                });
            },
            onDropExternal: function(sourceSource, nodes, copy, targetItem){
                // Note: this default implementation expects that two grids do not
                // share the same store.  There may be more ideal implementations in the
                // case of two grids using the same store (perhaps differentiated by
                // query), dragging to each other.
                var store = this.grid.store,
                    sourceGrid = sourceSource.grid;

                // TODO: bail out if sourceSource.getObject isn't defined?
                nodes.forEach(function(node, i){
                    Deferred.when(sourceSource.getObject(node), function(object){
                        if(!copy){
                            if(sourceGrid){
                                // Remove original in the case of inter-grid move.
                                // (Also ensure dnd source is cleaned up properly)
                                Deferred.when(sourceGrid.store.getIdentity(object), function(id){
                                    !i && sourceSource.selectNone(); // deselect all, one time
                                    sourceSource.delItem(node.id);
                                    sourceGrid.store.remove(id);
                                });
                            }else{
                                sourceSource.deleteSelectedNodes();
                            }
                        }
                        // Copy object, if supported by store; otherwise settle for put
                        // (put will relocate an existing item with the same id).
                        // Note that we use store.copy if available even for non-copy dnd:
                        // since this coming from another dnd source, always behave as if
                        // it is a new store item if possible, rather than replacing existing.
                        store[store.copy ? "copy" : "put"](object, {
                            before: targetItem
                        });
                    });
                });
            },

            onDndStart: function(source, nodes, copy){
                // Listen for start events to apply style change to avatar.

                this.inherited(arguments); // DnDSource.prototype.onDndStart.apply(this, arguments);
                if(source == this){
                    // If TouchScroll is in use, cancel any pending scroll operation.
                    if(this.grid.cancelTouchScroll){ this.grid.cancelTouchScroll(); }

                    // Set avatar width to half the grid's width.
                    // Kind of a naive default, but prevents ridiculously wide avatars.
                    DnDManager.manager().avatar.node.style.width =
                        this.grid.domNode.offsetWidth / 2 + "px";
                }
            },

            onMouseDown: function(evt){
                // Cancel the drag operation on presence of more than one contact point.
                // (This check will evaluate to false under non-touch circumstances.)
                if(has("touch") && this.isDragging &&
                    touchUtil.countCurrentTouches(evt, this.grid.touchNode) > 1){
                    topic.publish("/dnd/cancel");
                    DnDManager.manager().stopDrag();
                }else{
                    this.inherited(arguments);
                }
            },

            onMouseMove: function(evt){
                // If we're handling touchmove, only respond to single-contact events.
                if(!has("touch") || touchUtil.countCurrentTouches(evt, this.grid.touchNode) <= 1){
                    this.inherited(arguments);
                }
            },

            checkAcceptance: function(source, nodes){
                // Augment checkAcceptance to block drops from sources without getObject.
                return source.getObject &&
                    Source.prototype.checkAcceptance.apply(this, arguments);
            },
            getSelectedNodes: function(){
                // If dgrid's Selection mixin is in use, synchronize with it, using a
                // map of node references (updated on dgrid-[de]select events).

                if(!this.grid.selection){
                    return this.inherited(arguments);
                }
                var t = new NodeList(),
                    id;
                for(id in this.grid.selection){
                    t.push(this._selectedNodes[id]);
                }
                return t;	// NodeList
            },
            _markTargetAnchor: function(before){
                // summary:
                //		assigns a class to the current target anchor based on "before" status
                // before: Boolean
                //		insert before, if true, after otherwise
                if(this.current == this.targetAnchor && this.before == before){ return; }
                if(this.targetAnchor){
                    this._removeItemClass(this.targetAnchor, this.before ? "Before" : "After");
                }
                this.targetAnchor = this.current;
                this.targetBox = null;
                this.before = before;
                /*this.hover=hover;*/

                if(this.targetAnchor){
                    this._addItemClass(this.targetAnchor, this.before ? "Before" : "After");
                }
            }
        });


        return blockGridDndSource;

    });