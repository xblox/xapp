/** module xblox/manager/BlockManagerUI **/
define([
    "dojo/_base/declare",
    "dojo/has",
    'xide/types',
    'xide/utils',
    'xide/factory',
    "dojo/has!host-browser?xblox/views/BlockEditDialog",
    "dojo/has!host-browser?xblox/views/BlockTreeView",
    "dojo/dom-class",
    "xide/manager/BeanManager",
    "xide/views/CIViewMixin",
    'xide/bean/Action'
],
    function (declare,has,types,utils,factory,
              BlockEditDialog,BlockTreeView,
              domClass,BeanManager,
              CIViewMixin,Action)
    {
        /**
         * @mixin module:xblox/manager/BlockManagerUI
         * @augments module:xide/manager/BeanManager
         */
        return declare("xblox/manager/BlockManagerUI",[BeanManager],
        {

            blockTreeView:null,
            targetTop:null,
            targetBottom:null,
            currentCIView:null,
            lastSelectedTopTabTitle:null,
            updatePalette:true,
            _contextChanged:false,
            onReloaded:function(){

                console.log('bm reload');

            },

            /**
             * Callback when xideve renders actions for widget/node properties.
             * Expand those actions for xblox.
             *
             * @param evt
             */
            onSetWidgetPropertyActions:function(evt){

                //console.log('onSetWidgetPropertyActions',evt);

                /*
                var _handler = function(){
                    console.log('say hello',arguments);
                }
                var _action = Action.createDefault('XBlox','fa-play-circle-o','Widget/Bind to XBlox','widgetPropertyAction',_handler);
                _action.setVisibility(types.ACTION_VISIBILITY.WIDGET_PROPERTY,{});

                evt.actions.push(_action);
                */


            },
            /**
             * Standard call from {xide/manager/Context}
             * Register actions per bean type 'BLOCK'
             */
            init:function(){

                //var _action = Action.create('Copy','fa-copy','Edit/Copy',true,types.OPERATION.CLIPBOARD_COPY,types.ITEM_TYPE.BLOCK,'clipboard',null,true);

            },
            /**
             *
             * @param item
             * @param changedCB
             */
            editBlock:function(item,changedCB){
                if(!item.canEdit()){
                    return;
                }
                var title='Edit ',
                    thiz=this;
                if(item.title){
                    title+=item.title;
                }else if(item.name){
                    title+=item.name;
                }
                try {
                    var actionDialog = new BlockEditDialog({
                        item: item,
                        title: title,
                        style: 'width:400px',
                        resizeable: true,
                        delegate: {
                            onOk: function (dlg, data) {
                                if (changedCB) {
                                    changedCB(item);
                                }

                                /**
                                 * triggers to refresh block grid views
                                 */
                                thiz.publish(types.EVENTS.ON_BLOCK_PROPERTY_CHANGED,{
                                    item:item
                                });

                                /**
                                 * update block tree view!
                                 */
                                thiz.onBlockSelected({
                                    item:item,
                                    owner:this.currentCIView
                                });

                            }
                        }
                    });
                }catch(e){
                    //debugger;
                }
                actionDialog.show();
                actionDialog.resize();

            },
            onCIUpdate:function(evt){

                if(!evt._processedBMUI){
                    evt._processedBMUI=true;
                }else{
                    return;
                }

                if( evt['owner'] && evt.owner.source && evt.owner.source.delegate && evt.owner.item && evt.owner.delegate===this){

                    var cis = evt.owner.getCIS();
                    var item = evt.owner.item;
                    var options = utils.toOptions(cis);
                    //now convert back to block fields
                    for(var i = 0 ; i < options.length ; i++){
                        var option = options[i];
                        var field = option.dst;
                        if(field!=null && item[field]!=null){

                            if(option.active!=null && option.active===false && option.changed===false){
                                continue;
                            }
                            if( item[option.dst]!=option.value ||
                                item[option.dst]!==option.value)
                            {
                                //notify the block before changing something!
                                if(item.onChangeField){
                                    item.onChangeField(option.dst,option.value,cis,evt['owner']);
                                }
                                item[option.dst]=option.value;
                            }
                        }
                    }
                    this.publish(types.EVENTS.ON_BLOCK_PROPERTY_CHANGED,{
                        item:item
                    });
                    evt.owner.source.delegate.save();
                }
            },
            destroyWidgets:function(){},

            /**
             *
             * @param evt
             */
            onActionContextChanged:function(evt){
                if(evt &&  evt.beanType===types.ITEM_TYPE.BLOCK){//thats us!
                    this.blockTreeView=null;
                    this.targetTop=null;
                    this.targetBottom=null;
                    this.currentCIView=null;
                    var main = this.ctx.getApplication().mainView;
                    if(main){
                        main._openRight();
                    }

                }else if(evt &&  evt.beanType!==types.ITEM_TYPE.BLOCK) {//thats us!

                    this.blockTreeView=null;
                    this.targetTop=null;
                    this.targetBottom=null;
                    this.currentCIView=null;
                }
            },
            /**
             * bean type check
             * @param item
             * @returns {boolean}
             */
            shouldChangeActionContext:function(item){
                return !!(!item || !item.scope);
            },
            /**
             * Called when all consumers did their part
             */
            onReady:function(){

                var _EVENTS = types.EVENTS;//lookup opt.

                this.subscribe([
                    _EVENTS.ON_CI_UPDATE,
                    _EVENTS.ON_ACTION_CONTEXT_CHANGED,
                    'onSetWidgetPropertyActions' // this event key might be unkown yet
                ]);

                var thiz=this;
                setTimeout(function () {
                    factory.subscribe(types.EVENTS.ON_BLOCK_SELECTED, thiz.onBlockSelected, thiz);
                }, 1200);
            },

            onBlockSelected:function(evt){



                if(!evt.item || !evt.item.scope || evt.item.beanType!=="BLOCK"){
                    return;
                }

                try {
                    var block = evt.item;
                    if (!block) {
                        return;
                    }


                    if (!this.targetTop) {
                        this.targetTop = this.getRightTopTarget(true, true);
                        domClass.add(this.targetTop.domNode, 'CIDialog');
                    }


                    if(!this.targetTop){
                        console.error('target top invalid');
                        return;
                    }
                    if(!this.targetTop){
                        this.targetTop = this.getRightTopTarget(true, true);
                        domClass.add(this.targetTop.domNode, 'CIDialog');
                    }

                    if(!this.targetTop){
                        return;
                    }
                    if (this.targetTop.selectedChildWidget) {
                        this.lastSelectedTopTabTitle = this.targetTop.selectedChildWidget.title;
                    }


                    // clear tab - container
                    if (this.currentCIView && this.currentCIView.tabs) {
                        try {
                            for (var i = 0; i < this.currentCIView.tabs.length; i++) {
                                this.targetTop.removeChild(this.currentCIView.tabs[i]);
                            }
                        } catch (e) {
                            //should not happen!
                            console.error('clear failed');
                        }
                    }

                    if(!block.getFields){
                        console.log('have no fields',block);
                        return;
                    }

                    var cis = block.getFields();
                    for (var i = 0; i < cis.length; i++) {
                        cis[i].vertical = true;
                    }


                    var ciView = new CIViewMixin({
                        tabContainer: this.targetTop,
                        delegate: this,
                        viewStyle: 'padding:0px;',
                        autoSelectLast: true,
                        item: block,
                        source: evt.callee,
                        options: {
                            groupOrder: {
                                'General': 0,
                                'Advanced': 1,
                                'Description': 2
                            }
                        },
                        cis: cis
                    });
                    ciView.initWithCIS(cis);
                    this.currentCIView = ciView;

                    if(block.onFieldsRendered){
                        block.onFieldsRendered(block,cis);
                    }


                    var containers = this.targetTop.getChildren();
                    var descriptionView = null;
                    for (var i = 0; i < containers.length; i++) {

                        // @TODO : why is that not set?
                        containers[i].parentContainer = this.targetTop;

                        // track description container for re-rooting below
                        if (containers[i].title === 'Description') {
                            descriptionView = containers[i];
                        }

                        if(this.targetTop.selectedChildWidget.title!==this.lastSelectedTopTabTitle) {
                            if (containers[i].title === this.lastSelectedTopTabTitle) {
                                this.targetTop.selectChild(containers[i]);
                            }
                        }
                    }

                    if(!this.targetBottom) {
                        //  Re root description view into right bottom panel
                        this.targetBottom = this.getRightBottomTarget(true, false);

                    }


                    if (descriptionView && this.targetBottom) {
                        this.targetBottom.destroyDescendants(false);
                        this.currentCIView.tabs.remove(descriptionView);
                        descriptionView.parentContainer.removeChild(descriptionView);
                        this.targetBottom.addChild(descriptionView);
                        var main = this.getLayoutRightMain(false, false);
                        main.resize();
                    }

                    if (this.blockTreeView) {

                    } else {
                        var main = this.ctx.getApplication().mainView;
                        if(main){
                            main._openRight();
                        }
                        this.blockTreeView = this.createBlockTreeView(this.targetTop, 'New');
                    }
                }catch(e){
                    console.error('publish ON_BLOCK_SELECTED failed ' + e);
                }
            },
            createBlockTreeView:function(where,title,extraBlocks){

                try{
                    var treeView = utils.addWidget(BlockTreeView,{
                        title:title || 'Blocks',
                        style:'padding:0px'
                    },this,where,true);
                    return treeView;
                }catch(e){
                    debugger;
                }
            }

        });
    });