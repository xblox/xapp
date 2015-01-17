define([
    'xide/types',
    'dojo/_base/lang'
],function(types,lang)
    {

        lang.mixin(types.EVENTS,{
            ON_BLOCK_SELECTED:           'onItemSelected',
            ON_BLOCK_UNSELECTED:         'onBlockUnSelected',
            ON_BLOCK_EXPRESSION_FAILED:  'onExpressionFailed',
            ON_BUILD_BLOCK_INFO_LIST:    'onBuildBlockInfoList',
            ON_BUILD_BLOCK_INFO_LIST_END:'onBuildBlockInfoListEnd',
            ON_BLOCK_PROPERTY_CHANGED   :'onBlockPropertyChanged',
            ON_SCOPE_CREATED:            'onScopeCreated',
            ON_VARIABLE_CHANGED:         'onVariableChanged'
        });


        types.BlockType = {
            AssignmentExpression: 'AssignmentExpression',
            ArrayExpression: 'ArrayExpression',
            BlockStatement: 'BlockStatement',
            BinaryExpression: 'BinaryExpression',
            BreakStatement: 'BreakStatement',
            CallExpression: 'CallExpression',
            CatchClause: 'CatchClause',
            ConditionalExpression: 'ConditionalExpression',
            ContinueStatement: 'ContinueStatement',
            DoWhileStatement: 'DoWhileStatement',
            DebuggerStatement: 'DebuggerStatement',
            EmptyStatement: 'EmptyStatement',
            ExpressionStatement: 'ExpressionStatement',
            ForStatement: 'ForStatement',
            ForInStatement: 'ForInStatement',
            FunctionDeclaration: 'FunctionDeclaration',
            FunctionExpression: 'FunctionExpression',
            Identifier: 'Identifier',
            IfStatement: 'IfStatement',
            Literal: 'Literal',
            LabeledStatement: 'LabeledStatement',
            LogicalExpression: 'LogicalExpression',
            MemberExpression: 'MemberExpression',
            NewExpression: 'NewExpression',
            ObjectExpression: 'ObjectExpression',
            Program: 'Program',
            Property: 'Property',
            ReturnStatement: 'ReturnStatement',
            SequenceExpression: 'SequenceExpression',
            SwitchStatement: 'SwitchStatement',
            SwitchCase: 'SwitchCase',
            ThisExpression: 'ThisExpression',
            ThrowStatement: 'ThrowStatement',
            TryStatement: 'TryStatement',
            UnaryExpression: 'UnaryExpression',
            UpdateExpression: 'UpdateExpression',
            VariableDeclaration: 'VariableDeclaration',
            VariableDeclarator: 'VariableDeclarator',
            WhileStatement: 'WhileStatement',
            WithStatement: 'WithStatement'
        };

        return types;
});