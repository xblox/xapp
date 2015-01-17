define([
    'dojo/_base/declare',
    'dojo/_base/array',
    './_Base'
],function(declare,array,_Base)
{
    /**
     * Javascript code generator
     */
    return declare("xblox.generator.Javascript",_Base,
    {
        /***
         * Print a set of variables as Javascript
         *
         * Supported modes:
         *
         * 1. output variables straight forward as they are, no evaluation
         * 2. evaluated : means it actually evaluates the variables and then prints the result!
         * this for now!
         *
         * @param scope {xblox.model.Scope}
         * @param variables {Array}
         * @param resolve {Boolean}
         * @returns {string}
         */
        printVariables:function(scope,variables,resolve){

            var result='';
            for(var i = 0 ; i  < variables.length ; i++){

                var _var = variables[i];
                var _varVal = ''+_var.value;
                if(_varVal.length==0){
                    continue;
                }

                if(resolve===true){
                    _varVal = scope.expressionModel.parseVariable(scope,_var);//
                }

                result+="var " + _var.title + " = " + _varVal + ";";
                result+="\n";
            }
            return result;
        },
        /***
         * Print a set of blocks, in the order as in the array
         *
         * Supported modes:
         * 1. output variables straight forward as they are, no evaluation
         *
         * @param scope {xblox.model.Scope}
         * @param blocks {Array}
         * @returns {string}
         */
        printBlocks:function(scope,blocks){
            var result='';
            for(var i = 0 ; i  < blocks.length ; i++){
                var block = blocks[i];


                /***
                 * Variant 1: 'Create the Code here'
                 */

                //simple example : if block
                if(block.declaredClass=='xblox.model.logic.IfBlock'){

                    //start
                    result+='if(' + block.condition + '){';

                    //iterate over blocks in 'consequent'
                    array.forEach(block.consequent,function(item){

                    });

                }

                /***
                 * Variant 2: 'Let the block create the code
                 */
                result+=block.toCode('Javascript');

            }
            return result;
        }
    });
});