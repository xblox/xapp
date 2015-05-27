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
    "dojo/query",
    "xapp/test"

], function (declare, lang, has,Deferred,Application,ReloadMixin,factory, types, utils,domConstruct,query,test) {

    return declare("xapp/manager/Application", [Application,ReloadMixin],{

        delegate:null,
        settings:null,
        runBlox:function(path,id,context,settings){

            var parts = utils.parse_url(path);


            console.log('run blox: ' + id + ' with ',settings);
            var bm = this.ctx.getBlockManager();
            bm.load(parts.scheme,parts.host).then(function(scope){

                var block = scope.getBlockById(id);
                if(block){
                    block.context = context;

                    if(settings) {
                        block.override = settings;
                    }
                    return block.solve(block.scope);
                }else{
                    console.error('have no block !');
                }
            });
        },
        onReloaded:function(){

            console.log('on reloaded',arguments);

        },

        run:function(settings){

            this.settings = settings;
        },
        loadScript:function(url){

            domConstruct.create('script', {
                src:url
            }, query('head')[0]);


        },
        onReady:function(){

            this.publish(types.EVENTS.ON_APP_READY,{
                context:this.ctx,
                application:this,
                delegate:this.delegate
            });

        },
        onXBloxReady:function() {

            var _re = require,
                thiz = this;

            _re(['xblox/embedded', 'xblox/manager/BlockManager'], function (embedded, BlockManager) {

                //IDE's block manager
                if(thiz.delegate && thiz.delegate.ctx.getBlockManager()){
                    thiz.ctx.blockManager = thiz.delegate.ctx.getBlockManager();
                }else{

                    var blockManagerInstance = new BlockManager();
                    blockManagerInstance.ctx = thiz.ctx;
                    thiz.ctx.blockManager = blockManagerInstance;
                }

                thiz.onReady();
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
            this.delegate = settings.delegate;

            console.log('Checkpoint 5 xapp/manager/Application->start, load xblox');

            this.ctx.pluginManager.loadComponent('xblox').then(function(){
                console.log('   Checkpoint 5.1 xblox component loaded');
                def.resolve(thiz.ctx);
                thiz.onXBloxReady()
            });

            return def;
        }
    });
});
