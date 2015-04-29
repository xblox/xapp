define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/has',
    'xide/manager/ContextBase',
    'xide/manager/PluginManager',
    'xapp/manager/Application',
    'xide/mixins/EventedMixin',
    'xide/factory',
    'xide/types',
    'xide/utils',
    './_WidgetPickerMixin'

], function (declare, lang, has,ContextBase,PluginManager,Application,EventedMixin,factory, types, utils,_WidgetPickerMixin) {

    return declare("xapp/manager/Context", [ContextBase,EventedMixin,_WidgetPickerMixin],
        {
            application:null,
            mergeFunctions: function (target, source) {

                for (var i in source) {
                    var o = source[i];
                    if (lang.isFunction(source[i]) /*&& lang.isFunction(target[i])*/) {
                        target[i] = source[i];//swap
                    }

                }

            },
            onModuleUpdated:function(evt){

                var _obj = dojo.getObject(evt.moduleClass);

                if(_obj && _obj.prototype){
                    this.mergeFunctions(_obj.prototype,evt.moduleProto);
                }

            },
            getApplication:function(){
                return this.application;
            },
            getBlockManager:function(){
                return this.blockManager;
            },
            getFileManager:function(){
                return this.fileManager;
            },
            initManagers: function () {

                this.pluginManager.init();
                this.application.init();
            },
            constructManagers: function () {
                this.inherited(arguments);
                this.pluginManager = this.createManager(PluginManager);
                this.application = this.createManager(Application);
            }
        });
});
