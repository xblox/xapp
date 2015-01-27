define([
    "dojo/_base/declare",
    "xblox/model/server/ServerBlock",
    'xide/utils'
], function (declare, ServerBlock, utils) {

    /**
     * Runs a JSON-RPC-2.0 method on the server. This assumes that this block's scope has
     * a 'service object'
     */
    return declare("xblox.model.server.RunServerMethod", [ServerBlock], {


        description: 'Runs a JSON-RPC-2.0 method on the server',

        /**
         * The name of the block, used in the UI
         * @member {string}
         */
        name: 'Run Server Method',

        /**
         * The full string of the service class method, ie: MyPHPServerClass::method
         * @member {string}
         */
        method: 'XShell::run',
        /**
         * Arguments for the server call
         * @member {string}
         */
        args: '',
        /**
         * Override in super class, this block runs async by default
         * @member {boolean}
         */
        deferred: true,
        /**
         * The default for the server RPC class
         * @member {string}
         */
        defaultServiceClass: 'XShell',
        /**
         * The default for the server RPC class method
         * @member {string}
         */
        defaultServiceMethod: 'run',

        sharable:true,
        /**
         * Callback when user edited the 'method' field. This will pre-populate the arguments field when empty
         * with the known SMD parameters : if possible.
         * @param newMethod
         * @param cis
         */
        onMethodChanged: function (newMethod, cis) {
            this.method = newMethod;

            //we auto populate the arguments field
            if (!utils.isValidString(this.args)) {

                var newServerParams = this.getServerParams();
                if (newServerParams) {
                    this._updateArgs(newServerParams, cis);
                }

            }
        },
        _getArgs: function () {

            /*
            var test = [
                {
                    "name": "shellType",
                    "default": "sh", "optional": false, "value": "notset"
                },
                {
                    "name": "cmd",
                    "optional": false,
                    "value": "[CurrentDirectory]"
                },
                {
                    "name": "cwd",
                    "default": null,
                    "optional": true,
                    "value": "[CurrentDirectory]"
                }
            ];
            */

            var _args = utils.getJson(this.args);
            var result = [];
            if (_args) {
                var isSMD = false;
                //now check this is still in 'SMD' format
                if (_args && _args[0]['optional'] != null) {
                    isSMD = true;
                }
                //if SMD true, evaluate the value field
                if (isSMD) {
                    for (var i = 0; i < _args.length; i++) {
                        var _arg = _args[i];
                        var _variableValue = _arg.value;
                        var isBase64 = _arg.name.indexOf('Base64') != -1;
                        if(isBase64){
                            _variableValue = this.getService().base64_encode(_variableValue);
                        }

                        if (_arg.value !== 'notset') {
                            if (_arg.value.indexOf('[') != -1 && _arg.value.indexOf(']') != -1) {
                                _variableValue = this.scope.expressionModel.replaceVariables(this.scope, _arg.value, false, false);
                                if (_arg.name.indexOf('Base64') != -1) {
                                    _variableValue = this.getService().base64_encode(_variableValue);
                                }
                                result.push(_variableValue);
                            } else {
                                result.push(_variableValue || _arg['default']);
                            }

                        } else {
                            result.push(_arg['default'] || _variableValue);
                        }
                    }
                } else {

                }
            } else {

            }

            return result;

        },
        /**
         * Update this.args (string) with a SMD parameter set
         * @param params
         * @param cis
         * @private
         */
        _updateArgs: function (params, cis) {

            var argumentWidget = this.utils.getCIWidgetByName(cis, 'args');
            if (argumentWidget) {
                var _string = JSON.stringify(params);
                argumentWidget.editBox.set('value', _string);
                this.args = _string;

            }
        },
        /**
         * Find SMD for the current method
         * @returns {*}
         */
        getServerParams: function () {
            var service = this.getService();
            var params = service.getParameterMap(this.getServiceClass(), this.getServiceMethod());
            if (params) {
                for (var i = 0; i < params.length; i++) {
                    var param = params[i];
                    param.value = 'notset';
                }
            }
            return params;
        },
        /***
         * Returns the block run result
         * @param scope
         * @param settings
         * @param run
         * @param error
         * @returns {Array}
         */
        solve: function (scope, settings, run, error) {

            this._return = [];
            this._lastResult=null;
            var thiz = this;
            var ret = [];

            if(!this.isInValidState()){
                this.onFailed(this, settings);
                return ret;
            }

            var _args = this._getArgs();//returns SMD ready array of values
            var _cbSuccess = function (response) {
                thiz._lastResult = thiz.utils.getJson(response) || [response];
                thiz.resolved(thiz._lastResult);
                thiz.onSuccess(thiz, settings);
            };
            var _cbError = function (response) {
                //console.error('   server method ' + thiz.method + ' with params ' + JSON.stringify(_args)  + 'failed ' + response);
                thiz._lastResult = thiz.utils.getJson(response) || [response];
                thiz.resolved(thiz._lastResult);
                thiz.onFailed(thiz, settings);
            };

            this.onRun(this, settings);
            this.getService().callMethodEx(this.getServiceClass(), this.getServiceMethod(), _args, _cbSuccess,_cbError);
            return ret;
        },
        /////////////////////////////////////////////////////////////////////////////////////
        //
        //  UI
        //
        /////////////////////////////////////////////////////////////////////////////////////
        toText: function () {

            var result = this.getBlockIcon() + ' ' + this.name + ' :: ';
            if (this.method) {
                result += this.method.substr(0, 50);
            }
            return result;
        },

        //  standard call from interface
        canAdd: function () {
            return [];
        },
        //  standard call for editing
        getFields: function () {
            var fields = this.getDefaultFields();
            var thiz = this;

            fields.push(this.utils.createCI('value', 25, this.method, {
                group: 'General',
                title: 'Method',
                dst: 'method',
                description: 'This should be in the format : MyServerClass::myMethod',
                delegate: {
                    runExpression: function (val, run, error) {
                        var old = thiz.method;
                        thiz.method = val;
                        var _res = thiz.solve(thiz.scope, null, run, error);
                    }
                }
            }));
            fields = fields.concat(this.getServerDefaultFields());

            return fields;
        },
        getBlockIcon: function () {
            return '<span class="fa-plug"></span>';
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
        mayHaveChildren: function (parent) {
            return this.items != null && this.items.length > 0;
        },

        /**
         * Store function override
         * @param parent
         * @returns {Array}
         */
        getChildren: function (parent) {
            return this.items;
        },

        onChangeField: function (field, newValue, cis) {
            if (field === 'method') {
                this.onMethodChanged(newValue, cis);
            }
        },

        /**
         * Check our scope has a service object
         * @returns {boolean}
         */
        isInValidState: function () {
            return this.getService() != null;
        },
        getService: function () {
            return this.scope.getService();
        },
        getServiceClass: function () {
            return this.method.split('::')[0] || this.defaultServiceClass;
        },
        getServiceMethod: function () {
            return this.method.split('::')[1] || this.defaultServiceMethod;
        },
        hasMethod: function (method) {
            return this.isInValidState() &&
            this.getService()[this.getServiceClass()] != null &&
            this.getService()[this.getServiceClass()][this.getServiceMethod()] != null
        },
        hasServerClass: function (_class) {
            return this.isInValidState() &&
            this.getService()[this.getServiceClass()] != null;
        },
        getServerFunction: function () {
            if (this.isInValidState() && this.getServiceClass() && this.getServiceMethod()) {
                return this.getService()[this.getServiceClass()][this.getServiceMethod()];
            }
            return null;
        }


    });
});