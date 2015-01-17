define([
    "dojo/_base/declare",
    'xide/views/CIActionDialog',
    'xide/factory',
    'xide/types',
    'xide/utils',
    'xblox/views/BlockEditView'
    ],
    function(declare,CIActionDialog,factory,types,utils,BlockEditView)
    {
        return declare("xblock.views.BlockEditDialog", [CIActionDialog],
            {
                onSave:function(ci,value){
                    if(ci.dst && this.item[ci.dst]){
                        this.item[ci.dst]=value;
                    }
                },
                initWithCIS:function(cis){
                    this.cisView = utils.addWidget(BlockEditView,{
                        delegate:this,
                        options:{
                            groupOrder:{
                                'General':0,
                                'Advanced':1,
                                'Description':2
                            }
                        },
                        cis:cis
                    },this,this.containerNode,true);
                },
                onOk:function()
                {
                    var cis = this.cisView.getCIS();
                    var options = utils.toOptions(cis);

                    //now convert back to block fields
                    for(var i = 0 ; i < options.length ; i++){
                        var option = options[i];
                        var field = option.dst;
                        if(field!=null && this.item[field]!=null){

                            if(option.active!=null && option.active===false && option.changed===false){
                                continue;
                            }

                            if( this.item[option.dst]!=option.value ||
                                this.item[option.dst]!==option.value)
                            {
                                if(this.item.onChangeField){
                                    this.item.onChangeField(option.dst,option.value);
                                }
                                this.item[option.dst]=option.value;
                            }
                        }
                    }
                    if(this.delegate && this.delegate.onOk)
                    {
                        this.delegate.onOk(this,this.item);
                    }
                    try{
                        this.hide();
                    }catch(e){

                    }

                    return true;

                },
                initWithBlock:function(item){
                    var cis = item.getFields();
                    if(cis){
                        this.initWithCIS(cis);
                    }

                },
                startup: function()
                {
                    this.inherited(arguments);
                    if(this.item){
                        this.initWithBlock(this.item);
                    }
                    this.addActionButtons();
                    this.inherited(arguments);
                }
            });
    })
;