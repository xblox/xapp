define([
    'dojo/_base/declare',
    'xide/types',
    'xide/manager/ClipboardManager'
],function(declare,types,ClipboardManager)
{
    return declare([ClipboardManager],
    {
        currentCopySelection:null,
        currentCutSelection:null,
        onPaste:function(data){
            if(data.didPaste){
                return ;
            }
            data.didPaste=true;
            var selection =  this.currentCopySelection||this.currentCutSelection;
            var isCopy= this.currentCopySelection !=null;
            if(selection && data.type ===types.ITEM_TYPE.BLOCK && data.callee && data.callee.paste){
                data.callee.paste(selection,data.callee,isCopy);
            }
        },
        onCopy:function(data){

            var selection = data.items;
            if(selection && data.type ===types.ITEM_TYPE.BLOCK){
                this.currentCopySelection=selection;
            }
            this.currentCutSelection=null;

        },
        onCut:function(data){
            var selection = data ? data ? data.items ? data.items : null : null : null;
            if(selection && data.type === types.ITEM_TYPE.BLOCK){
                this.currentCutSelection=selection;
            }
            this.currentCopySelection=null;
        }
    });
});