define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/has',
    'dojo/Deferred',
    'xide/manager/Application',
    'xide/mixins/ReloadMixin',
    'xide/factory',
    'xide/types',
    'xide/utils',
    'dojo/dom-construct',
    "dojo/query"

], function (declare, lang, has,Deferred,Application,ReloadMixin,factory, types, utils,domConstruct,query) {

    return declare("xapp/manager/Application", [Application,ReloadMixin],{

        delegate:null,
        settings:null,
        runBlox:function(path,id,context){

            var parts = utils.parse_url(path);

            console.log('run blox : ' + id,parts);

            var bm = this.ctx.getBlockManager();
            if(this.delegate && this.delegate.ctx.getBlockManager()){
                bm = this.delegate.ctx.getBlockManager();
            }

            bm.load(parts.scheme,parts.host).then(function(scope){

                var block = scope.getBlockById(id);

                if(block){
                    block.context = context;
                    return block.solve(block.scope);
                }else{
                    console.error('have no block !');
                }
            });
        },
        onReloaded:function(){
            console.log('on reloaded');
        },

        run:function(settings){

            console.log('run with ',settings);
            this.settings = settings;
        },
        loadScript:function(url){

            domConstruct.create('script', {
                src:url
            }, query('head')[0]);


        },
        onXBloxReady:function() {

            var _re = require,
                thiz = this;

            _re(['xblox/embedded', 'xblox/manager/BlockManager'], function (embedded, BlockManager) {

                var blockManagerInstance = new BlockManager();
                blockManagerInstance.ctx = thiz.ctx;
                thiz.ctx.blockManager = blockManagerInstance;
            });
        },
        /**
         *
         * @param settings {Object}
         * @param settings.delegate {xideve/manager/WidgetManager}
         * @returns {Deferred}
         */
        start:function(settings){

            this.initReload();

            var def = new Deferred(),
                thiz = this;


            console.log('start xapp',settings);

            this.delegate = settings.delegate;

            this.ctx.pluginManager.loadComponent('xblox').then(function(){
                def.resolve(thiz.ctx);
                thiz.onXBloxReady()
            });

            return def;
        }
    });
});
