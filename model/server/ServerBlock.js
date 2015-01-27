define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/Deferred",
    "xblox/model/Block",
    'xide/utils'
], function (declare, lang, Deferred, Block, utils) {




    /**
     * Runs a JSON-RPC-2.0 method on the server. This assumes that this block's scope has
     * a 'service object'
     */
    return declare("xblox.model.server.ServerBlock", [Block], {

        /**
         * The name of the block, used in the UI
         * @member {string}
         */
        name: 'Run Server Block',

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
        /**
         * Debugging
         * @member {function}
         */
        sharable:true,

        onReloaded: function () {


            /*console.log('is valid  ' + this.isInValidState());
             console.log('current service class ' + this.getServiceClass());
             console.log('current service class method ' + this.getServiceMethod());*/
            var service = this.getService();
            //var params = this.utils.byString(service,'_smd.services.'+ this.method.replace('::','.'));

            var params = service.getParameterMap(this.getServiceClass(), this.getServiceMethod());
            console.log('params', params);
            var cwd = 'root://test';
            var cmd = 'ls';
            var fun = this.getServerFunction(),
                thiz = this;

            if (fun) {
                var _cb = function (response) {
                    console.log('hello from server', response);
                };
                var _value = service.base64_encode(cmd);
                service.callMethodEx(this.getServiceClass(), 'run', ['sh', _value, cwd], _cb);
            }

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

            this._currentIndex = 0;
            this._return = [];

            var _script = '' + this.method;
            var thiz = this;

            if (_script && _script.length) {

                var _function = new Function("{" + _script + "}");
                var _args = this.getArgs();
                try {
                    var _parsed = _function.apply(this, _args || {});
                    this._lastResult = _parsed;

                    if (run) {
                        run('Expression ' + _script + ' evaluates to ' + _parsed);
                    }
                    if (_parsed !== 'false' && _parsed !== false) {
                        this.onSuccess(this, settings);
                    } else {
                        this.onFailed(this, settings);
                        return [];
                    }
                } catch (e) {
                    if (error) {
                        error('invalid expression : \n' + _script + ': ' + e);
                    }
                    this.onFailed(this, settings);
                    return [];
                }
            } else {
                console.error('have no script');
            }
            var ret = [], items = this[this._getContainer()];
            if (items.length) {
                this.runFrom(items, 0, settings);
            } else {
                this.onSuccess(this, settings);
            }

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
        getServerDefaultFields:function(target){

            var fields = target || [];

            fields.push(this.utils.createCI('args', 27, this.args, {
                group: 'General',
                title: 'Arguments',
                dst: 'args'
            }));

            return fields;
        },
        //  standard call for editing
        getFields: function () {
            var fields = this.inherited(arguments) || this.getDefaultFields();
            var thiz = this;
/*
            fields.push(this.utils.createCI('args', 27, this.args, {
                group: 'General',
                title: 'Arguments',
                dst: 'args'
            }));
            */

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