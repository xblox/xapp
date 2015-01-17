define([
    'dojo/_base/lang',
    'xide/factory',
    'xide/utils',
    'xide/types',
    'xide/mixins/ReloadMixin',
    'xide/mixins/EventedMixin',
    "xblox/model/logic/CaseBlock",
    "xblox/model/Block",
    "xblox/model/functions/CallBlock",
    "xblox/model/code/CallMethod",
    "xblox/model/code/RunScript",
    "xblox/model/loops/ForBlock",
    "xblox/model/loops/WhileBlock",
    "xblox/model/variables/VariableAssignmentBlock",
    "xblox/model/logic/IfBlock",
    "xblox/model/logic/ElseIfBlock",
    "xblox/model/logic/SwitchBlock",
    "xblox/model/variables/VariableSwitch",
    "xblox/model/events/OnEvent",
    "xblox/model/events/OnKey",
    "xblox/model/logging/Log",
    "xblox/model/html/SetStyle",
    "xblox/model/html/SetCSS",

    "xblox/model/server/RunServerMethod"

], function (lang,
             factory,
             utils,
             types,
             ReloadMixin,EventedMixin,
             CaseBlock,
             Block,
             CallBlock,
             CallMethod,
             RunScript,
             ForBlock,
             WhileBlock,
             VariableAssignmentBlock,
             IfBlock,
             ElseIfBlock,
             SwitchBlock,
             VariableSwitch,
             OnEvent,
             OnKey,
             Log,
             SetStyle,
             SetCSS,
             RunServerMethod
    )
{


    var cachedAll = null;

    factory.clearVariables=function(){};

    factory.getAllBlocks=function(scope,owner,target,group,allowCache){

        if(allowCache!==false && cachedAll !=null){


            /**
             * remove dynamic blocks like 'Set Variable'
             */
            for (var i = 0; i < cachedAll.length; i++) {
                var obj = cachedAll[i];
                if(obj.name==='Set Variable'){
                    cachedAll.remove(obj);
                    break;
                }
            }
            return cachedAll;
        }else if(allowCache==false){
            cachedAll=null;
        }


        var items = factory._getFlowBlocks(scope,owner,target,group);
        items = items.concat(factory._getLoopBlocks(scope,owner,target,group));
        items = items.concat(factory._getCommandBlocks(scope,owner,target,group));
        items = items.concat(factory._getCodeBlocks(scope,owner,target,group));
        items = items.concat(factory._getEventBlocks(scope,owner,target,group));
        items = items.concat(factory._getLoggingBlocks(scope,owner,target,group));
        items = items.concat(factory._getHTMLBlocks(scope,owner,target,group));
        items = items.concat(factory._getServerBlocks(scope,owner,target,group));
        cachedAll = items;
        return items;
    };


    factory._getCommandBlocks=function(scope,owner,target,group){
        var items = [];
        return items;
    };

    factory._getServerBlocks=function(scope,owner,target,group){

        var items = [];
        items.push({
            name:'Server',
            iconClass: 'el-icon-repeat',
            items:[
                {
                    name:'Run Server Method',
                    owner:owner,
                    iconClass:'fa-plug',
                    proto:RunServerMethod,
                    target:target,
                    ctrArgs:{
                        scope:scope,
                        group:group
                    }
                }
            ]
        });

        //tell everyone
        factory.publish(types.EVENTS.ON_BUILD_BLOCK_INFO_LIST,{
            items:items,
            group:'Server'
        });
        return items;
    };
    factory._getHTMLBlocks=function(scope,owner,target,group){
        var items = [];
        items.push({
            name:'HTML',
            iconClass:'fa-paint-brush',
            items:[
                {
                    name:'Set Style',
                    owner:owner,
                    iconClass:'fa-paint-brush',
                    proto:SetStyle,
                    target:target,
                    ctrArgs:{
                        scope:scope,
                        group:group
                    }
                },
                {
                    name:'Set CSS',
                    owner:owner,
                    iconClass:'fa-paint-brush',
                    proto:SetCSS,
                    target:target,
                    ctrArgs:{
                        scope:scope,
                        group:group
                    }
                }
            ]
        });
        return items;
    };

    factory._getVariableBlocks=function(scope,owner,target,group){

        var items = [];
        items.push({
            name:'Flow',
            iconClass:'el-icon-random',
            items:[
                {
                    name:'If...Else',
                    owner:owner,
                    iconClass:'el-icon-fork',
                    proto:IfBlock,
                    target:target,
                    ctrArgs:{
                        scope:scope,
                        group:group,
                        condition:"[value1]=='PW'"
                    }
                },
                {
                    name:'Switch',
                    owner:owner,
                    iconClass:'el-icon-fork',
                    proto:SwitchBlock,
                    target:target,
                    ctrArgs:{
                        scope:scope,
                        group:group
                    }
                }
            ]
        });

        return items;
    };

    factory._getEventBlocks=function(scope,owner,target,group){

        var items = [];
        items.push({
            name:'Events',
            iconClass:'fa-bell',
            items:[
                {
                    name:'On Event',
                    owner:owner,
                    iconClass:'fa-bell',
                    proto:OnEvent,
                    target:target,
                    ctrArgs:{
                        scope:scope,
                        group:group
                    }
                },
                {
                    name:'On Key',
                    owner:owner,
                    iconClass:'fa-keyboard-o',
                    proto:OnKey,
                    target:target,
                    ctrArgs:{
                        scope:scope,
                        group:group
                    }
                }
            ]
        });



        //tell everyone
        factory.publish(types.EVENTS.ON_BUILD_BLOCK_INFO_LIST,{
            items:items,
            group:'Events'
        });

        return items;
    };

    factory._getLoggingBlocks=function(scope,owner,target,group){

        var items = [];
        items.push({
            name:'Logging',
            iconClass:'fa-bug',
            items:[
                {
                    name:'Log',
                    owner:owner,
                    iconClass:'fa-bug',
                    proto:Log,
                    target:target,
                    ctrArgs:{
                        scope:scope,
                        group:group
                    }
                }
            ]
        });

        //tell everyone
        factory.publish(types.EVENTS.ON_BUILD_BLOCK_INFO_LIST,{
            items:items,
            group:'Logging'
        });

        return items;
    };

    factory._getCodeBlocks=function(scope,owner,target,group){

        var items = [];
        items.push({
            name:'Code',
            iconClass:'fa-code',
            items:[
                {
                    name:'Call Method',
                    owner:owner,
                    iconClass:'el-icon-video',
                    proto:CallMethod,
                    target:target,
                    ctrArgs:{
                        scope:scope,
                        group:group
                    }
                },
                {
                    name:'Run Script',
                    owner:owner,
                    iconClass:'fa-code',
                    proto:RunScript,
                    target:target,
                    ctrArgs:{
                        scope:scope,
                        group:group
                    }
                }
            ]
        });
        //tell everyone
        factory.publish(types.EVENTS.ON_BUILD_BLOCK_INFO_LIST,{
            items:items,
            group:'Code'
        });
        return items;
    };

    factory._getFlowBlocks=function(scope,owner,target,group){

        var items = [];
        items.push({
            name:'Flow',
            iconClass:'el-icon-random',
            items:[
                {
                    name:'If...Else',
                    owner:owner,
                    iconClass:'el-icon-fork',
                    proto:IfBlock,
                    target:target,
                    ctrArgs:{
                        scope:scope,
                        group:group,
                        condition:"[value1]=='PW'"
                    }
                },
                {
                    name:'Switch',
                    owner:owner,
                    iconClass:'el-icon-fork',
                    proto:SwitchBlock,
                    target:target,
                    ctrArgs:{
                        scope:scope,
                        group:group
                    }
                },
                {
                    name:'Variable Switch',
                    owner:owner,
                    iconClass:'el-icon-fork',
                    proto:VariableSwitch,
                    target:target,
                    ctrArgs:{
                        scope:scope,
                        group:group
                    }
                }
            ]
        });

        //tell everyone
        factory.publish(types.EVENTS.ON_BUILD_BLOCK_INFO_LIST,{
            items:items,
            group:'Flow'
        });

        return items;
    };

    factory._getLoopBlocks=function(scope,owner,target,group){

        var items = [];
        items.push({
            name:'Loops',
            iconClass: 'el-icon-repeat',
            items:[
                {
                    name:'While',
                    owner:owner,
                    iconClass:'el-icon-repeat',
                    proto:WhileBlock,
                    target:target,
                    ctrArgs:{
                        scope:scope,
                        group:group,
                        condition:"[Volume]<=100"
                    }
                },
                {
                    name:'For',
                    owner:owner,
                    iconClass:'el-icon-repeat',
                    proto:ForBlock,
                    target:target,
                    ctrArgs:{
                        scope:scope,
                        group:group,
                        initial: '1',
                        comparator: "<=",
                        "final": '5',
                        modifier: '+1',
                        counterName: 'value'
                    }
                }
            ]
        });

        //tell everyone
        factory.publish(types.EVENTS.ON_BUILD_BLOCK_INFO_LIST,{
            items:items,
            group:'Loops'
        });
        return items;
    };



    factory._getMathBlocks=function(scope,owner,dstItem,group){

        var items = [];
        items.push({
            name:'Math',
            owner:this,
            iconClass:'el-icon-qrcode',
            dstItem:dstItem,
            items:[
                {
                    name:'If...Else',
                    owner:dstItem,
                    iconClass:'el-icon-compass',
                    proto:IfBlock,
                    item:dstItem,
                    ctrArgs:{
                        scope:scope,
                        group:group
                    }
                }
            ]
        });
        return items;
    };



    factory._getTimeBlocks=function(scope,owner,dstItem,group){

        var items = [];
        items.push({
            name:'Time',
            owner:this,
            iconClass:'el-icon-qrcode',
            dstItem:dstItem,
            items:[
                {
                    name:'If...Else',
                    owner:dstItem,
                    iconClass:'el-icon-time',
                    proto:IfBlock,
                    item:dstItem,
                    ctrArgs:{
                        scope:scope,
                        group:group
                    }
                }

            ]
        });
        return items;
    };


    factory._getTransformBlocks=function(scope,owner,dstItem,group){

        var items = [];
        items.push({
            name:'Time',
            owner:this,
            iconClass:'el-icon-magic',
            dstItem:dstItem,
            items:[
                {
                    name:'If...Else',
                    owner:dstItem,
                    iconClass:'el-icon-time',
                    proto:IfBlock,
                    item:dstItem,
                    ctrArgs:{
                        scope:scope,
                        group:group
                    }
                }
            ]
        });



        return items;


    };


    factory.prepareBlockContructorArgs=function(ctorArgs){
        if(!ctorArgs){
            ctorArgs={};
        }

        //prepare items
        if(!ctorArgs['id']){
            ctorArgs['id']=utils.createUUID();
        }
        if(!ctorArgs['items']){
            ctorArgs['items']=[];
        }
    };


    /***
     *
     * @param mixed String|Prototype
     * @param ctorArgs
     * @param baseClasses
     */
    factory.createBlock=function(mixed,ctorArgs,baseClasses){

        //complete missing arguments:
        factory.prepareBlockContructorArgs(ctorArgs);

        var block= factory.createInstance(mixed,ctorArgs,baseClasses);
        block.ctrArgs=null;
        try{
            if(block && block.init){
                block.init();
            }
            ReloadMixin.prototype.mergeFunctions(block,EventedMixin.prototype);
            ReloadMixin.prototype.mergeFunctions(block,ReloadMixin.prototype);

            //add to scope
            if (block.scope) {
                block.scope.registerBlock(block);
            }
            try{
                if(block.initReload){
                    block.initReload();
                }
            }catch(e){
                debugger;
            }
        }catch(e){
            debugger;
        }
        if(!block){
            debugger;
        }
        return block;

    };

    return factory;
});