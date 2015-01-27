define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/has',
    'xide/manager/ContextBase',
    'xide/manager/PluginManager',
    'xapp/manager/Application',
    'xide/factory',
    'xide/types',
    'xide/utils'

], function (declare, lang, has,ContextBase,PluginManager,Application,factory, types, utils) {

    return declare("xapp/manager/Context", [ContextBase],
        {
            application:null,
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
