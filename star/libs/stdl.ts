import {
	ConstantExpression,
	DeclareExpression,
	DefineExpression,
	ExtendsExpression,
	SetExpression,
} from '../Expression/memory';
import { CollectionKey, Key, type MetaRegister } from '../metaRegister';
import { HashType } from '../metaRegisterElement';
import {
	maxBindingPower,
	MemberExpression,
	TodoExpression,
	type Expression,
} from '../parser/parser';

export function loadStdl(scope: MetaRegister) {
	// Dodać definicję Funkcji
	scope.writeElement(CollectionKey('type', 'I32'), HashType('I32', 1));

	scope.writeElement(Key('defaultConstructorArchetype'), {
		$: 'IdentifierExpression',
		name: 'Function',
	});

	scope.writeElement(CollectionKey('infixOperator', '.'), {
		$: 'InfixOperator',
		bindingPower: maxBindingPower,
		expression: {
			$: 'ArgumentedExpression',
			creator(parent: Expression, member: Expression): Expression {
				return MemberExpression(parent, member);
			},
		},
		isRightBinded: false,
	});

	scope.writeElement(CollectionKey('infixOperator', ':='), {
		$: 'InfixOperator',
		bindingPower: 2,
		expression: {
			$: 'ArgumentedExpression',
			creator(parent: Expression, member: Expression): Expression {
				return DefineExpression(parent, member);
			},
		},
		isRightBinded: false,
	});

	scope.writeElement(CollectionKey('infixOperator', '::'), {
		$: 'InfixOperator',
		bindingPower: 2,
		expression: {
			$: 'ArgumentedExpression',
			creator(parent: Expression, member: Expression): Expression {
				return ConstantExpression(parent, member);
			},
		},
		isRightBinded: false,
	});

	scope.writeElement(CollectionKey('infixOperator', ':'), {
		$: 'InfixOperator',
		bindingPower: 2,
		expression: {
			$: 'ArgumentedExpression',
			creator(parent: Expression, member: Expression): Expression {
				return DeclareExpression(parent, member);
			},
		},
		isRightBinded: false,
	});

	scope.writeElement(CollectionKey('infixOperator', '='), {
		$: 'InfixOperator',
		bindingPower: 2,
		expression: {
			$: 'ArgumentedExpression',
			creator(parent: Expression, member: Expression): Expression {
				return SetExpression(parent, member);
			},
		},
		isRightBinded: false,
	});

	scope.writeElement(CollectionKey('infixOperator', '<:'), {
		$: 'InfixOperator',
		bindingPower: 2,
		expression: {
			$: 'ArgumentedExpression',
			creator(parent: Expression, member: Expression): Expression {
				return ExtendsExpression(parent, member);
			},
		},
		isRightBinded: false,
	});
}
