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

        hasEditors:function(){
            return ['xblox'];
        },
        getDependencies:function(){
            return [
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
            ];
        },
        /**
         * @inheritDoc
         */
        getLabel: function () {
            return 'xblox';
        },
        /**
         * @inheritDoc
         */
        getBeanType:function(){
            return this.beanType;
        }
    });
});

