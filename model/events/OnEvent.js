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
    'dijit/registry',
    'dojo/on'
], function(declare,lang,array,Deferred,Block,utils,types,EventedMixin,Referenced,registry,on){

    // summary:
    //		The Call Block model.
    //      This block makes calls to another blocks in the same scope by action name

    // module:
    //		xblox.model.code.CallMethod
    return declare("xblox.model.events.OnEvent",[Block,EventedMixin,Referenced],{
        //method: (String)
        //  block action name
        name:'On Event',


        event:'',

        reference:'',

        references:null,

        sharable:true,

        _nativeEvents:[
            "onclick",
            "ondblclick",
            "onmousedown",
            "onmouseup",
            "onmouseover",
            "onmousemove",
            "onmouseout",
            "onkeypress",
            "onkeydown",
            "onkeyup",
            "onfocus",
            "onblur",
            "onchange"
        ],

        /***
         * Returns the block run result
         * @param scope
         * @param settings
         * @param run
         * @param error
         * @returns {Array}
         */
        solve:function(scope,settings,run,error) {

            if(!this._lastRunSettings && settings){
                this._lastRunSettings= settings;
            }

            settings = this._lastRunSettings || settings;


            this._currentIndex=0;
            this._return=[];

            var ret=[], items = this[this._getContainer()];
            if(items.length) {
                var res = this.runFrom(items,0,settings);
                this.onSuccess(this, settings);
                return res;
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
            var thiz=this;

            var _ref = this.deserialize(this.reference);
            var isNative = utils.contains(this._nativeEvents,this.event)>-1;
            var options = null;
            if(!isNative){
                options = this.scope.getEventsAsOptions(this.event);
            }else{

                options = [
                    {label:"onclick", value:"onclick"},
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
                    {label:"onchange",  value:"onchange"}
                ];

                //select the event we are listening to
                for (var i = 0; i < options.length; i++) {
                    var obj = options[i];
                    if(obj.value===this.event){
                        obj.selected=true;
                        break;
                    }
                }
            }


            fields.push(this.utils.createCI('Event',types.ECIType.ENUMERATION,this.event,{
                group:'General',
                options:options,
                dst:'event'
            }));

            fields.push(this.utils.createCI('Object/Widget',types.ECIType.WIDGET_REFERENCE,this.reference,{
                group:'General',
                dst:'reference',
                value:this.reference
            }));
            return fields;
        },
        getBlockIcon:function(){
            return '<span class="fa-bell"></span>';
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
        },
        onEvent:function(evt){
            this._lastResult=evt;
            this.solve(this.scope,this._lastRunSettings);

        },
        _subscribe:function(evt,handler,obj){

            if(!evt){
                return;
            }
            var isNative = utils.contains(this._nativeEvents,evt);
            if(isNative==-1){
                this.subscribe(evt, this.onEvent,obj);
            }else{

                if(obj) {
                    var _event = evt.replace('on', ''),
                        thiz = this;

                    var handle = on(obj, _event, function (e) {
                        thiz.onEvent(e)
                    });
                    console.log('wire native event : ' + _event);
                    this._events.push(handle);
                }

            }

        },
        _registerEvent:function(evt){

            if(!evt || !evt.length){
                return;
            }


            console.log('register event : ' + evt + ' for ' + this.reference);


            var objects = this.resolveReference(this.deserialize(this.reference));
            var thiz=this;
            if (objects && objects.length) {
                for (var i = 0; i < objects.length; i++) {
                    var obj = objects[i];

                    //try widget
                    if (obj && obj.id) {
                        var _widget = registry.byId(obj.id);
                        if (_widget && _widget.on) {
                            var _event = this.event.replace('on','');
                            console.log('found widget : ' + obj.id  + ' will register event ' + _event);
                            var _handle = _widget.on(_event,lang.hitch(this,function(e){
                                console.log('event triggered : ' + thiz.event);
                                thiz.onEvent(e);
                            }));
                            this._events.push( _handle);
                        }else{

                            this._subscribe(evt, this.onEvent,obj);
                        }
                    }else{

                        this._subscribe(evt, this.onEvent,obj);
                    }
                }
                console.log('objects found : ', objects);
            }else{
                this._subscribe(evt, this.onEvent);
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
            this.updateEventSelector(objects,cis);
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
            if(!this._events){this._events=[];}
            array.forEach(this._events, dojo.unsubscribe);
            this._lastResult=null;
            this._events=[];
        }
    });
});