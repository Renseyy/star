import { loadStdl } from './star/libs/stdl';
import { Key, CollectionKey, MetaRegister } from './star/metaRegister';
import {
	type Expression,
	Parser,
	maxBindingPower,
	Call,
	MemberOf,
	MetaArchetypeOf,
	Identifier,
	GroupExpression,
} from './star/parser';
import { Tokenizer } from './star/tokenizer';

const tokenizer = new Tokenizer();
const liner = new Parser();
const code = await Bun.file('./test.sr').text();
const tokens = tokenizer.tokenize(code);
console.log(tokens);
const scope = new MetaRegister();
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
			return {
				$: 'MemberExpression',
				parent,
				member,
			};
		},
	},
	isRightBinded: false,
});
scope.writeElement('.', {
	$type: 'OperatorGroup',
	prefix: {
		bindingPower: maxBindingPower,
		expression: {
			type: 'ArgumentedExpression',
			creator(expression: Expression): Expression {
				return {
					$: 'MemberExpression',
					parent: null,
					member: expression,
				};
			},
		},
	},
	infix: {
		bindingPower: maxBindingPower,
		expression: {
			type: 'ArgumentedExpression',
			creator(parent: Expression, member: Expression): Expression {
				return {
					$: 'MemberExpression',
					parent,
					member,
				};
			},
		},
		isRightBinded: false,
	},
	postfix: null,
});

scope.writeElement('+', {
	$type: 'OperatorGroup',
	prefix: {
		bindingPower: 17,
		expression: {
			type: 'ArgumentedExpression',
			creator(expression: Expression): Expression {
				return Call(
					MemberOf(MetaArchetypeOf(expression), Identifier('+')),
					GroupExpression()
				);
			},
		},
	},
	infix: {
		bindingPower: 17,
		expression: {
			type: 'ArgumentedExpression',
			creator(left: Expression, right: Expression): Expression {
				return Call(
					MemberOf(MetaArchetypeOf(left), Identifier('+')),
					GroupExpression(right)
				);
			},
		},
		isRightBinded: false,
	},
	postfix: null,
});
const element = liner.parse(tokens, scope);
console.dir(JSON.parse(JSON.stringify(element)), { depth: null });
