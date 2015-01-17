define([
    "dojo/_base/declare",
    "dojo/_base/Deferred",
    "dojo/has",
    "xide/model/Component",
    "xide/types",
    "require"
], function (declare,Deferred,has,Component,types,require) {
    /**
     * @class xblox.component
     * @inheritDoc
     */
    return declare([Component], {
        /**
         * @inheritDoc
         */
        beanType:'BLOCK',
        //////////////////////////////////////////////////////////////////////////////////////////////////////
        //
        //  Implement base interface
        //
        //////////////////////////////////////////////////////////////////////////////////////////////////////
        /**
         * @inheritDoc
         */
        getLabel: function () {
            return 'XIDE Visual Designer';
        },

        /**
         * @inheritDoc
         */
        load:function(){
            var _defered = new Deferred();
            var _re      = require;//hide from gcc
            _re([
                'xblox/types/Types',
                'xblox/manager/BlockManager',
                'xblox/embedded_ui',
                'xfile/manager/BlockManager',
                'xfile/views/BlocksFileEditor',
                'xide/widgets/ExpressionJavaScript',

                'xide/widgets/ImageWidget',
                'xide/widgets/Expression',
                'xide/widgets/ArgumentsWidget',
                'xide/widgets/RichTextWidget',
                'xide/widgets/JSONEditorWidget',
                'xide/widgets/ExpressionEditor',
                'xide/widgets/WidgetReference',
                'xide/widgets/DomStyleProperties'
            ],function(XBlockManager,embedded_ui,FBlockManager,BlocksFileEditor,ExpressionJavaScript,
                       ImageWidget,Expression, ArgumentsWidget, RichTextWidget, JSONEditorWidget, ExpressionEditor, WidgetReference, DomStyleProperties){

                has.add('xblox',function(){return true});

                _defered.resolve();
            });

            return _defered.promise;
        },

        /**
         * @inheritDoc
         */
        getBeanType:function(){
            return this.getLabel();
        }
    });
});

