define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/array",
    "dojo/Deferred",
    "xblox/model/Block",
    'xide/utils',
    'xide/types',
    'xide/mixins/EventedMixin',
    'xblox/model/Referenced',
    'xblox/model/Contains',
    'xblox/model/events/OnEvent',
    'dijit/registry',
    'dojo/on'
], function(declare,lang,array,Deferred,Block,utils,types,EventedMixin,Referenced,Contains,OnEvent,registry,on){

    // summary:
    //		The Call Block model.
    //      This block makes calls to another blocks in the same scope by action name

    // module:
    //		xblox.model.code.CallMethod
    return declare("xblox.model.events.OnKey",[Block,EventedMixin,Referenced,Contains],{
        //method: (String)
        //  block action name
        name:'On Key',

        event:'',

        reference:'',

        references:null,

        description:'Triggers when a keyboard sequence ' + this.event +' has been entered',

        listeners:null,

        sharable:true,
        /////////////////////////////////////////////////////////////////////////////////////
        //
        //  UI
        //
        /////////////////////////////////////////////////////////////////////////////////////
        toText:function(){

            var result = this.getBlockIcon() + ' ' + this.name + ' :: ';
            if(this.event){
                result+= this.event;
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

            fields.push(this.utils.createCI('Keyboard Sequence',types.ECIType.STRING,this.event,{
                group:'General',
                dst:'event',
                value:this.event,
                intermediateChanges:false
            }));

            fields.push(this.utils.createCI('Object/Widget',types.ECIType.WIDGET_REFERENCE,this.reference,{
                group:'General',
                dst:'reference',
                value:this.reference
            }));
            return fields;
        },
        getBlockIcon:function(){
            return '<span class="fa-keyboard-o"></span>';
        },
        /////////////////////////////////////////////////////////////////////////////////////
        //
        //  Store
        //
        /////////////////////////////////////////////////////////////////////////////////////
        onEvent:function(evt){
            this._lastResult=evt;
            this.solve(this.scope,this._lastRunSettings);

        },
        _addListerner:function(keys,handler,obj){
            if(this.listeners==null){
                this.listeners=[];
            }

            var my_defaults = {
                is_unordered    : true,
                prevent_repeat  : false,
                prevent_default : false,
                on_keyup:function(e){
                    console.log('up');
                },
                on_keydown:function(e){
                    console.log('down');
                },
                on_release:function(e){
                    console.log('release');
                }
            };
            var listener =null;
            listener = new window.keypress.Listener(obj, my_defaults);
            listener.simple_combo(keys, function(e) {
                if(handler){
                    handler(arguments);
                }
            });

            this.listeners.push(listener);
        },
        _subscribe:function(keys,handler,obj){

            if(!keys){
                return;
            }

            if(obj && obj.domNode){
                obj = obj.domNode;
            }

            this._addListerner(keys,handler,obj);

        },
        _registerEvent:function(evt){

            if(!evt || !evt.length){
                return;
            }
            var objects = this.resolveReference(this.deserialize(this.reference));
            var thiz=this;
            if (objects && objects.length) {
                for (var i = 0; i < objects.length; i++) {
                    var obj = objects[i];
                    //try widget
                    if (obj && obj.id) {
                        var _widget = registry.byId(obj.id);
                        _widget=null;
                        if (_widget && _widget.on) {
                            var _event = this.event.replace('on','');
                            var _handle = _widget.on(_event,lang.hitch(this,function(e){
                                thiz.onEvent(e);
                            }));
                            this._events.push( _handle);
                        }else{

                            this._subscribe(evt, function(){thiz.onEvent(arguments)},obj);
                        }
                    }else{

                        this._subscribe(evt, function(){thiz.onEvent(arguments)},obj);
                    }
                }
            }else{
                this._subscribe(evt, function(){thiz.onEvent(arguments)});
            }
        },
        onLoad:function(){

            this._onLoaded=true;

            if(this.event && this.event.length && this.enabled){

                this._registerEvent(this.event);
            }
        },
        destroy:function(){
            this.inherited(arguments);
        },
        updateEventSelector:function(objects,cis){

            var options = [];

            if(!objects || !objects.length){
                options= this.scope.getEventsAsOptions(this.event);
            }else{

                options = [{label:"onclick", value:"onclick"},
                    {label:"ondblclick",value:"ondblclick"},
                    {label:"onmousedown",value:"onmousedown"},
                    {label:"onmouseup",value:"onmouseup"},
                    {label:"onmouseover",value:"onmouseover"},
                    {label:"onmousemove",value:"onmousemove"},
                    {label:"onmouseout",value:"onmouseout"},
                    {label:"onkeypress",value:"onkeypress"},
                    {label:"onkeydown",value:"onkeydown"},
                    {label:"onkeyup",  value:"onkeyup"},
                    {label:"onfocus",  value:"onfocus"},
                    {label:"onblur",  value:"onblur"},
                    {label:"onchange",  value:"onchange"}];

                //select the event we are listening to
                for (var i = 0; i < options.length; i++) {
                    var obj = options[i];
                    if(obj.value===this.event){
                        obj.selected=true;
                        break;
                    }
                }
            }

            for (var i = 0; i < cis.length; i++) {
                var ci = cis[i];
                if(ci['widget'] && ci['widget'].title==='Event'){
                    //console.log('event!');
                    var widget = ci['_widget'];
                    widget.nativeWidget.set('options',options);
                    widget.nativeWidget.reset();
                    widget.nativeWidget.set('value',this.event);
                    this.publish(types.EVENTS.RESIZE,{});
                    break;
                }
            }
        },
        onReferenceChanged:function(newValue,cis){

            this._destroy();//unregister previous event(s)

            this.reference = newValue;
            var objects = this.resolveReference(this.deserialize(newValue));
            this._registerEvent(this.event);

        },
        onChangeField:function(field,newValue,cis){

            if(field=='event'){
                this._destroy();    //unregister previous event
                if(this._onLoaded){ // we've have been activated at load time, so re-register our event
                    this.event = newValue;
                    this._registerEvent(newValue);
                }
            }
            if(field=='reference'){
                this.onReferenceChanged(newValue,cis);
            }

            this.inherited(arguments);
        },
        activate:function(){
            this._destroy();//you never know
            this._registerEvent(this.event);
        },
        deactivate:function(){
            this._destroy();
        },
        _destroy:function(){

            if(this.listeners){

                for (var i = 0; i < this.listeners.length; i++) {
                    var obj = this.listeners[i];
                    obj.stop_listening();
                    var combos = obj.get_registered_combos();
                    if(combos){
                        obj.unregister_many(combos);
                    }
                    obj.reset();

                    console.log('did destroy listener');

                }
            }
            this.listeners=[];
        },
        onFieldsRendered:function(block,cis){}


    });
});