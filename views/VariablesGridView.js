define([
        'dojo/_base/declare',
        'xide/views/BeanView',
        'xide/types',
        "dgrid/OnDemandGrid",
        "dgrid/Selection",
        "dgrid/Editor",
        "xide/views/GridView",
        "dijit/form/TextBox",
        'dijit/form/ValidationTextBox',
        'xide/bean/Grouped'

    ],
    function (declare, BeanView, types,
              OnDemandGrid, Selection, editor, GridView, TextBox, ValidationTextBox,Grouped) {
        return declare("xblox.views.VariablesGridView", [BeanView, GridView,Grouped],
            {
                cssClass: 'variablesGridView',
                onShow: function () {
                    this.inherited(arguments);
                    this.publish(types.EVENTS.RESIZE);
                    this.setCurrentGroup(this.delegate.blockGroup);
                },
                variableNameValidator: function (value, constraints) {

                    var thiz = this;
                    var result = false;
                    var reg = new RegExp(/^[0-9a-zA-Z ...\-_ ]+$/);
                    if (value && reg.test(value)) {

                        if (thiz.delegate && thiz.delegate.variableNameExists && thiz.delegate.variableNameExists(value, this.object)) {
                            result = false;
                            thiz.promptMessage = 'Item already exists';
                            thiz.message = 'Item already exists';

                        } else {
                            result = true;
                            thiz.message = 'Enter new variable name';
                        }

                    } else {
                        thiz.promptMessage = 'This is not a valid variable name, try without special characters!';
                        thiz.message = 'This is not a valid variable name, try without special characters!';
                        result = false;
                    }
                    return result;
                },
                createWidgets: function (store) {
                    var thiz = this;
                    var grid = new (declare([OnDemandGrid, Selection]))({
                        cellNavigation: false,
                        store: store,
                        deselectOnRefresh: false,
                        columns: [
                            editor(
                                {
                                    label: "Name",
                                    field: "title",
                                    sortable: true,
                                    canEdit:function(item){
                                        return item.readOnly===false;
                                    },
                                    editorArgs: {
                                        required: true,
                                        promptMessage: "Enter a unique variable name",
                                        validator: thiz.variableNameValidator,
                                        delegate: thiz.delegate,
                                        intermediateChanges: false
                                    }
                                }, ValidationTextBox),
                            editor(
                                {
                                    label: "Value",
                                    field: "value",
                                    sortable: false,
                                    canEdit:function(item){
                                        return item.readOnly===false;
                                    }
                                }, TextBox)

                        ]
                    }, this.containerNode);

                    //grid.sort("name");
                    grid.refresh();
                    this.grid = grid;
                    this.onGridCreated(grid);
                },
                startup: function () {
                    this.inherited(arguments);
                    if (this.store) {
                        this.createWidgets(this.store);
                    }
                }
            });
    })
;