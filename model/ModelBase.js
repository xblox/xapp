define([
    "dojo/_base/declare",
    "xide/utils"
], function(declare,utils){

    // module:
    //		xblox.model.ModelBase
    return declare('xblox.model.ModelBase',null,{
        id:null,
        description:'',
        parent:null,
        parentId:null,
        group:null,
        order:0,
        /***
         * Standard constructor for all subclassing blocks
         * @param {array} arguments
         */
        constructor: function(arguments){

            //simple mixin of constructor arguments
            for (var prop in arguments) {
                if (arguments.hasOwnProperty(prop)) {

                    this[prop] = arguments[prop];
                }
            }
            if(!this.id){
                this.id = this.createUUID();
            }

            //short cuts
            this.utils=utils;

        },
        ////////////////////////////////////////////////////////////
        //
        //  Standard tools
        //
        ////////////////////////////////////////////////////////////
        keys: function (a) {
            var b = [];
            for (var c in a) {
                b.push(c);
            }
            return b;
        },
        values: function (b) {
            var a = [];
            for (var c in b) {
                a.push(b[c]);
            }
            return a;
        },
        toArray: function () {
            return this.map();
        },
        size: function () {
            return this.toArray().length;
        },
        createUUID:function(){
            // summary:
            //		Create a basic UUID
            // description:
            //		The UUID is created with Math.Random
            var S4 = function() {
                return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
            };
            return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4()); //String
        },
        canEdit:function(){
            return true;
        },
        getFields:function(){
            return null;
        },
        isString: function (a) {
            return typeof a == "string"
        },
        isNumber: function (a) {
            return typeof a == "number"
        },
        isBoolean: function (a) {
            return typeof a == "boolean"
        },
        isObject:function(a){
            return typeof a === 'object';
        },
        isArray:function(a){
            if (Array.isArray){
                return Array.isArray(a);
            }
            return false;
        },
        getValue:function(val){

            var _float = parseFloat(val);
            if(!isNaN(_float)){
               return _float;
            }
            if(val==='true' || val===true){
                return true;
            }
            if(val==='false' || val===false){
                return false;
            }
            return val;

        },
        isScript:function(val){
            return this.isString(val) && val.indexOf('@')==-1 && (
                val.indexOf('return')!=-1||
                    val.indexOf(';')!=-1||
                    val.indexOf('+')!=-1||
                    val.indexOf('-')!=-1||
                    val.indexOf('<')!=-1||
                    val.indexOf('*')!=-1||
                    val.indexOf('/')!=-1||
                    val.indexOf('%')!=-1||
                    val.indexOf('=')!=-1||
                    val.indexOf('>')!=-1||
                    val.indexOf('[')!=-1||
                    val.indexOf('{')!=-1||
                    val.indexOf('}')!=-1
                );
        },
        replaceAll:function(find, replace, str) {
            if(this.isString(str)){
                return str.split(find).join(replace);//faster!
            }
            return str;
        },
        isInValidState:function(){
            return true;
        }
    });
});