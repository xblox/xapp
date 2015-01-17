define([
    "dojo/_base/declare",
    "xblox/model/Block",
    "xide/utils",
    "xide/types",
    "xide/factory"], function(declare,Block,utils,types,factory){

    // summary:
    //		The Call Block model.
    //      This block makes calls to another blocks in the same scope by action name

    // module:
    //		xcf.model.variables.VariableAssignmentBlock
    return declare("xblox.model.variables.VariableAssignmentBlock",[Block],{

        //declaredClass: String (dcl internals, private!)

        //variable: (String)
        //  variable title
        variable:null,

        //value: (String)
        // Expression to be asigned
        value:null,
        name:'Set Variable',
        toText:function(){

            var res = this.getBlockIcon('C') + this.name + ' ' + this.variable + ' to ' + this.value;
            /*
            if ((this.variable) && (this.value))
            {
                var  exprVal = this.scope.parseExpression(this.value);
                res+=exprVal;
            }
            */
            return res;
        },
        /***
         * Makes the assignation
         * @param scope
         */

        solve:function(scope,settings) {
            if ((this.variable) && (this.value))
            {
                this.onRun(this,settings);

                //var _variable = scope.getVariable(this.variable).value = scope.parseExpression(this.value);
                var _variable = scope.getVariable(this.variable);
                if(!_variable){
                    console.error('     no such variable : ' + this.variable);
                    return [];
                }
                if(this.isScript(this.value)){
                    _variable.value = scope.parseExpression(this.value);
                    _variable.value = this.replaceAll("'",'',_variable.value);
                }else{
                    _variable.value = this.value;
                }
                console.log(this.variable+" is now " + _variable.value);

                factory.publish(types.EVENTS.ON_DRIVER_VARIABLE_CHANGED,{
                    item:_variable,
                    scope:this.scope,
                    save:false,
                    block:this
                });

                return [];
            }
        },
        //  standard call from interface
        canAdd:function(){
            return null;
        },
        //  standard call for editing
        getFields:function(){

            var fields = this.inherited(arguments);
            var thiz=this;

            fields.push(this.utils.createCI('Variable',3,this.variable,{
                    group:'General',
                    options:this.scope.getVariablesAsOptions(),
                    dst:'variable'
            }));

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