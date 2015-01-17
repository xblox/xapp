define([
    "dojo/_base/declare",
    "xblox/model/Block",
    'xide/utils'
], function(declare,Block,utils){

    // summary:
    //		The Call Block model.
    //      This block makes calls to another blocks in the same scope by action name

    // module:
    //		xblox.model.code.CallMethod
    return declare("xblox.model.code.CallMethod",[Block],{
        //method: (String)
        //  block action name
        name:'Call Method',

        //method: (String)
        //  block action name
        method:'',
        args:'',
        getContext:function(){
            if(this.scope.context && this.scope.context.instance){
                return this.scope.context.instance;
            }
            return null;
        },
        _getArg:function(val){


            //try auto convert to number
            var _float = parseFloat(val);
            if(!isNaN(_float)){
                return _float;
            }else{

                if(val==='true' || val==='false'){
                    return utils.toBoolean(val);
                }
                return val;

            }
            return val;
        },
        _getArgs:function(){
            var result = utils.getJson(this.args);
            if(result!=null && this.isArray(result)){
                return result;
            }

            //try multiple args per string
            if(this.isString(this.args)){
                var result = [];
                if(this.args.indexOf(',')!==-1){
                    var _splitted = this.args.split(',');
                    for(var i = 0 ; i <_splitted.length ; i++){

                        //try auto convert to number
                        var _float = parseFloat(_splitted[i]);
                        if(!isNaN(_float)){
                            result.push(_float);
                        }else{

                            if(_splitted[i]==='true' || _splitted[i]==='false'){
                                result.push(utils.toBoolean(_splitted[i]));
                            }else{
                                result.push(_splitted[i]);//whatever
                            }
                        }
                    }
                    return result;
                }else{
                    return [this._getArg(this.args)];
                }
            }
            return null;
        },
        /***
         * Returns the block run result
         * @param scope
         */
        solve:function(scope,settings) {
            var context = this.getContext();
            if (context && context[this.method]!=null)
            {
                var res = [];
                var _fn = context[this.method];
                try{
                    var _args = this._getArgs();
                    var _res = _fn.apply(context,_args||[]);
                    res = _res;
                    this.onSuccess(this,settings);
                    return res;
                }catch(e){
                    console.error('call method failed');
                    this.onFailed(this,settings);
                }
            }else{
                this.onFailed(this,settings);
                return [];
            }
            return [];
        },
        toText:function(){

            var result = this.getBlockIcon() + ' ' + this.name + ' ';
            if(this.method){
                result+= this.method.substr(0,20);
            }
            return result;
        },

        //  standard call for editing
        getFields:function(){
            var fields = this.inherited(arguments);

            fields.push(this.utils.createCI('value',13,this.method,{
                    group:'General',
                    title:'Method',
                    dst:'method'
                }));

            fields.push(this.utils.createCI('value',27,this.args,{
                    group:'General',
                    title:'Arguments',
                    dst:'args'
                }));

            return fields;
        },
        getBlockIcon:function(){
            return '<span class="fa-caret-square-o-right"></span>';
        }


    });
});