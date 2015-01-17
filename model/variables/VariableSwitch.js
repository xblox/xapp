define([
    "dojo/_base/declare",
    "xblox/model/logic/SwitchBlock"], function(declare,SwitchBlock){

    // summary:
    //		The switch command model. These kind of commands takes a existing variable and applies some comparations.
    //      Depending on the comparation results, the code into each case block is executed or not.

    // module:
    //		xblox.model.VariableSwitch
    return declare("xblox.model.variables.VariableSwitch",[SwitchBlock],{

        //declaredClass: String (dcl internals, private!)
        name:'Switch on Variable',
        toText:function(){
            return this.getBlockIcon('H')  + this.name + ' ' + this.variable;
        },
        //  standard call for editing
        getFields:function(){

            var fields = [
                this.utils.createCI('Variable',3,this.variable,{
                    group:'General',
                    options:this.scope.getVariablesAsOptions(),
                    dst:'variable'
                })
            ];
            fields = fields.concat(this.inherited(arguments));
            return fields;
        }
    });
});