define([
    "dojo/_base/declare",
    "xblox/model/ModelBase",
    "xide/types",
    "xide/factory"
], function(declare,ModelBase,types,factory)
{
    // module:
    //		xblox.model.Expression
    return declare("xblox.model.Expression",[ModelBase], {
        id:null,
        context:null,
        //declaredClass: ,//not required but enables comment completition in PHP/Web-Storm

        // Constants
        variableDelimiters : {
            begin : "[",
            end : "]"
        },
        blockCallDelimiters: {
            begin : "{",
            end : "}"
        },
        expressionCache:{
        },
        // Main parse method
        parse:function(scope,expression,addVariables,runCallback,errorCallback,context) {
            expression = this.replaceAll("''","'",expression);//weird!
            //expression = this.replaceBlockCalls(scope,expression);
            expression = this.replaceVariables(scope,expression);

            if(!this.isScript(expression) && (this.isString(expression) || this.isNumber(expression))){
                return expression;
            }


            if(expression.indexOf('return')==-1){
                expression = 'return ' + expression;
            }else{
                /*expression = 'return ' + expression;*/
            }
            addVariables=false;
            if(addVariables===true){
                var _otherVariables = scope.variablesToJavascript(null,expression);
                if(_otherVariables){
                    expression = _otherVariables + expression;
                    expression = this.replaceAll("''","'",expression);//weird!
                }
            }

            var parsed = this;
            try{
                expression = this.replaceAll("''","'",expression);//weird!

                var _function = this.expressionCache[expression];
                if(!_function){
                    _function = new Function("{" +expression+"; }");
                    this.expressionCache[expression] = _function;
                }
                //parsed = (new Function("{" +expression+"; }")).call(this.context||{});
                parsed = _function.call(context || this.context||{});


            }catch(e){
                console.error('     invalid expression : \n' + expression ,e);
                if(errorCallback){
                    errorCallback('invalid expression : \n' + expression + ': ' + e);
                }
                parsed='' + expression;
                return parsed;
            }
            if(parsed===true){
                console.log('        expression return true! : ' + expression);
            }

            if(runCallback){
                runCallback('Expression ' + expression + ' evaluates to ' + parsed);
            }
            //console.log(parsed);
            return parsed;
        },
        parseVariableO:function(scope,_var){

            var value = ''+ _var.value;
            if(_var.title==='None'){
                return '';
            }
            try{
                //put other variables on the stack;
                var _otherVariables = scope.variablesToJavascript(_var,false);
                if(_otherVariables){
                    value = _otherVariables + value;
                }
                var _function = new Function("{" + value+ "}");

                var _parsed = _function.call(this.context||{});
                if(_parsed==='undefined' || typeof _parsed ==='undefined'){
                    value = '' + _var.value;
                }else{
                    if(!this.isNumber(_parsed)){
                        value = ''+_parsed;
                        value = "'" + value + "'";
                    }else{
                        value = _parsed;
                    }

                }
            }catch(e){
                console.error('parse variable failed : ' + _var.title + "\n" + value);
            }
            return value;
        },
        variableFuncCache:{

        },
        parseVariable:function(scope,_var){

            var value = ''+ _var.value;
                var _function = this.variableFuncCache[_var.title];
                if(!_function){
                    _function = new Function("{" + value+ "}");
                    this.variableFuncCache[_var.title]=_function;
                }
                var _parsed = _function.apply(this.context||{});
                if(_parsed==='undefined' || typeof _parsed ==='undefined'){
                    value = '' + _var.value;
                }else{
                    if(!this.isNumber(_parsed)){
                        value = ''+_parsed;
                        value = "'" + value + "'";
                    }else{
                        value = _parsed;
                    }

                }
            return value;
        },
        // Replace variable calls width variable values
        replaceVariables:function(scope,expression,_evaluate,_escape) {

            var ocurr = this._findOcurrences( expression , this.variableDelimiters );

            if (ocurr) {
                for(var n = 0; n < ocurr.length; n++ )
                {
                    // Replace each variable call width the variable value
                    var _var = this._getVar(scope,ocurr[n]);
                    var value = null;
                    if(_var){
                        value = this.getValue(_var.value);

                        if(this.isScript(value) && _evaluate!==false){
                            try{

                                //put other variables on the stack: should be avoided
                                var _otherVariables = scope.variablesToJavascript(_var,true);
                                if(_otherVariables){
                                    value = _otherVariables + value;
                                }

                                var _parsed = (new Function("{" + value+ "}")).call(this.context||{});
                                console.log(' parsed variable value to : ' + _parsed);

                                //wasnt a script
                                if(_parsed==='undefined' || typeof _parsed ==='undefined'){
                                    //console.log(' parsed variable to undefined : ' + _var.title + ' with value : ' + value);
                                    value = '' + _var.value;
                                }else{
                                    value = _parsed;
                                    value = "'" + value + "'";
                                }
                            }catch(e){
                                console.log(' parsed variable expression failed \n' + value,e);
                            }
                        }else{
                            if(!this.isNumber(value)){
                                if(_escape!==false) {
                                    value = "'" + value + "'";
                                }else{

                                }
                            }else{

                            }
                        }
                    }else{
                        console.log('   expression failed, no such variable :' + ocurr[n] + ' ! setting to default ' + '');
                        value = '';
                    }
                    expression = expression.replace(ocurr[n],value);
                }
            }

            return expression;
        },

        // Replace block call with block result
        replaceBlockCalls:function(scope,expression) {
            var ocurr = this._findOcurrences( expression, this.blockCallDelimiters );

            if (ocurr) {
                for(var n = 0; n < ocurr.length; n++ )
                {
                    // Replace each block call with block result
                    var blockName = this._removeDelimiters( ocurr[n],this.blockCallDelimiters );
                    var blockResult = scope.solveBlock(blockName).join("\n");
                    expression = expression.replace(ocurr[n],blockResult);
                }
            }

            return expression;
        },


        // gets a variable from the scope using text [variableName]
        _getVar:function(scope,vartext) {
            return scope.getVariable(this._getVarName(vartext));
        },

        _getVarName:function(vartext) {
            return this._removeDelimiters(vartext,this.variableDelimiters);
        },

        _removeDelimiters:function(text,delimiters) {
            var text = text.replace(delimiters.begin,'')
                          .replace(delimiters.end,'');
            return text;
        },

        // escape regular expressions special chars
        _escapeRegExp:function(string) {
            var special = [ "[" ,"]" , "(" , ")" , "{", "}" , "*" , "+" , "." ];

            for (var n = 0; n < special.length ; n++ )
            {
                string = string.replace(special[n],"\\"+special[n]);
            }
            return string;
        },
        /**
         * Finds a term in an expression by start and end delimiters
         * @param expression
         * @param delimiters
         * @returns {*|Boolean|Array|Route|Collection|SchemaType}
         * @private
         */
        _findOcurrences:function(expression,delimiters) {
            // prepare delimiters for the regular expression
            var d = {
                begin: this._escapeRegExp(delimiters.begin),
                end:   this._escapeRegExp(delimiters.end)
            };

            // regular expression for [<content>]
            var allExceptEnd = "[^" + d.end + "]*";

            // final regular expression = find all [variables]
            var patt = d.begin + "(" + allExceptEnd + ")" + d.end;

            return expression.match( new RegExp(patt,'g') );
        }
    });
});