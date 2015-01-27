define([
    "dojo/_base/declare",
    "dojo/_base/Deferred",
    "dojo/has",
    "require"
], function (declare,Deferred,has,require) {


    return declare('xapp/boot',null,{

        start:function(){

            console.log('start xapp');

            var _require = require;
            var _ctx=_require('xapp/manager/Context');
            var ctx = new _ctx;
            ctx.constructManagers();
            ctx.initManagers();

            return ctx;

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
                'xapp/manager/Context'
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

