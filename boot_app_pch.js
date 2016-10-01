define([
    //'xdojo/declare',
    "xapp/build/main_build"
    //"dstore/build/dstorer",
    //"xide/build/xider",
    //"xblox/build/xbloxr",
    //"xwire/build/xwirer",
    //"xcf/build/xcfr",
    //"decor/build/decorr",
    //"dpointer/build/dpointerr"
], function (dcl,has,xapp) {

    console.log('Checkpoint 1.2 build ready');
    //return;
    //debugger;
    if(typeof logError==='undefined'){

        window['logError']=function(e,message){
            console.error('error '+message,e);
        }
    }
    //return;
    require([
        "requirejs-dplugins/has",
        "dcl/dcl",
        "dojo/has",
        'dojo/Deferred',
        //'xdojo/declare',
        'xdojo/has',
        "xblox/RunScript",
        "xblox/CSSState",
        "xblox/StyleState",
        'delite/register',        
        "delite/register",
        "deliteful/Button",
        "deliteful/Slider",
        "deliteful/Combobox",
        "deliteful/Checkbox",
        "deliteful/RadioButton",
        "deliteful/ToggleButton",
        "xdeliteful/MediaPlayer",
        "require"
    ],function(has,dcl,dHas,Deferred){

        has.add('xaction', function () {
            return true;
        });

        has.add('use-dcl', function () {
            return true;
        });

        has.add('embedded', function () {
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
        
        dHas.add('runDrivers', function () {
            return true;
        });
        has.add('runDrivers', function () {
            return true;
        });

        bootx({
            delegate:null
        },Deferred);
    });
});