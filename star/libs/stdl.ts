import type { Expression, MetaScope } from '../parser';

export function loadStdl(scope: MetaScope) {
	const logicalNot = {
		type: 'OperatorGroup',
		prefix: {
			bindingPower: 14,
			expression: {
				type: 'ArgumentedExpression',
				creator(expression: Expression): Expression {
					return {
						type: 'LogicNotOperation',
						expression,
					};
				},
			},
		},
		infix: null,
		postfix: null,
	} as const;
	scope.writeElement('!', logicalNot);
	scope.writeElement('not', logicalNot);
}
