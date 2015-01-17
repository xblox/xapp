define([
    "dojo/_base/declare",
    'dojo/dom-class',
    'dojo/dom-construct',
    'xide/types',
    'dijit/_Widget',
    'xide/widgets/TemplatedWidgetBase',
    'xide/widgets/ToolTipMixin',
    'xide/mixins/ReloadMixin',
    'xide/mixins/EventedMixin'
],
    function (declare, domClass,domConstruct,types,_Widget,TemplatedWidgetBase,ToolTipMixin,ReloadMixin,EventedMixin)
    {
        return declare("xblox.widgets.BlockGridRowEditor", [_Widget,TemplatedWidgetBase,EventedMixin,ReloadMixin,ToolTipMixin],
            {
                _didRenderBlock:false,
                containerNode:null,
                debug:true,
                highlightDelay:200,
                _isHighLighting:false,
                textNode:null,
                getRootId:function(){
                    return this.id;
                },
                getTooltipNode:function(){
                    return this.containerNode;
                },
                templateString:"<div data-dojo-attach-point='root' class='' style=''>" +
                    "<div data-dojo-attach-point='containerNode'>no set</div>" +
                    "</div>",
                set:function(what,value){
                    this.inherited(arguments);
                    //console.log('   setting ' + what + ' to ' + value);
                },
                get:function(what){
                    return this.inherited(arguments);
                },
                renderBlock:function(block){
                    var text = 'render block : ' + block.declaredClass;

                    if(!this.containerNode){
                        return;
                    }
                    dojo.empty(this.containerNode);

                    var blockText='';
                    if(block.toText){
                        blockText = block.toText();
                        var textItem = domConstruct.create('span',{
                            innerHTML:blockText
                        });
                        this.containerNode.appendChild(textItem);
                        this.textNode = textItem;
                        if(block.enabled==false){
                            domClass.add(textItem,'disabledBlock');
                        }
                    }
                    if(this.debug){
                        //console.log(text + ' with id '  + this.object.id + ' to ' + blockText);
                    }

                },
                onReloaded:function(){
                    this._didRenderBlock=false;
                    if(this.containerNode){
                        dojo.empty(this.containerNode);
                    }
                    this.renderBlock(this.object);
                },
                onRunBlock:function(evt){
                    if(this._isHighLighting){
                 //       return;
                    }
                    this._isHighLighting=true;
                    try{
                        if(evt && evt.callee ==this.object && this.root){

                            domClass.remove(this.root,'failedBlock');
                            domClass.remove(this.root,'activeBlock');
                            domClass.remove(this.root,'successBlock');

                            var thiz=this;
                            domClass.add(this.root,'activeBlock');
                            setTimeout(function(){
                                domClass.remove(thiz.root,'activeBlock');
                                thiz._isHighLighting=false;
                            },this.highlightDelay);

                        }
                    }catch(e){

                    }
                },
                onRunBlockFailed:function(evt){
                    if(this._isHighLighting){
             //           return;
                    }
                    this._isHighLighting=true;
                    try{
                        if(evt && evt.callee ==this.object && this.root){

                            domClass.remove(this.root,'failedBlock');
                            domClass.remove(this.root,'activeBlock');
                            domClass.remove(this.root,'successBlock');

                            var thiz=this;
                            domClass.add(this.root,'failedBlock');

                            setTimeout(function(){
                                domClass.remove(thiz.root,'failedBlock');
                                thiz._isHighLighting=false;
                            },this.highlightDelay);

                        }
                    }catch(e){

                    }
                },
                onRunBlockSuccess:function(evt){
                    if(this._isHighLighting){
             //           return;
                    }
                    this._isHighLighting=true;
                    try{
                        if(evt && evt.callee ==this.object && this.root){

                            domClass.remove(this.root,'failedBlock');
                            domClass.remove(this.root,'activeBlock');
                            domClass.remove(this.root,'successBlock');

                            var thiz=this;
                            domClass.add(this.root,'successBlock');

                            setTimeout(function(){
                                domClass.remove(thiz.root,'successBlock');
                                thiz._isHighLighting=false;
                            },this.highlightDelay);

                        }
                    }catch(e){

                    }
                },
                startup:function () {
                    this.inherited(arguments);
                    if(!this._didRenderBlock){
                        if(this.object){
                            this.renderBlock(this.object);
                            this.initToolTip(this.object.description);
                        }else{
                            console.error('have no object!!!');
                        }
                    }
                    this._didRenderBlock=true;
                    this.initReload();
                    this.subscribe(types.EVENTS.ON_RUN_BLOCK,this.onRunBlock);
                    this.subscribe(types.EVENTS.ON_RUN_BLOCK_FAILED,this.onRunBlockFailed);
                    this.subscribe(types.EVENTS.ON_RUN_BLOCK_SUCCESS,this.onRunBlockSuccess);

                }
            });
    });