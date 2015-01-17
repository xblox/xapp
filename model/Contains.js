define([
    "dojo/_base/declare"
], function(declare){

    /**
     * Contains provides implements functions to deal with sub blocks.
     *
     */
    return declare('xblox.model.Contains',null,{
        /**
         * Store is asking this!
         * @param parent
         * @returns {boolean}
         */
        mayHaveChildren:function(parent){
            var items = this[this._getContainer()];
            return items!=null && items.length>0;
        },
        /**
         * Store function
         * @param parent
         * @returns {Array}
         */
        getChildren:function(parent){
            return this[this._getContainer()];
        },
        //  standard call from interface
        canAdd:function(){
            return [];
        },
        /***
         * Generic: run sub blocks
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
        }
    });
});