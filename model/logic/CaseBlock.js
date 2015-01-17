define([
    "dojo/_base/declare",
    "xblox/model/Block"], function(declare,Block){

    // summary:
    //		The Case Block model. Each case block contains a comparation and a commands block.
    //      If the comparation result is true, the block is executed
    //
    //      This block should have an "SwitchBlock" parent

    // module:
    //		xblox.model.logic.CaseBlock
    return declare("xblox.model.logic.CaseBlock",[Block],{
        //comparator: xblox.model.Comparator
        // Comparison to be applied -> compare <switch variable> width <expression>
        comparator:null,

        //expression: xblox.model.Expression
        // expression to be compared
        expression:null,

        //items: Array (xblox.model.Block)
        //  block to be executed if the comparison result is true
        items:null,

        name:'Case',

        toText:function(){
            var _comparator = '' + this.comparator;
            if(_comparator=='=='){
                _comparator =''
            }
            return this.getBlockIcon('I') + this.name + ' ' + _comparator + (this.expression !=null ?  ' ' + this.expression : '');
        },

        canAdd:function(){
            return [];
        },

        /***
         * Solves the case block
         * @param scope
         * @param switchBlock   => parent SwitchCommand block
         */
        solve:function(scope,switchBlock,settings) {
            // Get the variable to evaluate
            var switchVarValue = scope.getVariable(switchBlock.variable).value;

            var compResult = scope.parseExpression("'" + switchVarValue+ "'" + this.comparator + this.expression);

            if (compResult===true)
            {
                this.onSuccess(this,settings);
                // Comparation is true. Return block.solve();
                return this._solve(scope,settings);

            } else {
                this.onFailed(this,settings);
                // Comparation is false
                return false;
            }
        },
        /**
         * Store function override
         * @param parent
         * @returns {Array}
         */
        getChildren:function(parent){
            return this.items;
        },
        //  standard call for editing
        getFields:function(){
            var fields = this.inherited(arguments);

            fields = fields.concat(this.inherited(arguments));

            fields.push(this.utils.createCI('Expression',13,this.expression,{
                    group:'General',
                    title:'Expression',
                    dst:'expression'
                }));

            fields.push(this.utils.createCI('Comparator',13,this.comparator,{
                    group:'General',
                    title:'Comparator',
                    dst:'comparator'
            }));
            return fields;
        }
    });
});