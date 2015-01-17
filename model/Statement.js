define([
    "dojo/_base/declare",
    "./Block"], function(declare,Block){

    // summary:
    //		The statement block is only a wrapper for items like in 'else'

    // module:
    //		xblox.model.Statement
    return declare("xblox.model.Statement",[Block],{
        /**
         * Return block name
         * @returns {name|*}
         */
        toText:function(){
            return this.name;
        },
        /**
         *
         * @returns {items|*}
         */
        getChildren:function(){
            return this.items;
        }

    });
});