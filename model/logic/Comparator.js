define([
    "dojo/_base/declare",
    "../ModelBase"], function(declare,ModelBase){

    // summary:
    //		The comparator model. A comparator compares two values and returns a boolean, indicating if the comparison
    //      is true of false

    // module:
    //		xblox.model.Comparator
    return declare("xblox.model.Comparator",[ModelBase],{
        //name: string
        // Comparator public name/representation (=,>...)
        name: ''
    });
});