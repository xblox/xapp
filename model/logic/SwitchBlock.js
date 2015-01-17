define([
    "dojo/_base/declare",
    "xblox/model/Block",
    "xblox/model/logic/CaseBlock"], function(declare,Block,CaseBlock){

    // summary:
    //		Switchs on  a variable's value and runs one case block

    // module:
    //		xblox.model.SwitchBlock
    return declare("xblox.model.SwitchBlock",[Block],{

        // switchVariable: xcf.model.Variable
        //  3.12.10.3. The “variable” field indicates the variable name to be evaluated
        //  into the switch block
        variable: 'PowerState',

        //items: Array (xblox.model.CaseBlock / xblox.model.Block)
        //  Each case to be evaluated / Block to be executed if none of the cases occurs.
        //
        //
        items:null,

        name:'Switch',

        toText:function(){
            return this.getBlockIcon('H') + this.name + ' ' + this.variable;
        },

        canAdd:function(){
            return [];
        },

        /***
         * Solve the switchblock
         *
         * @param scope
         * @returns {string} execution result
         */
        solve:function(scope,settings) {
            var anyCase = false;    // check if any case is reached
            var ret = [];
            this.onSuccess(this,settings);
            // iterate all case blocks
            for(var n = 0; n < this.items.length ; n++)
            {
                var block = this.items[n];

                if (block.declaredClass==='xblox.model.logic.CaseBlock'/* instanceof CaseBlock*/)
                {
                    var caseret;
                    // solve each case block. If the comparison result is false, the block returns "false"
                    caseret = block.solve(scope,this,settings);
                    if (caseret != false)
                    {

                        // If the case block return is not false, don't run "else" block
                        anyCase = true;
                        this.addToEnd( ret , caseret);
                        break;
                    }else{
                        /*this.onFailed(block,settings);*/
                    }
                }
            }
            // iterate all "else" blocks if none of the cases occurs
            if (!anyCase) {
                for(var n = 0; n < this.items.length ; n++)
                {
                    var block = this.items[n];

                    if ( !(block.declaredClass=='xblox.model.logic.CaseBlock') )
                    {
                        this.addToEnd( ret , block.solve(scope) );
                    }
                }
            }

            return ret;
        },
        init:function(){

        },
        /**
         * Store function override
         * @param parent
         * @returns {Array}
         */
        getChildren:function(parent){
            return this.items;
        },
        postCreate:function(){

            this.add(CaseBlock,{
                comparator : "==",
                expression : "ON",
                group:null
            });

            this.add(CaseBlock,{
                comparator : "==",
                expression : "Standby",
                group:null
            });
        }
    });
});