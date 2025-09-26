import type { Expression, Scope } from '../parser-old';

export function loadStdl(scope: Scope) {
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
