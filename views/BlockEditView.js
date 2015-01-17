define([
    'dojo/_base/array',
    'dojo/_base/declare',
    'dojo/_base/html',
    'dojo/dom-class',
    'dojo/on',
    'dojo/_base/lang',
    'dojo/dom-construct',
    'xide/utils',
    'xide/factory',
    'xide/types',
    'xide/views/CIView'
],
    function (array, declare, html,domClass,on, lang, domConstruct,utils,factory,types,CIView)
    {
        return declare("xblox.views.BlockEditView", [CIView],
            {
                onSave:function(ci,value){

                    if(this.delegate && this.delegate.onSave){
                        this.delegate.onSave(ci,value);
                    }
                },
                startup:function () {
                    this.inherited(arguments);
                }
            });
    })
;