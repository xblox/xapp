define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/has',
    'xide/manager/ContextBase',
    'xide/manager/PluginManager',
    'xide/factory',
    'xide/types',
    'xide/utils'

], function (declare, lang, has,ContextBase,PluginManager,factory, types, utils) {

    return declare("xapp/manager/Context", [ContextBase],
        {
            initManagers: function () {

                this.pluginManager.init();

            },
            constructManagers: function () {

                this.inherited(arguments);

                this.pluginManager = this.createManager(PluginManager);
            }
        });
});
