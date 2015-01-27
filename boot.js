define([
    "dojo/_base/declare",
    "dojo/_base/Deferred",
    "dojo/has",
    "require"
], function (declare,Deferred,has,require) {


    return declare(null,{

        getDependencies:function(extraDependencies){
            var result = [
                'xide/utils',
                'xide/types',
                'xide/types/Types',
                'xide/utils/StringUtils'
            ];

            if(extraDependencies){
                result = result.concat(extraDependencies);
            }

            return extraDependencies;
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

