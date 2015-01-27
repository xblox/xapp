define([
    "dojo/_base/declare",
    "xblox/model/Block",
    "xblox/model/variables/Variable"], function(declare,Block,Variable){

    // summary:
    //		The for block model. It repeats a block a number of times, while the condition is true.
    //

    // module:
    //		xblox.model.loops.ForBlock
    return declare("xblox.model.loops.ForBlock",[Block],{

        // initial: xcf.model.Expression
        // the initial value
        initial: null,

        // final: xcf.model.Expression
        // the final value to be compared with the counter. Once the final value equals to the counter, the loop stops
        "final": null,

        //comparator: xblox.model.Comparator
        // Comparison to be applied -> compare <counter variable> width <final>
        comparator: null,

        // modifier: xcf.model.Expression
        // expression to be applied to the counter on every step. Expression: "<counter><modifier>"
        modifier: null,

        //items: Array (xblox.model.Block)
        //  block to be executed while the condition compare <counter variable> width <final> is false
        items: null,

        //counterName: String
        // the counter variable name
        counterName: null,

        // (private) counter: xblox.model.Variable
        // counter to be comparated and updated on every step
        _counter: null,

        name:'For',

        sharable:true,

        _solve:function(scope,settings){
            var ret=[];

            for(var n = 0; n < this.items.length ; n++)
            {
                this.addToEnd( ret , this.items[n].solve(scope,settings) );
            }
            return ret;
        },

        // solves the for block (runs the loop)
        solve:function(scope,settings) {
            var ret = [];
            var noInfinite = true;

            // 1. Create and initialize counter variable
            this._counter = new Variable({
                title : this.counterName,
                value : this.initial,
                scope : scope,
                register:false
            });

            // 2. Compare counter width final using comparator
            // 3. IF TRUE -
            while (this._checkCondition(scope)) {
                //var p = this.inherited(arguments);
                //console.error('parents : ' + p);
                // 4. Run Block
                this.addToEnd( ret , this._solve(scope,settings) );

                // 5. Update counter
                noIfinite = this._updateCounter(scope);

                if (!noInfinite) break;
                // 6. go back to (2)
            }

            return ret;
        },

        // checks the loop condition
        _checkCondition:function(scope) {
            var expression = '' + this._counter.value + this.comparator + this['final'];
            return scope.parseExpression(expression);
        },

        // updates the counter
        _updateCounter:function(scope) {
            var value = this._counter.value;
            var expression = '' + value + this.modifier;
            var value = scope.parseExpression(expression);

            // Detect infinite loops
            if (value == this._counter.value) {
                return false;
            } else {
                this._counter.value = value;
                return true;
            }
        },
        /**
         * Store function override
         * @param parent
         * @returns {boolean}
         */
        mayHaveChildren:function(parent){
            return this.items!=null && this.items.length>0;
        },

        /**
         * Store function override
         * @param parent
         * @returns {Array}
         */
        getChildren:function(parent){
            var result=[];

            if(this.items){
                result=result.concat(this.items);
            }
            return result;
        },
        /**
         * @TODO
         * should return a number of valid classes
         * @returns {Array}
         */
        canAdd:function(){
            return [];
        },
        /**
         * UI, Block row editor, returns the entire text for this block
         * @returns {string}
         */
        toText:function(){
            return this.getBlockIcon('F') + this.name + ' ' + this.initial + ' ' + this.comparator + ' ' + this['final']  + ' with ' + this.modifier;
        },
        /**
         * UI
         * @returns {*[]}
         */
        getFields:function(){

            var fields = [

                this.utils.createCI('initial',13,this.initial,{
                    group:'General',
                    title:'Initial',
                    dst:'initial'
                }),
                this.utils.createCI('Final',13,this['final'],{
                    group:'General',
                    title:'Final',
                    dst:'final'
                }),
                this.utils.createCI('comparator',13,this.comparator,{
                    group:'General',
                    title:'Comparision',
                    dst:'comparator'
                }),
                this.utils.createCI('modifier',13,this.modifier,{
                    group:'General',
                    title:'Modifier',
                    dst:'modifier'
                })
            ];
            fields = fields.concat(this.inherited(arguments));
            return fields;
        }
    });
});