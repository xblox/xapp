define([
    'dojo/_base/declare',
    "dojo/_base/array",
    "dijit/registry",
    'dojo/topic'
],
    function(declare,array,registry,topic)
    {
        return declare("xblox.widgets.DojoDndMixin",null,
            {
                dropEvent:"/dnd/drop",
                dragEvent:"/dnd/start",
                overEvent:"/dnd/source/over",
                _eDrop:false,
                isDragging:false,
                didInit:false,

                /***
                 * Pre-Process DND Events
                 * @param node
                 * @param targetArea
                 * @param indexChild
                 */
                _calcNewItemList:function(items){
                    var res = [];
                    if(items){

                        for(var i=0 ; i<items.length ; i++){
                            var widget =registry.getEnclosingWidget(items[i].item.node);
                            if(widget){
                                widget.item.dndCurrentIndex=i;
                                res.push(widget);
                            }
                        }
                    }
                    return res;
                },
                _onOver:function(node, source){



                    if(this.isDragging /*this.onOver && node*/){


                        var widget=null;
                        if(source){
                            widget = registry.getEnclosingWidget(source[0]);
                        }
                        console.log('on over : ' );
                        /*this.onOver(widget,node);*/
                    }

                },
                _onDrag:function(node, source){

                    this.isDragging=true;
                    /*
                    if(this.onDrag){
                        if(source && source[0]){
                            var widget = registry.getEnclosingWidget(source[0]);
                            this.onDrag(widget,node);
                        }
                    }
                    */
                },
                checkAcceptance:function(sources,nodes){
                    return false;
                    if(!sources||!nodes){
                        return;
                    }
                    this.setupDND();

                    var node = nodes[0];
                    var row=this.grid.row(node);
                    if(!row || !row.data){
                        return;
                    }
                    var item = row.data;
                    console.log('acce : ' + item.name);

                    return true;
                },
                onDrop: function(source, nodes, copy,target){
                    if(!source||!nodes){
                        return;
                    }
                    this.isDragging=false;
                    var node = nodes[0];
                    var item = null;
                    var dstItem = null;
                    var isTree = false;
                    var didNonTree=false;
                    var didTree=false;
                    if(source.tree && source.anchor && source.anchor.item && target){

                        item    = source.anchor.item;
                        isTree  = true;

                        var dstNode = target.current;
                        if(!dstNode){

                            console.warn('have dstNode in target.current');
                            if (this.delegate && this.delegate.onDrop) {
                                console.log('drop on nothing');
                                this.delegate.onDrop(item, {
                                    parentId:null
                                }, false, this.grid, source.targetState, false);
                            }

                            return;
                        }
                        var dstRow = this.grid.row(dstNode);
                        if(!dstRow){
                            console.warn('have now row');
                            return;
                        }
                        dstItem = dstRow.data;
                        if(!dstItem){
                            console.warn('have no dstItem');
                            return;
                        }

                        try {
                            if (this.delegate && this.delegate.onDrop) {
                                this.delegate.onDrop(item, dstItem, target.before, this.grid, source.targetState, target.hover);
                                didTree = true;
                            }
                        }catch(e){
                            debugger;
                        }



                    }else{

                        var row=this.grid.row(node);
                        if(!row || !row.data){
                            return;
                        }
                        item = row.data;

                        var dstNode = source.current;
                        if(!dstNode){
                            console.warn('have dstNode in source.current');
                            return;
                        }
                        var dstRow = this.grid.row(dstNode);
                        if(!dstRow){
                            console.warn('have now row');
                            return;
                        }
                        dstItem = dstRow.data;
                        if(!dstItem){
                            console.warn('have no dstItem');
                            return;
                        }

                        try {
                            if (this.delegate && this.delegate.onDrop) {
                                this.delegate.onDrop(item, dstItem, source.before, this.grid, source.sourceState, source.hover);
                                didNonTree = true;
                            }
                        }catch(e){
                            debugger;
                        }
                    }

                    if(didNonTree==false && didTree==false){
                        console.dir(arguments);
                        console.log('something wrong')
                    }else{
                        console.dir(arguments);
                        console.log('droping : ' + item.name  + ' into ' + dstItem.name + ' before = ' + source.before);
                        console.log('didNonTree ' + didNonTree + ' didTree ' + didTree);
                    }
                },
                _onDrop:function(source, nodes, copy, target){




                    /*
                    //forward to delegate
                    if(this.onDrop){
                        if(nodes && nodes[0]){
                            var widget = registry.getEnclosingWidget(nodes[0]);
                            this.onDrop(widget,target);
                        }
                    }
                    */
                },
                setupDND:function(){

                    var thiz = this;
                    if(this.didInit){
                       return;
                    }
                    this.didInit=true;

                    topic.subscribe(this.dragEvent, function(node, targetArea, indexChild){
                        thiz._onDrag(node, targetArea, indexChild);
                    });
                    if(this.overEvent){
                        topic.subscribe(this.overEvent, function(node, targetArea, indexChild){
                            thiz._onOver(node, targetArea, indexChild);
                        });
                    }
                    topic.subscribe(this.dropEvent, function(source, nodes, copy, target){
                        thiz._onDrop(source, nodes, copy, target);
                    });
                }
            });
    });