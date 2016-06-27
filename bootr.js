define([
    "dcl/dcl",
    "requirejs-dplugins/has",
    "dojo/has",
    'dojo/Deferred',
    'xdojo/declare',
    "dstore/build/dstorer",
    "xide/build/xider",
    "xblox/build/xbloxr",
    "xwire/build/xwirer",
    "xcf/build/xcfr",
    "decor/build/decorr",
    "dpointer/build/dpointerr"
], function (dcl,has,dHas,Deferred) {
    if(typeof logError==='undefined'){

        window['logError']=function(e,message){
            console.error('error '+message,e);
        }
    }
    require([
        //"xblox/build/xbloxr",
        //"xcf/build/xcfr",
        "xblox/RunScript",
        "xblox/CSSState",
        'dojo/Deferred',
        "delite/register",
        "deliteful/Button",
        "deliteful/Slider",
        "deliteful/Combobox",
        "deliteful/Checkbox",
        "deliteful/RadioButton",
        "deliteful/ToggleButton",
        'dojo/Deferred',
        'xdojo/declare',
        "require"
    ],function(){



        has.add('xaction', function () {
            return true;
        });

        has.add('use-dcl', function () {
            return true;
        });

        dHas.add('drivers', function () {
            return true;
        });
        dHas.add('devices', function () {
            return true;
        });
        dHas.add('xaction', function () {
            return true;
        });

        dHas.add('use-dcl', function () {
            return true;
        });

        bootx({
            delegate:null
        },Deferred);
    });
});