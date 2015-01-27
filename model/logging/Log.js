define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/Deferred",
    "xblox/model/Block",
    'xide/utils',
    'xide/types',
    'xide/mixins/EventedMixin'
], function(declare,lang,array,Deferred,Block,utils,types,EventedMixin){

    // summary:
    //		The Call Block model.
    //      This block makes calls to another blocks in the same scope by action name

    // module:
    //		xblox.model.code.CallMethod
    return declare("xblox.model.logging.Log",[Block,EventedMixin],{
        //method: (String)
        //  block action name
        name:'Log Message',
        level:'info',
        message:'',
        type:'XBlox',
        host:'this host',
        sharable:true,
        /////////////////////////////////////////////////////////////////////////////////////
        //
        //  UI
        //
        /////////////////////////////////////////////////////////////////////////////////////
        toText:function(){

            var result = this.getBlockIcon() + ' ' + this.name + ' :: ';
            if(this.message){
                result+= this.message;
            }
            return result;
        },
        /***
         * Returns the block run result
         * @param expression
         * @param scope
         * @param settings
         * @param run
         * @param error
         * @returns {Array}
         */
        _solveExpression:function(expression,scope,settings,run,error) {

            var _script = '' + expression;
            var thiz=this;

            if(_script && _script.length) {

                var _function = new Function("{" + _script + "}");
                var _args = this.getArgs();
                try {
                    var _parsed = _function.apply(this, _args || {});

                    if(run){
                        run('Expression ' + _script + ' evaluates to ' + _parsed);
                    }
                    return _parsed;
                } catch (e) {
                    if(error){
                        error('invalid expression : \n' + _script + ': ' + e);
                    }
                    return _script;
                }
            }else{
                console.error('have no script');
            }
            return _script;
        },
        /**
         *
         * @param scope
         * @param settings
         * @param run
         * @param error
         */
        solve:function(scope,settings,run,error) {

            var _message=this._solveExpression(this.message,scope,settings,run,error);

            var message={
                message:_message,
                level:this.level,
                type:this.type,
                details:this.getArgs()
            };

            this.onSuccess(this,settings);
            try {
                this.publish(types.EVENTS.ON_SERVER_LOG_MESSAGE, message);
            }catch(e){
                this.onFailed(this,settings);
            }

            return [];

        },
        //  standard call from interface
        canAdd:function(){
            return null;
        },
        //  standard call for editing
        getFields:function(){
            var fields = this.inherited(arguments) || this.getDefaultFields();
            var thiz=this;

            var options = [
                {
                    value:'info',
                    label:'Info'
                },
                {
                    value:'warning',
                    label:'Warning'
                },
                {
                    value:'error',
                    label:'Error'
                }
            ];

            fields.push(this.utils.createCI('Event',3,this.event,{
                group:'General',
                options:options,
                dst:'level'
            }));

            fields.push(
                this.utils.createCI('message',25,this.message,{
                    group:'General',
                    title:'Message',
                    dst:'message',
                    delegate:{
                        runExpression:function(val,run,error){
                            var _res = thiz._solveExpression(val,thiz.scope,null,run,error);
                        }
                    }
                }));

            fields.push(

                this.utils.createCI('message',13,this.type,{
                    group:'General',
                    title:'Type',
                    dst:'type'
                }));

            return fields;
        },
        getBlockIcon:function(){
            return '<span class="fa-bug"></span>';
        }
    });
});