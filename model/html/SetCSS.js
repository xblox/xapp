define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "xblox/model/Block",
    'xide/types',
    'xide/mixins/EventedMixin',
    'xblox/model/Targeted',
    'dijit/registry'
], function(declare,lang,Block,types,EventedMixin,Targeted,registry){

    // summary:
    //		The Call Block model.
    //      This block makes calls to another blocks in the same scope by action name

    // module:
    //		xblox.model.code.CallMethod
    return declare("xblox.model.html.SetCSS",[Block,EventedMixin,Targeted],{

        //method: (String)
        //  block name
        name:'Set CSS',

        file:'',

        reference:'',

        references:null,

        description:'Sets HTML Node CSS',
        /////////////////////////////////////////////////////////////////////////////////////
        //
        //  UI
        //
        /////////////////////////////////////////////////////////////////////////////////////
        solve:function(scope,settings) {
            this.onSuccess(this,settings);
        },
        toText:function(){

            var result = this.getBlockIcon() + ' ' + this.name + ' :: ';
            if(this.event){
                result+= this.event;
            }
            return result;
        },

        //  standard call for editing
        getFields:function(){
            try {
                var fields = this.inherited(arguments) || this.getDefaultFields();
                //var _ref = this.deserialize(this.reference);


                fields.push(this.utils.createCI('File', types.ECIType.FILE, this.file, {
                    group: 'General',
                    dst: 'file',
                    value: this.file,
                    intermediateChanges: false,
                    acceptFolders: false,
                    acceptFiles: true,
                    encodeFilePath: false,
                    buildFullPath: true,
                    filePickerOptions: {
                        dialogTitle: 'Select CSS File',
                        filePickerMixin: {
                            beanContextName: 'CSSFilePicker',
                            persistent: false,
                            globalPanelMixin: {
                                allowLayoutCookies: false
                            }
                        },
                        configMixin: {
                            beanContextName: 'CSSFilePicker',
                            LAYOUT_PRESET: types.LAYOUT_PRESET.SINGLE,
                            PANEL_OPTIONS:{
                                ALLOW_MAIN_MENU:false
                            }
                        },
                        defaultStoreOptions: {
                            "fields": 1663,
                            "includeList": "css",
                            "excludeList": "*"
                        },
                        startPath: this.file
                    }
                }));

                /*
                 fields.push(this.utils.createCI('Value',types.ECIType.DOM_PROPERTIES,this.value,{
                 group:'General',
                 dst:'value',
                 value:this.value,
                 intermediateChanges:false
                 }));
                 */

                fields.push(this.utils.createCI('Target', types.ECIType.WIDGET_REFERENCE, this.reference, {
                    group: 'General',
                    dst: 'reference',
                    value: this.reference
                }));

            }catch(e){

            }
            return fields;
        },
        getBlockIcon:function(){
            return '<span class="fa-paint-brush"></span>';
        },
        /////////////////////////////////////////////////////////////////////////////////////
        //
        //  Store
        //
        /////////////////////////////////////////////////////////////////////////////////////

        /////////////////////////////////////////////////////////////////////////////////////
        //
        //  Lifecycle
        //
        /////////////////////////////////////////////////////////////////////////////////////
        onReferenceChanged:function(newValue,cis){
            this._destroy();//unregister previous event(s)
            this.reference = newValue;
            var objects = this.resolveReference(this.deserialize(newValue));
            //this._registerEvent(this.event);

        },
        onChangeField:function(field,newValue,cis){
            if(field=='file'){
            }

            if(field=='reference'){
                this.onReferenceChanged(newValue,cis);
            }

            this.inherited(arguments);
        },
        activate:function(){
            this._destroy();//you never know
            //this._registerEvent(this.event);
        },
        deactivate:function(){
            this._destroy();
        },
        _destroy:function(){

        }



    });
});