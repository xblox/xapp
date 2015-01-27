define([
    "dojo/_base/declare",
    "dojo/_base/array",
    "dojo/_base/lang",
    "xblox/model/Block",
    'xide/types',
    'xide/mixins/EventedMixin',
    'xblox/model/Targeted',
    'dijit/registry',
    "dojo/dom-attr",
    "dojo/dom-style",
    "dojo/_base/Color"
], function(declare,ArrayUtil,lang,Block,types,EventedMixin,Targeted,registry,domAttr,domStyle,Color){
    // summary:
    //		The Call Block model.
    //      This block makes calls to another blocks in the same scope by action name

    // module:
    //		xblox.model.code.CallMethod
    return declare("xblox.model.html.SetStyle",[Block,EventedMixin,Targeted],{

        //method: (String)
        //  block name
        name:'Set Style',

        reference:'',

        references:null,

        description:'Sets HTML Node Style Attribute',

        value:'',

        mode:1,

        sharable:true,

        /////////////////////////////////////////////////////////////////////////////////////
        //
        //  UI
        //
        /////////////////////////////////////////////////////////////////////////////////////
        /**
         * Run this block
         * @param scope
         * @param settings
         */
        solve:function(scope,settings) {

            this.updateObjects(null,this.value,this.mode);
            this.onSuccess(this,settings);

        },
        /**
         * Get human readable string for the UI
         * @returns {string}
         */
        toText:function(){

            var _ref = this.deserialize(this.reference);
            var result = this.getBlockIcon() + ' ' + this.name + ' :: on ' + _ref.reference + ' to' || ' ' + ' to ';

            if(this.value){
                result+= ' ' + this.value;
            }
            return result;
        },

        /**
         * Standard call when editing this block
         * @returns {*}
         */
        getFields:function(){
            var fields = this.inherited(arguments) || this.getDefaultFields();
            var thiz=this;
            //var _ref = this.deserialize(this.reference);

            fields.push(this.utils.createCI('Value',types.ECIType.DOM_PROPERTIES,this.value,{
                group:'General',
                dst:'value',
                value:this.value,
                intermediateChanges:false
            }));

            fields.push(this.utils.createCI('Mode',types.ECIType.ENUMERATION,this.mode,{
                group:'General',
                options:[
                    this.utils.createOption('Set',1),
                    this.utils.createOption('Add',2),
                    this.utils.createOption('Remove',3),
                    this.utils.createOption('Increase',4),
                    this.utils.createOption('Decrease',5)
                ],
                dst:'mode'
            }));

            fields.push(this.utils.createCI('Target',types.ECIType.WIDGET_REFERENCE,this.reference,{
                group:'General',
                dst:'reference',
                value:this.reference
            }));

            return fields;
        },
        getBlockIcon:function(){
            return '<span class="fa-paint-brush"></span>';
        },
        /////////////////////////////////////////////////////////////////////////////////////
        //
        //  Lifecycle
        //
        /////////////////////////////////////////////////////////////////////////////////////
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
            this.reference = newValue;

            this.references = this.resolveReference(this.deserialize(newValue));

            this.updateObjects(this.references,this.value);

            /*console.log('referenced changed');*/
            //this.updateEventSelector(objects,cis);
            //this._registerEvent(this.event);

        },
        getPropValue:function(stylesObject,prop){
            for (var _prop in stylesObject) {
                if(_prop === prop){
                    return stylesObject[_prop];
                }
            }
            return null;
        },
        _getStyle:function(name,obj,jObj){

            switch (name){
                case "height":{
                    return jObj.outerHeight();
                }
                case "width":{
                    return jObj.outerWidth();
                }
                case "color":{
                    return jObj.css("color");
                }
                case "border-color":{
                    return jObj.css("border-color") || "rgba(0,0,0,0)";
                }
            }

            return null;
        },
        updateObject:function(obj,style,mode){


            if(!obj){
                return false;
            }
            mode = mode || 1;
            if(obj.domNode!=null){
                obj = obj.domNode;
            }



            var currentStyle = domAttr.get(obj,'style');
            var styleAttribute = '' + currentStyle;
            //console.log('style in : ' + currentStyle);
            if(currentStyle===";"){
                currentStyle="";
            }
            if(currentStyle===""){
                if(obj['lastStyle']!=null){
                    currentStyle = obj['lastStyle'];
                }else {
                    currentStyle = style;
                }
            }

            if(currentStyle===";"){
                currentStyle=style;
            }



            //console.log('change current style ' + currentStyle);
            switch (mode){
                //set
                case 1:{
                    domAttr.set(obj,'style',style);
                    break;
                }
                //add
                case 2:{
                    domAttr.set(obj,'style',currentStyle + ';' + style);
                    break;
                }
                //remove
                case 3:{
                    domAttr.set(obj,'style',this.utils.replaceAll(style,'',currentStyle));
                    break;
                }
                //increase
                case 4:
                //decrease
                case 5:{

                    var	numbersOnlyRegExp = new RegExp(/(\D*)(-?)(\d+)(\D*)/);

                    /**
                     * compute current style values of the object
                     * @type {{}}
                     */
                    var stylesRequested = this._toObject(style);
                    var stylesComputed = {};
                    var jInstance = $(obj);
                    ///determine from node it self
                    if(stylesRequested) {
                        for (var prop in stylesRequested) {
                            var currentStyle = this._getStyle(prop,obj,jInstance);
                            stylesComputed[prop] = currentStyle;
                            //console.log('style value for ' + prop + ' is now  at ' + currentStyle + ' ' + obj.id);
                        }
                    }

                    var _newStyleObject = {};
                    /**
                     * compute the new style
                     * @type {number}
                     */
                    for (var prop in stylesRequested){

                        var _prop = '' + prop.trim();
                        var multiplicator = 1;
                        if(stylesComputed[_prop]!=null){

                            var _valueRequested = stylesRequested[prop];
                            var _valueComputed = stylesComputed[prop];

                            var _isHex = _valueRequested.indexOf('#')!=-1;
                            var _isRGB = _valueRequested.indexOf('rgb')!=-1;
                            var _isRGBA = _valueRequested.indexOf('rgba')!=-1;

                            if( _isHex || _isRGB || _isRGBA){

                                var dColorMultiplicator = dojo.colorFromString(_valueRequested);
                                //var dColorNow = dojo.colorFromString('rgba(0.1,0.1,0.1,0.1)');
                                var dColorNow = dojo.colorFromString(_valueRequested);
                                var dColorComputed = dojo.colorFromString(_valueComputed);
                                var dColorNew = new Color();
                                ArrayUtil.forEach(["r", "g", "b", "a"], function(x){
                                    dColorNew[x] = Math.min(dColorComputed[x] + dColorMultiplicator[x], x=="a" ? 1 : 255);
                                });
                                console.log('color computed ' + dColorComputed.toRgba() + ' color requested: ' + dColorNow.toRgba() +   ' | multiplicator color = ' + dColorMultiplicator.toRgba() +  ' is then = ' + dColorNew.toRgba());

                                var _valueOut = '';
                                if(_isHex){
                                    _valueOut = dColorNew.toHex();
                                }else if(_isRGB){
                                    _valueOut = dColorNew.toCss(false);
                                }else if(_isRGBA){
                                    _valueOut = dColorNew.toCss(true);
                                }
                                //var _newValue = this._changeValue(styles[prop],delta * multiplicator);
                                _newStyleObject[prop]=_valueOut;
                                domStyle.set(obj,prop, _valueOut);//update
                                //var dColorNow = dojo.colorFromString(st);
                                //var dColorMultiplicatorRGBA = dColorMultiplicator.toRgba();
                                //console.log('color ' + dColorMultiplicatorRGBA  , dColorMultiplicator);


                            }else{
                                //extract actual number :
                                var numberOnly = numbersOnlyRegExp.exec(stylesComputed[_prop]);
                                if(numberOnly && numberOnly.length>=3){
                                    var _int = parseInt(numberOnly[3]);
                                    if(_int && _int>0){
                                        multiplicator  = _int;
                                    }
                                }
                            }
                        }
                    }
                    var delta = mode == 4 ? 1 : -1;
                    //now get an object array of the styles we'd like to alter
                    var styles = this._toObject(currentStyle);
                    var inStyles = this._toObject(style);
                    if(!styles){
                        return false;
                    }
                    var _skipped = [];
                    for(var prop in styles){
                        var _prop = '' + prop.trim();
                    }

                    var newStyleString = this._toStyleString(_newStyleObject);
                    break;
                }
            }
        },
        onDomStyleChanged:function(objects,newStyle,mode){

            if(mode==4 || mode==5){
                //return;
            }

            //var mode = 1;

            objects     = objects || this.resolveReference(this.deserialize(this.reference));
            if(!objects){
                console.log('have no objects');
                return;

            }

            //newStyle    = newStyle!=null? newStyle : this.value || "";

            console.log('change dom style to ' + newStyle + ' on ' + objects.length + ' objects');


            for (var i = 0; i < objects.length; i++) {
                var obj = objects[i];
                if(obj && obj.id && obj.id.indexOf('davinci')!=-1) {
                    continue;
                }
                this.updateObject(obj, newStyle, mode);
                if(i>1){
                    //break;
                }
            }


        },
        updateObjects:function(objects,domStyleString,mode){
            objects = objects || this.resolveReference(this.deserialize(this.reference));
            this.onDomStyleChanged(objects,domStyleString,mode);
        },
        onChangeField:function(field,newValue,cis){
            this._destroy();//you never know

            if(field=='mode' && newValue!==this.mode){

                this.mode = newValue;
            }

            if(field=='value' && newValue!==this.value){
                this.onDomStyleChanged(null,newValue,this.mode);
                this.value = newValue;
            }
            if(field=='reference'){
                this.onReferenceChanged(newValue,cis);
            }

            this.inherited(arguments);
        },
        activate:function(){
            this._destroy();//you never know
        },
        deactivate:function(){
            this._destroy();
        },
        _destroy:function(){

        },
        /////////////////////////////////////////////////////////////////////////////////////
        //
        //  Utils
        //
        /////////////////////////////////////////////////////////////////////////////////////
        _changeValue: function(value, delta){

            if(!value){
                return "";
            }
            var split = value.split(" ");
            var result="";
            for(var i=0;i<split.length;i++){
                if(i>0)
                    result+=" ";
                var bits = split[i].match(/([-\d\.]+)([a-zA-Z%]*)/);
                if(!bits){
                    result+=split[i];
                }else{
                    if(bits.length == 1){
                        result+=bits[0];
                    }else{
                        for(var z=1;z<bits.length;z++){
                            if(!isNaN(bits[z]) && bits[z]!=""){
                                result+= parseFloat(bits[z]) + delta;
                            }else{
                                result +=bits[z];
                            }
                        }
                    }
                }
            }
            return result;
        },
        /**
         * Convert Style String to an object array, eg: { color:value,.... }
         * @param styleString
         * @returns {{}}
         * @private
         */
        _toObject:function(styleString){

            if(!styleString){
                return {};
            }
            var _result = {};
            var _values = styleString.split(';');
            for (var i = 0; i < _values.length; i++) {
                var obj = _values[i];
                if(!obj || obj.length==0 || !obj.split){
                    continue;
                }
                var keyVal = obj.split(':');
                if(!keyVal || !keyVal.length){
                    continue;
                }
                _result[keyVal[0]]=keyVal[1];
            }
            return _result;
        },
        _toStyleString:function(values){
            var _values = [];
            for(var prop in values){
                _values.push( prop + ':' + values[prop]);
            }
            return _values.join(';') + ';';
        }


    });
});