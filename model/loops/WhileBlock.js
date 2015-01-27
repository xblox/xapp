define([
    "dojo/_base/declare",
    "xblox/model/Block",
    "xblox/model/variables/Variable"], function(declare,Block,Variable){

    // summary:
    //		The while block model. It repeats a block a number of times, while the condition is true.
    //

    // module:
    //		xblox.model.loops.WhileBlock
    return declare("xblox.model.loops.WhileBlock",Block,{

        // condition: (String) expression to be evaluated every step
        condition: null,

        //items: Array (xblox.model.Block)
        //  block to be executed while the condition is true
        items: null,

        loopLimit: 200,

        name:'While',

        wait:500,

        currentIndex:0,

        sharable:true,

        //  standard call from interface
        canAdd:function(){
            return [];
        },
        _solve:function(scope,settings){
            var ret=[];

            for(var n = 0; n < this.items.length ; n++)
            {
                this.addToEnd( ret , this.items[n].solve(scope,settings) );
            }

            return ret;
        },
        doStep:function(settings){

            if(this.currentIndex<this.loopLimit){

                var ret = [];

                var _cond = this._checkCondition(this.scope);
                /*console.log('   while ' + this.condition  + ' = ' +_cond);*/
                if(_cond) {
                    this.onSuccess(this,settings);
                    var thiz=this;
                    // IF TRUE -
                    //      -- Run Block
                    this.addToEnd( ret , this._solve(this.scope,settings));
                    this.currentIndex++;

                    setTimeout(function(){
                        thiz.doStep(settings);
                    },this.wait);
                }else{
                    this.onFailed(this,settings);
                }
            }
        },
        // solves the while block (runs the loop)
        solve:function(scope,settings) {
            var iterations = 0;

            var ret = [];

            if(this.wait>0){
                this.currentIndex=0;
                this.doStep(settings);
                return [];
            }

            // Evaluate condition
            while ((this._checkCondition(scope)) && (iterations < this.loopLimit)) {
                // IF TRUE -
                //      -- Run Block
                this.addToEnd( ret , this._solve(scope));
                iterations++;
            }
            return ret;

        },

        /**
         * Block row editor, returns the entire text for this block
         * @returns {string}
         */
        toText:function(){
            return this.getBlockIcon('G') + this.name + ' ' + this.condition;
        },

        // checks the loop condition
        _checkCondition:function(scope) {
            return scope.parseExpression(this.condition);
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
        getFields:function(){


            var thiz=this;
            var fields = this.inherited(arguments);
            fields.push(
                this.utils.createCI('condition',25,this.condition,{
                    group:'General',
                    title:'Expression',
                    dst:'condition',
                    delegate:{
                        runExpression:function(val,run,error){
                            return thiz.scope.expressionModel.parse(thiz.scope,val,false,run,error);
                        }
                    }
                })
            );

            fields.push(this.utils.createCI('wait',13,this.wait,{
                    group:'General',
                    title:'Wait',
                    dst:'wait'
            }));
            return fields;
        }


    });
});