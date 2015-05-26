define([
    "dojo/_base/declare",
    "dojo/_base/Deferred",
    "dojo/has",
    "require"
], function (declare,Deferred,has,require) {


    return declare('xapp/boot',null,{

        start:function(settings){

            var _require = require;
            var _ctx=_require('xapp/manager/Context');
            var ctx = new _ctx;
            try {

                var _register = _require('delite/register');
                if(_register){
                    console.log('   Checkpoint 3.3 xapp/boot->start : delite/register->parse');
                    _register.parse();

                }
            }catch(e){

            }


            console.log('Checkpoint 4.1 xapp/boot->start : construct managers, init managers');
            ctx.constructManagers();
            ctx.initManagers();

            return ctx.application.start(settings);

        },
        getDependencies:function(extraDependencies){
            var result = [
                'xide/utils',
                'xide/types',
                'xide/types/Types',
                'xide/utils/StringUtils',
                'xide/utils/HTMLUtils',
                'xide/utils/CIUtils',
                'xide/utils/StoreUtils',
                'xide/utils/WidgetUtils',
                'xide/utils/ObjectUtils',
                'xide/factory/Objects',
                'xide/factory/Events',
                'xapp/manager/Context',
                'xapp/manager/Application'
            ];

            if(extraDependencies){
                result = result.concat(extraDependencies);
            }
            return result;
        },
        load: function (extraDependencies) {

            var _defered = new Deferred();
            var _re = require;//hide from gcc

            console.log('load xapp/boot deps');

            _re(this.getDependencies(extraDependencies), function () {
                _defered.resolve();
            });

            return _defered.promise;
        }
    });
});

