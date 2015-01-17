define([
    "dojo/_base/declare",
    "xblox/model/Block"], function(declare,Block){

    // summary:
    //		The ElseIf Block model. Each ElseIf block contains a condition and a consequent to be run if the condition
    //          is true
    //
    //      This block should have an "IfBlock" parent

    // module:
    //		xblox.model.logic.ElseIfBlock
    return declare("xblox.model.logic.ElseIfBlock",[Block],{
        //  condition: (String) expression to be evaluated
        condition: null,

        //  consequent: (Block) block to be run if the condition is true
        consequent:null,
        //
        mayHaveChildren:function(){
            return this.consequent!=null;
        },
        getChildren:function(parent){
            var result=[];

            if(this.consequent){
                result.push(this.consequent);
            }
            return result;
        },
        name:'else if',
        toText:function(){
            return this.name + ' ' + this.condition;
        },
        // checks the ElseIf condition
        _checkCondition:function(scope) {
            return scope.parseExpression(this.condition);
        }

    });
});