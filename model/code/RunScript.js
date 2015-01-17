define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/Deferred",
    "xblox/model/Block",
    'xide/utils'
], function(declare,lang,Deferred,Block,utils){

    // summary:
    //		The Call Block model.
    //      This block makes calls to another blocks in the same scope by action name

    // module:
    //		xblox.model.code.CallMethod
    return declare("xblox.model.code.RunScript",[Block],{
        //method: (String)
        //  block action name
        name:'Run Script',
        //method: (String)
        //  block action name
        method:'',
        args:'',
        deferred:false,
        getContext:function(){

            if(this.scope.context && this.scope.context.instance){
                return this.scope.context.instance;
            }
            return null;
        },
        /***
         * Returns the block run result
         * @param scope
         * @param settings
         * @param run
         * @param error
         * @returns {Array}
         */
        solve:function(scope,settings,run,error) {

            this._currentIndex=0;
            this._return=[];

            var _script = '' + this.method;
            var thiz=this;
            //console.error('run script ' + this.method);
            if(_script && _script.length) {

                var _function = new Function("{" + _script + "}");
                var _args = this.getArgs();
                try {
                    var _parsed = _function.apply(this, _args || {});
                    this._lastResult = _parsed;

                    if(run){
                        run('Expression ' + _script + ' evaluates to ' + _parsed);
                    }
                    if(_parsed!=='false' && _parsed!==false) {
                        this.onSuccess(this, settings);
                    }else{
                        this.onFailed(this, settings);
                        return [];
                    }
                } catch (e) {
                    if(error){
                        error('invalid expression : \n' + _script + ': ' + e);
                    }
                    this.onFailed(this, settings);
                    return [];
                }
            }else{
                console.error('have no script');
            }
            var ret=[], items = this[this._getContainer()];
            if(items.length) {
                this.runFrom(items,0,settings);
            }else{
                this.onSuccess(this, settings);
            }

            return ret;
        },
        /////////////////////////////////////////////////////////////////////////////////////
        //
        //  UI
        //
        /////////////////////////////////////////////////////////////////////////////////////
        toText:function(){

            var result = this.getBlockIcon() + ' ' + this.name + ' :: ';
            if(this.method){
                result+= this.method.substr(0,50);
            }
            return result;
        },

        //  standard call from interface
        canAdd:function(){
            return [];
        },
        //  standard call for editing
        getFields:function(){
            var fields = this.inherited(arguments) || this.getDefaultFields();
            var thiz=this;

            fields.push(
                this.utils.createCI('deferred',0,this.deferred,{
                    group:'General',
                    title:'Deferred',
                    dst:'deferred'
                })
            );

            fields.push(
                this.utils.createCI('value',25,this.method,{
                    group:'General',
                    title:'Script',
                    dst:'method',
                    delegate:{
                        runExpression:function(val,run,error){
                            var old = thiz.method;
                            thiz.method=val;
                            var _res = thiz.solve(thiz.scope,null,run,error);
                        }
                    }
                }));


            fields.push(this.utils.createCI('value',27,this.args,{
                    group:'General',
                    title:'Arguments',
                    dst:'args'
                }));


            return fields;
        },
        getBlockIcon:function(){
            return '<span class="fa-code"></span>';
        },
        /////////////////////////////////////////////////////////////////////////////////////
        //
        //  Store
        //
        /////////////////////////////////////////////////////////////////////////////////////
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
            return this.items;
        }


    });
});