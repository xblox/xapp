define([
    'dojo/_base/declare',
    'xide/types',
    "xide/views/GridView"
],
    function (declare, types,GridView)
    {
        return declare("xblox.views.BlocksGridView", [GridView],
        {

            onShow:function(){
                this.inherited(arguments);
                this.publish(types.EVENTS.RESIZE);
            },
            /////////////////////////////////////////////////////////////////////////
            //
            //  Grid calls
            //
            /////////////////////////////////////////////////////////////////////////
            /**
             * Delete, comes from keyboard
             */
            deleteItem:function(){
                if(this.delegate && this.delegate.removeItem){
                    this.delegate.removeItem();
                }
            },
            /**
             * Grid creation done
             * @param grid
             */
            onGridCreated:function(grid){
                this.inherited(arguments);
            },
            /////////////////////////////////////////////////////////////////////////
            //
            //  Cut, Copy, Paste
            //
            /////////////////////////////////////////////////////////////////////////
            /**
             * Standard calls
             */
            onClipBoardCopy:function(){
                var selection = this.getCurrentSelection();
                if(selection){
                    var struct = {
                        items:selection,
                        type:types.ITEM_TYPE.BLOCK,
                        owner:this
                    };
                    this.publish(types.EVENTS.ON_CLIPBOARD_COPY,struct,this.delegate);
                }
            },
            onClipBoardPaste:function(){
                this.publish(types.EVENTS.ON_CLIPBOARD_PASTE,{
                    owner:this,
                    type:types.ITEM_TYPE.BLOCK
                },this.delegate);
            },
            onClipBoardCut:function(){
                var selection = this.getCurrentSelection();
                if(selection){
                    var struct = {
                        items:selection,
                        owner:this,
                        type:types.ITEM_TYPE.BLOCK
                    };
                    this.publish(types.EVENTS.ON_CLIPBOARD_CUT,struct,this.delegate);
                }
            }
        });
    })
;