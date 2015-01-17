define([
    "dojo/_base/declare",
    "dojo/_base/html",
    'dojo/dom-class',
    'dojo/dom-construct',
    "dojo/on",
    'xide/types',
    'xide/factory',
    'dijit/_Widget',
    'xide/widgets/TemplatedWidgetBase',
    'xide/mixins/EventedMixin',
    'xide/mixins/ReloadMixin'
],
    function (declare, html, domClass,domConstruct,on, types,factory,_Widget,TemplatedWidgetBase,EventedMixin,ReloadMixin)
    {
        return declare("xide.widgets.ActionToolbarButton", [_Widget,TemplatedWidgetBase,EventedMixin,ReloadMixin],
            {
                _didRenderBlock:false,
                containerNode:null,
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

                    /*console.dir(block);*/
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
                    }
                    console.log(text + ' to ' + blockText);

                },
                onReloaded:function(){
                    this._didRenderBlock=false;
                    if(this.containerNode){
                        dojo.empty(this.containerNode);
                    }
                    this.renderBlock(this.object);
                },
                startup:function () {
                    this.inherited(arguments);
                    if(!this._didRenderBlock){
                        if(this.object){
                            this.renderBlock(this.object);
                        }
                    }
                    this._didRenderBlock=true;
                    this.initReload();

                }
            });
    });