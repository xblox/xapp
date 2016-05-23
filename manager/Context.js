define([
    "dcl/dcl",
    'dojo/_base/declare',
    'dojo/_base/lang',
    'xide/manager/ContextBase',
    'xide/manager/PluginManager',
    'xapp/manager/Application',
    'xide/mixins/EventedMixin',
    'xide/types',
    'xide/utils',
    './_WidgetPickerMixin',
    'require',
    'xide/manager/Reloadable',
    'xdojo/has'

], function (dcl,declare, lang, ContextBase, PluginManager, Application, EventedMixin, types, utils, _WidgetPickerMixin, require, Reloadable,has,on) {

    var isIDE = has('xcf-ui');
    var debugWire = false;
    var debugBoot = false;

    return dcl([ContextBase, Reloadable, _WidgetPickerMixin], {
        declaredClass:"xapp/manager/Context",
        settings: null,
        application: null,
        blockManager: null,
        getVariable: function (deviceId, driverId, variableId) {

            var deviceManager = ctx.getDeviceManager();
            var device = deviceManager.getDeviceById(deviceId),
                result = null;
            if (!device) {
                return null;
            }

            var driverScope = device.driver;
            //not initiated driver!
            if (driverScope && driverScope.blockScope) {
                driverScope = driverScope.blockScope;
            }

            if (!driverScope) {
                console.error('have no driver, use driver from DB');
                if (device) {
                    var driverId = deviceManager.getMetaValue(device, types.DEVICE_PROPERTY.CF_DEVICE_DRIVER);
                    driverScope = ctx.getBlockManager().getScope(driverId);

                    result = driverScope.getVariableById(driverId + '/' + variableId);

                }
            }

            return result;
        },
        wireNode: function (widget, event, block, params) {

            var thiz = this,
                rejectFunction = null,
                onBeforeRun = null;

            if(!widget['__setup']){
                widget['__setup']={};
            }

            if(widget['__setup'][block.id]){
               return;
            }

            widget['__setup'][block.id]=true;

            if (params) {
                if (event === types.EVENTS.ON_DRIVER_VARIABLE_CHANGED) {

                    var varParams = params.params;
                    var deviceId = varParams[0],
                        driverId = varParams[1],
                        variableId = varParams[2];


                    var variable = this.getVariable(deviceId, driverId, variableId);

                    rejectFunction = function (evt) {

                        var variable = evt.item;
                        if (variable.id === variableId) {
                            return false;
                        }
                        return true;
                    };

                    onBeforeRun = function (block, evt) {

                        var variable = evt.item;
                        block.override = {
                            variables: {
                                value: variable.value
                            }
                        };
                    }
                }

            }


            if (!widget) {
                console.error('have no widget for event ' + event);
                return;
            }
            if (!block) {
                console.error('have no block for event ' + event);
                return;
            }

            if (!event) {
                console.error('have no event');
                return;
            }

            if (!_.isString(event)) {
                console.error('event not string ', event);
                return;
            }

            debugWire && console.log('wire node : ' + event);


            /**
             *
             * @param event
             * @param value: original event data
             * @param block
             * @param widget
             */
            var run = function (event, value, block, widget) {

                if(event==='load' && widget.__didRunLoad){
                    return;
                }
                if(event==='load'){
                    widget.__didRunLoad=true;
                }

                if (thiz.delegate && thiz.delegate.isDesignMode && thiz.delegate.isDesignMode()) {
                    return;
                }

                //filter, custom reject function
                if (rejectFunction) {

                    var abort = rejectFunction(value);
                    if (abort) {
                        return;
                    }
                }
                console.log('run ! ' + event + ' for block '+block.name + ':' +block.id );
                if (block._destroyed) {
                    console.error('run failed block invalid, block has been removed');
                    return;
                }

                if (!block.enabled) {
                    return;
                }
                var context = widget,
                    result;
                if (block && context) {
                    block.context = context;
                    block._targetReference = context;

                    if (onBeforeRun) {
                        onBeforeRun(block, value);
                    }

                    result = block.solve(block.scope, {
                        highlight: true
                    });
                    debugWire && console.log('run ' + block.name + ' for even ' + event, result + ' for ' + this.id);
                }
            };

            //patch the target
            if (!widget.subscribe) {
                utils.mixin(widget, EventedMixin.prototype);
            }

            var _target = widget.domNode || widget,
                _event = event,
                _isWidget = widget.declaredClass || widget.startup,
                _hasWidgetCallback = widget.on != null && widget['on' + utils.capitalize(_event)] != null,
                _handle = null,
                _isDelite = _target.render != null && _target.on != null;


            if (_isWidget &&
                    //dijit
                (widget.baseClass && widget.baseClass.indexOf('dijitContentPane') != -1)
                    //delite
                || widget.render != null || widget.on != null) {
                _isWidget = false;//use on
            }

            if (_target) {

                //plain node
                if (!_isDelite && (!_hasWidgetCallback || !_isWidget)) {
                    _handle = widget.__on(_target, event, function (evt) {
                        run(event, evt, block, widget);

                    });

                    //_handle = on(_target, event, function (evt) {
                        //run(event, evt, block, widget);
                    //});

                } else {

                    _target = widget;
                    var useOn = true;
                    if (useOn) {
                        if (!_isDelite) {
                            var _e = 'on' + utils.capitalize(_event);

                            widget[_e] = function (val, nada) {
                                if (_target.ignore !== true) {
                                    run(event, val);
                                }
                            }
                        } else {
                            if (utils.isSystemEvent(event)) {
                                _handle = _target.subscribe(event, function (evt) {
                                    run(event, evt, block, widget);
                                }.bind(this), widget);

                            }
                            else {

                                if (utils.isNativeEvent(event)) {
                                    event = event.replace('on', '');
                                }
                                _handle = _target.on(event, function (evt) {
                                    run(event, evt.currentTarget.value, block, widget);
                                }.bind(this));
                            }
                        }

                    } else {
                        widget['on' + utils.capitalize(_event)] = function (val) {
                            if (_target.ignore !== true) {
                                run(event, val);
                            }
                        }
                    }
                }

                if (_handle) {

                    if (widget.addHandle) {
                        widget.addHandle(event, _handle);
                    }
                    if (!block._widgetHandles) {
                        block._widgetHandles = [];
                    }
                    block._widgetHandles.push(_handle);

                }else{
                    console.error('wire widget: have no handle',widget);
                }
            }
        },
        wireWidget: function (scope, widget, node, event, group, params) {

            var blocks = scope.getBlocks({
                group: group
            });
            console.log('wire widget : ' + event + ' for group ' + group, blocks);


            if (!blocks || !blocks.length) {
                debugWire && console.log('have no blocks for group : ' + group);
            }
            for (var j = 0; j < blocks.length; j++) {

                var block = blocks[j];
                debugWire && console.log('activate block : ' + block.name + ' for ' + event, block);
                this.wireNode(widget, event, block, params);
            }

        },
        wireScope: function (scope) {


            debugWire && console.log('wire scope');

            var allGroups = scope.allGroups(),
                thiz = this,
                delegate = thiz.delegate || {},
                widgets =[];

            var getParams = function (group) {
                var event = null,
                    widgetId = null,
                    parts = group.split('__'),
                    params = [];

                //no element:
                if (parts.length == 1) {
                    event = parts[0];
                    widgetId = 'body';
                    if(isIDE) {
                        var _body = editorContext.rootWidget;
                        _body.domNode.runExpression = editorContext.global.runExpression;
                    }else{

                    }

                }

                if (parts.length == 2) {
                    event = parts[1];
                    widgetId = parts[0];
                }

                if (parts.length == 5) {
                    event = parts[1];
                    widgetId = parts[0];
                    params = [
                        parts[2],
                        parts[3],
                        parts[4]
                    ]

                }

                if (event && widgetId) {

                    var widget = document.getElementById(widgetId);

                    if (!widget && widgetId === 'body') {
                        widget = document.body;
                    }
                    return {
                        event: event,
                        widgetId: widgetId,
                        widget: widget,
                        params: params
                    }
                }

                return null;
            };
            var wireBlock = function (block) {
                block._on(types.EVENTS.ON_ITEM_REMOVED, function (evt) {
                    try {
                        //console.log('on block removed', evt.item);
                        if (block._widgetHandles) {
                            var _handles = block._widgetHandles;
                            for (var i = 0; i < _handles.length; i++) {
                                if (_handles[i].remove) {
                                    _handles[i].remove();
                                }
                            }
                            delete block._widgetHandles;

                        }
                    } catch (e) {
                        console.error('troubble!' + e, e);
                    }
                }, this);
            };

            console.log('wire scope : ', allGroups);

            for (var i = 0; i < allGroups.length; i++) {

                var group = allGroups[i];

                var params = getParams(group);

                if (params && params.widget) {
                    this.wireWidget(scope, params.widget, params.widget.domNode || params.widget, params.event, group, params);
                }else{
                    console.error('invalid params');
                }

                var blocks = scope.getBlocks({
                    group: group
                });

                if (!blocks || !blocks.length) {
                    debugWire && console.warn('have no blocks for group : ' + group);
                }
                for (var j = 0; j < blocks.length; j++) {
                    var block = blocks[j];
                    wireBlock(block);
                }

                widgets.indexOf(params.widget) ==-1 && widgets.push(params.widget);
            }

            for (var i = 0; i < widgets.length; i++) {
                var widget = widgets[i];

                if(widget.__didEmitLoad){
                    return;
                }
                console.log('emit load',widget);
                widget.__didEmitLoad=true;
                if(widget.nodeName==='BODY'){
                    $(widget.nodeName).trigger('load');
                }else {
                    if (widget.emit) {
                        widget.emit('load', widget);
                    }
                }
            }




            scope._on(types.EVENTS.ON_ITEM_ADDED, function (evt) {

                var params = getParams(evt.item.group);
                if (params && params.widget) {
                    debugWire && console.log('on item added', arguments);

                    var item = evt.item;
                    var editorContext = delegate.getEditorContext ? delegate.getEditorContext() : null ;
                    var widget = params.widget.domNode || params.widget;

                    thiz.wireNode(widget, params.event, evt.item, editorContext, params);
                    wireBlock(evt.item);
                }
            });

        },
        onBlockFilesLoaded: function (scopes) {

            debugBoot && console.log('xapp:onSceneBlocksLoaded, wire scope!', scopes);
            for (var i = 0; i < scopes.length; i++) {
                var scope = scopes[i];
                try {
                    this.wireScope(scope);
                } catch (e) {
                    logError(e,'onBlockFilesLoaded')
                }
            }
        },
        loadXBloxFiles: function (files) {

            var thiz = this;

            function loadXBLOXFiles() {

                thiz.getBlockManager().loadFiles(files).then(function (scopes) {

                    debugBoot && console.log('   Checkpoint 8.1. xapp/manager/context->xblox files loaded');

                    thiz.onBlockFilesLoaded(scopes);
                })
            }

            files = [];
            if (files.length == 0) {

                var item = this.settings.item;
                if (item) {
                    var mount = utils.replaceAll('/', '', item.mount);
                    var extension = utils.getFileExtension(item.path);

                    var path = item.path.replace('.' + extension, '.xblox');
                    var sceneBloxItem = {
                        mount: mount,
                        path: path
                    };

                    files.push(sceneBloxItem);

                    var content = {
                        "blocks": [],
                        "variables": []
                    };
                    var fManager = this.getFileManager().mkfile(mount, path, JSON.stringify(content, null, 2)).then(function () {
                        loadXBLOXFiles();
                    });
                }
            }
            //loadXBLOXFiles();
        },
        /**
         * Called when all managers and minimum dependencies are loaded.
         *
         * At this point we're load our xblox files and fire them!
         *
         *
         */
        onReady: function () {

            debugBoot && console.log('Checkpoint 8. xapp/manager->onReady');

            var fMgr = this.getFileManager();
            var item = this.settings.item;
            var xbloxFiles = this.settings.xbloxScripts;
            this.loadXBloxFiles(xbloxFiles);
            var thiz = this;

            this.subscribe(types.EVENTS.ON_DEVICE_DRIVER_INSTANCE_READY, function () {
                console.log('instance ready!');
                setTimeout(function () {
                    thiz.publish(types.EVENTS.ON_APP_READY, {
                        context: thiz
                    });
                }, 1000);
            })
            debugBoot && console.info('-app ready',this);

        },
        init: function (settings) {

            this.settings = settings;


            debugBoot && console.log('Checkpoint 7. xapp/manager->init(settings)');

            var thiz = this;

            this.loadXIDE();

            /*
             var nodeServiceManagerProto = require('xnode/manager/NodeServiceManager'),
             thiz = this,
             nodeManager = this.ctx.createManager(nodeServiceManagerProto, null);
             this.ctx.nodeServiceManager = nodeManager;
             */

            require([
                'xfile/manager/FileManager',
                'xide/manager/ResourceManager',
                'xnode/manager/NodeServiceManager',
                'xcf/manager/DriverManager',
                'xcf/manager/DeviceManager',
                'xcf/manager/BlockManager',
                'xcf/model/ModelBase',
                'xcf/model/Command',
                'xcf/model/Variable',
                'xcf/factory/Blocks'
            ], function (FileManager, ResourceManager, NodeServiceManager, DriverManager, DeviceManager, BlockManager) {

                thiz.blockManager = thiz.createManager(BlockManager);
                thiz.blockManager.init();

                thiz.fileManager = thiz.createManager(FileManager, settings.xFileConfig, {
                    serviceUrl: settings.rpcUrl,
                    singleton: true
                });
                thiz.fileManager.init();


                thiz.resourceManager = thiz.createManager(ResourceManager, settings.xFileConfig, {
                    serviceUrl: settings.rpcUrl,
                    singleton: true
                });
                thiz.resourceManager.init();


                /**
                 * xcf
                 */
                thiz.driverManager = thiz.createManager(DriverManager, null, {
                        serviceUrl: settings.rpcUrl,
                        singleton: true
                    }
                );
                thiz.driverManager.init();


                try {
                    thiz.driverManager.ls('system_drivers').then(function () {


                        debugBoot && console.log('Checkpoint 7.1 drivers loaded');

                        thiz.deviceManager = thiz.createManager(DeviceManager, null, {
                                serviceUrl: settings.rpcUrl,
                                singleton: true
                            }
                        );
                        thiz.deviceManager.init();
                        thiz.deviceManager.ls('system_devices').then(function () {

                            thiz.nodeServiceManager = thiz.createManager(NodeServiceManager, null, {
                                serviceUrl: settings.rpcUrl,
                                singleton: true
                            });
                            thiz.nodeServiceManager._on(types.EVENTS.ON_NODE_SERVICE_STORE_READY,function(){
                                //debugger;
                            });
                            thiz.nodeServiceManager.init();
                            thiz.onReady();

                        });
                    });

                } catch (e) {
                    debugger;
                }


            });

        },
        mergeFunctions: function (target, source) {

            for (var i in source) {
                var o = source[i];
                if (_.isFunction(source[i]) /*&& lang.isFunction(target[i])*/) {
                    debugBoot && console.log('override ' + i);
                    target[i] = o;
                }

            }

        },
        onModuleUpdated: function (evt) {

            var _obj = dojo.getObject(evt.moduleClass);

            if (_obj && _obj.prototype) {
                this.mergeFunctions(_obj.prototype, evt.moduleProto);
            }

        },
        getApplication: function () {
            return this.application;
        },
        getBlockManager: function () {
            return this.blockManager;
        },
        getFileManager: function () {
            return this.fileManager;
        },
        getDriverManager: function () {
            return this.driverManager;
        },
        /**
         *
         * @returns {module:xcf.manager.DeviceManager}
         */
        getDeviceManager: function () {
            return this.deviceManager;
        },
        getNodeServiceManager: function () {
            return this.nodeServiceManager;
        },
        initManagers: function () {
            this.pluginManager.init();
            this.application.init();
        },
        constructManagers: function () {
            this.pluginManager = this.createManager(PluginManager);
            this.application = this.createManager(Application);
        }
    });
});
