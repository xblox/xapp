define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/has',
    'dojo/Deferred',
    'xide/manager/Application',
    'xide/factory',
    'xide/types',
    'xide/utils',
    'dojo/dom-construct',
    "dojo/query"

], function (declare, lang, has,Deferred,Application,factory, types, utils,domConstruct,query) {

    return declare("xapp/manager/Application", [Application],{

        loadScript:function(url){

            domConstruct.create('script', {
                src:url
            }, query('head')[0]);
        },
        start:function(settings){

            var def = new Deferred(),
                thiz = this;

            this.ctx.pluginManager.loadComponent('xblox').then(function(){
                def.resolve(thiz.ctx);
            });

            return def;
        }
    });
});
