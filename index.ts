import { loadStdl } from './star/libs/stdl';
import {
	MetaScope,
	type Expression,
	Parser,
	maxBindingPower,
	Call,
	MemberOf,
	ArchetypeOf,
	Identifier,
	Group,
} from './star/parser';
import { Tokenizer } from './star/tokenizer';

const tokenizer = new Tokenizer();
const liner = new Parser();
const code = await Bun.file('./test.sr').text();
const tokens = tokenizer.tokenize(code);
console.log(tokens);
const scope = new MetaScope();
scope.setDefaultConstructor({
	type: 'IdentifierExpression',
	name: 'Function',
});
scope.writeElement('.', {
	$type: 'OperatorGroup',
	prefix: {
		bindingPower: maxBindingPower,
		expression: {
			type: 'ArgumentedExpression',
			creator(expression: Expression): Expression {
				return {
					type: 'MemberExpression',
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
					type: 'MemberExpression',
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
					MemberOf(ArchetypeOf(expression), Identifier('+')),
					Group()
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
					MemberOf(ArchetypeOf(left), Identifier('+')),
					Group(right)
				);
			},
		},
		isRightBinded: false,
	},
	postfix: null,
});
const element = liner.parse(tokens, scope);
console.dir(JSON.parse(JSON.stringify(element)), { depth: null });
