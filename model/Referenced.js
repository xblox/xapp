define([
    "dojo/_base/declare",
    "xide/mixins/ReferenceMixin"
], function(declare,ReferenceMixin){

    /**
     * Holds information to locate an object by string or direct reference.
     * This must be used as mixin rather as base class!
     */
    return declare('xblox.model.Referenced',[ReferenceMixin],{

        /**
         * JSON String in that format : reference(string) | mode (string)
         */
        reference:null,
        /**
         * 'reference' is a JSON structure
         * @param value
         * @returns {*}
         */
        deserialize:function(value){
            if(!value ||value.length==0){
                return {}
            }
            try {
                return dojo.fromJson(value);
            }catch(e){
                return {};
            }
        },
        referencesToNodes:function(reference){
            var objects = this.resolveReference(this.deserialize(reference || this.reference));
            /*
            if (objects && objects.length) {

                for (var i = 0; i < objects.length; i++) {
                    var obj = objects[i];

                    //try widget
                    if (obj && obj.id) {
                        var _widget = dijit.registry.byId(obj.id);
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
            */
        }
    });
});