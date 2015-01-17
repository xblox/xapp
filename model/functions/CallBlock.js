define([
    "dojo/_base/declare",
    "xblox/model/Block"], function(declare,Block){

    // summary:
    //		The Call Block model.
    //      This block makes calls to another blocks in the same scope by action name

    // module:
    //		xblox.model.functions.CallBlock
    return declare("xblox.model.functions.CallBlock",[Block],{
        //command: (String)
        //  block action name
        command:'PowerStandby',

        /***
         * Returns the block run result
         * @param scope
         */
        solve:function(scope,settings) {
            if (this.command)
            {
                this.onRun(this,settings);
                return scope.solveBlock(this.command);
            }
        },
        toText:function(){
            return this.getBlockIcon('D') + 'Call Command : ' + this.command;
        },
        //  standard call for editing
        getFields:function(){

            var fields = this.inherited(arguments);

            fields.push(this.utils.createCI('value',3,this.command,{
                    group:'General',
                    title:'Command',
                    dst:'command',
                    options:this.scope.getCommandsAsOptions()
            }));
            return fields;
        }


    });
});