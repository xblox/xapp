/**
 * @module xblox/data/Store
 **/
define([
    "dojo/_base/declare",
    'dstore/Memory',//basics
    'dstore/Tree',//tree-grid support
    'dstore/QueryResults'//no need
], function (declare, Memory, Tree, QueryResults) {

    /**
     *
     */
    return declare("xblox/data/Store", [Memory, Tree], {

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
            console.log('filter: ',data);
            this._state.filter= data;
            return _res;
        },
        fetchRange: function (kwArgs) {

            var _res = this.fetchRangeSync(kwArgs);
            if(this._state.filter){

                console.log('fetch range ', this._state.filter);

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

        },
        /**
         * Add old store::query back to dstore
         * @param query
         * @param options
         * @returns {*|QueryResults}
         */
        query: function (query, options) {
            // summary:
            //		Queries the store for objects. This does not alter the store, but returns a
            //		set of data from the store.
            // query: String|Object|Function
            //		The query to use for retrieving objects from the store.
            // options: dstore/api/Store.QueryOptions
            //		The optional arguments to apply to the resultset.
            // returns: dstore/api/Store.QueryResults
            //		The results of the query, extended with iterative methods.
            //
            // example:
            //		Given the following store:
            //
            //	...find all items where "prime" is true:
            //
            //	|	store.query({ prime: true }).forEach(function(object){
            //	|		// handle each object
            //	|	});
            options = options || {};

            var results = this.filter(query);
            var queryResults;

            // Apply sorting
            var sort = options.sort;
            if (sort) {
                if (Object.prototype.toString.call(sort) === '[object Array]') {
                    var sortOptions;
                    while ((sortOptions = sort.pop())) {
                        results = results.sort(sortOptions.attribute, sortOptions.descending);
                    }
                } else {
                    results = results.sort(sort);
                }
            }

            var tracked;
            if (results.track && !results.tracking) {
                // if it is trackable, always track, so that observe can
                // work properly.
                results = results.track();
                tracked = true;
            }
            if ('start' in options) {
                // Apply a range
                var start = options.start || 0;
                // object stores support sync results, so try that if available
                queryResults = results[results.fetchRangeSync ? 'fetchRangeSync' : 'fetchRange']({
                    start: start,
                    end: options.count ? (start + options.count) : Infinity
                });
                queryResults.total = queryResults.totalLength;
            }
            queryResults = queryResults || new QueryResults(results[results.fetchSync ? 'fetchSync' : 'fetch']());
            queryResults.observe = function (callback, includeObjectUpdates) {
                // translate observe to event listeners
                function convertUndefined(value) {
                    if (value === undefined && tracked) {
                        return -1;
                    }
                    return value;
                }

                var addHandle = results.on('add', function (event) {
                    callback(event.target, -1, convertUndefined(event.index));
                });
                var updateHandle = results.on('update', function (event) {
                    if (includeObjectUpdates || event.previousIndex !== event.index || !isFinite(event.index)) {
                        callback(event.target, convertUndefined(event.previousIndex), convertUndefined(event.index));
                    }
                });
                var removeHandle = results.on('delete', function (event) {
                    callback(event.target, convertUndefined(event.previousIndex), -1);
                });
                var handle = {
                    remove: function () {
                        addHandle.remove();
                        updateHandle.remove();
                        removeHandle.remove();
                    }
                };
                handle.cancel = handle.remove;
                return handle;
            };
            return queryResults;
        }
    });
});