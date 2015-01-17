define([
    "dojo/_base/declare",
    "xblox/model/Block",
    "xide/utils"
], function(declare,Block,utils){

    // summary:
    //		The command model. A 'command' consists out of a few parameters and a series of
    //      expresssions. Those expressions need to be evaluated before send them to the device

    // module:
    //		xblox.model.variables.Variable
    return declare("xblox.model.variables.Variable",[Block],{

        //declaredClass: String (dcl internals, private!)

        //name: String
        //  the variable's name, it should be unique within a scope
        title:null,

        //type: Integer refers to types.ECIType
        //  the variable's type : possible values:
        //      BOOL:0
        //      FLOAT:6
        //      INTEGER:7
        //      STRING:13
        type:null,

        //value: Current variable value
        value:null,

        register:true,

        readOnly:false,

        getValue:function(){
            return this.value;
        },
        canDisable:function(){
            return false;
        },
        /***
         * Auto register variable if the scope is provided
         *
         * @param arguments
         */
        constructor: function(arguments) {

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

            if (this.scope && this.register!==false)
            {
                this.scope.registerVariable(this);
            }
        },

        canMove:function(){
            return false;
        },
        getIconClass:function(){
            return 'el-icon-quotes-alt';
        },
        solve:function(){

            var _result = this.scope.parseExpression(this.getValue(),true);
            console.log('resolved variable ' + this.title + ' to ' + _result);
            return [];

        },
        getFields:function(){

            var fields = this.getDefaultFields();

            fields.push(this.utils.createCI('title',13,this.title,{
                group:'General',
                title:'Name',
                dst:'title'
            }));

            var thiz=this;

            fields.push(this.utils.createCI('value',25,this.value,{
                group:'General',
                title:'Value',
                dst:'value',
                delegate:{
                    runExpression:function(val,run,error){
                        return thiz.scope.expressionModel.parse(thiz.scope,val,false,run,error);
                    }
                }
            }));
            return fields;
        }
    });
});