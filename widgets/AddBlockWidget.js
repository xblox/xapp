define([
    "dojo/_base/declare",
    "dojo/_base/html",
    'dojo/dom-class',
    "dojo/on",
    "xide/widgets/TemplatedWidgetBase",
    'xfile/types/Types',
    'xide/factory',
    'dijit/MenuItem',
    "dijit/MenuSeparator",
    'dojo/aspect'
],
    function (declare, html, domClass,on, TemplatedWidgetBase,types,factory,MenuItem,MenuSeparator,aspect)
    {
        return declare("xblocks.widgets.AddBlockWidget", [TemplatedWidgetBase],
            {
                wButton:null,
                wThumb:null,
                wList:null,
                wTree:null,
                layout:null,
                menu:null,
                _didCreateDefaultItems:false,
                addJQueryClasses:true,
                menuItems:null,
                firstItem:null,
                templateString:"<div><div class='addBlockSelector' data-dojo-type='dijit.form.DropDownButton' data-dojo-props=\"iconClass:'el-icon-plus-sign'\" data-dojo-attach-point='wButton'>" +
                    "<span></span>" +
                    "<div data-dojo-attach-point='menu' data-dojo-type='dijit.Menu' style='display: none;'>" +
                    "</div>" +
                    "</div>" +
                    "</div>",
                _patchMenu:function(widget){
                    var thiz=this;
                    aspect.after(widget, 'onOpen', function(){
                        if(this._popupWrapper && this._popupWrapper){
                            var dst = this._popupWrapper;
                            domClass.add(dst,'ui-widget ui-widget-content');
                        }
                    });
                },
                /**
                 * Open source selector
                 */
                open:function(){
                    this.wButton.domNode.focus();
                    this.wButton.openDropDown();
                    if(this.firstItem){
                        this.firstItem.focus();
                    }
                },
                postMixInProperties:function ()
                {
                    this.inherited(arguments);
                },
                _defaultItems:function(){
                    var items = [];
                    return items;
                },
                onMenuItemClick:function(menuItem){

                    if(menuItem.item.handler){
                        menuItem.item.handler();
                        return;
                    }
                    try{
                        this.delegate.addItem(menuItem);
                    }catch(e){
                        debugger;
                    }
                },
                fixButton:function(button){

                    if(button && button.iconNode){
                        domClass.add(button.domNode,'ui-menu-item');
                        domClass.remove(button.iconNode,'dijitReset');
                        domClass.add(button.iconNode,'actionToolbarButtonElusive');
                    }
                },
                _addHandler:function(menuItem,item){
                    var thiz=this;
                    dojo.connect(menuItem, "onClick", function () {
                        thiz.onMenuItemClick(menuItem);
                    });
                },
                createMenuItem:function(itemData,index){

                    var icon = itemData.icon || (itemData.iconClass) || 'fileSelectDiscIcon';

                    var subItems = itemData.items;
                    var thiz=this;

                    //has sub items : put them into own popup menu
                    if(subItems && subItems.length>0){


                        var pSubMenu = new dijit.Menu({parentMenu:this.menu});

                        this._patchMenu(pSubMenu);

                        for(var i = 0 ; i< subItems.length;i++){

                            var subItem = new MenuItem({
                                item:subItems[i],
                                iconClass:subItems[i].iconClass,
                                label:subItems[i].name,
                                owner:itemData
                            });
                            pSubMenu.addChild(subItem);
                            this._addHandler(subItem,subItems[i]);
                        }

                        this.menu.addChild(new dijit.PopupMenuItem({
                            label:itemData.label || itemData.name,
                            popup:pSubMenu,
                            iconClass:icon
                        }));

                        return pSubMenu;

                    }else{//single item

                        var menuItem = new MenuItem({
                            item:itemData,
                            iconClass:icon,
                            label:itemData.label || itemData.name
                        });
                        this.menu.addChild(menuItem);

                        dojo.connect(menuItem, "onClick", function () {
                            thiz.onMenuItemClick(menuItem);
                        });
                        this.fixButton(menuItem);

                        return menuItem;
                    }
                },
                _createDefaultItems:function(){
                    this.menuItems=[];
                    this.firstItem=null;
                    var actions = this.delegate.getAddActions(this.item) || this._defaultItems();
                    for(var i = 0 ; i< actions.length;i++){

                        var menuItem= this.createMenuItem(actions[i],i+1);
                        if(!this.firstItem){
                            this.firstItem=menuItem;
                        }
                        this.menuItems.push(menuItem);
                    }

                    this.wButton.set('disabled',!(actions && actions.length>0));

                    this._didCreateDefaultItems=true;
                },
                onOpen:function(){
                    if(!this._didCreateDefaultItems){
                        this._createDefaultItems();
                    }
                },
                startup:function () {
                    try{
                        this.inherited(arguments);
                        if(!this._didCreateDefaultItems){
                            this._createDefaultItems();
                        }
                        if(this.addJQueryClasses){
                            domClass.add(this.menu.containerNode,'addBlockMenu ui-widget ui-widget-content ui-corner-all');
                        }
                        this.fixButton(this.wButton);
                        this._patchMenu(this.menu);
                    }catch(e){
                        debugger;
                    }
                }
            });
    });