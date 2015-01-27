define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/has',
    'dojo/Deferred',
    'xide/manager/Application',
    'xide/factory',
    'xide/types',
    'xide/utils'

], function (declare, lang, has,Deferred,Application,factory, types, utils) {

    return declare("xapp/manager/Application", [Application],{

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
