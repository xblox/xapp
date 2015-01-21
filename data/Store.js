/**
 * @module xblox/data/Store
 **/
define([
    "dojo/_base/declare",
    'dstore/Memory',//basics
    'dstore/Tree',//tree-grid support
    'dstore/QueryResults',//no need
    'xide/data/_Base'
], function (declare, Memory, Tree, QueryResults,_Base) {
    /**
     *
     */
    return declare("xblox/data/Store", [Memory, Tree,_Base], {

        reset:function(){
            this._state.filter = null;
            this.resetQueryLog();
        },
        /**
         * dstore fuck, it doesn't clone properties right for cloned 'collections', those props need to be put into
         * an object in order to be present in that 'new' collection.
         */
        _state:{
            /**
             * the last filter
             */
            filter:null
        },
        /*
         * Rollback query log,
         */
        resetQueryLog:function(){
            this.queryLog = [];
        },
        fetch:function(){
            return this.fetchSync();
        },
        filter: function (data) {

            var _res = this.inherited(arguments);
            this._state.filter= data;
            return _res;
        },
        fetchRange: function (kwArgs) {

            var _res = this.fetchRangeSync(kwArgs);
            if(this._state.filter){

                //the parent query
                if(this._state.filter['parent']) {
                    var _item = this.getSync(this._state.filter.parent);
                    if (_item) {
                        this.reset();
                        return _item.items;
                    }
                }
                //the group query
                if(this._state.filter['group']) {
                    var _items = this.getSync(this._state.filter.parent);
                    if (_item) {
                        this.reset();
                        return _item.items;
                    }
                }
            }


            return _res;
        },
        /**
         * Bloody dstore expects a new collection here whilst actually the name suggests that a number of items
         * will be return for that 'parent'. Instead its creating a new filter
         * @param parent
         * @param options
         * @returns {*}
         */
        getChildren: function(parent, options){
            var _res = this.inherited(arguments);
            return _res;
        },
        mayHaveChildren: function(parent){

            if(parent.mayHaveChildren){
                return parent.mayHaveChildren(parent);
            }
            return parent.items!=null && parent.items.length>0;
        }
    });
});