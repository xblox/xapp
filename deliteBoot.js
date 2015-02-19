define([
    "dojo/_base/declare",
    "dojo/_base/Deferred",
    "require"
], function (declare,Deferred,require) {

    /*
    require.config({
        paths: {
            "ibm-js": "../ibm-js"
        },
        packages:[
            {
                name:'delite',
                location:'ibm-js/delite'
            }
        ]
    });
    */

    require(["delite/register"],function(register){


    });

    return declare('xapp/deliteBoot',null,{});
});

