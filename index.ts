import { Liner } from './star/liner';
import { Parser, Scope, type Expression } from './star/parser';
import { Tokenizer } from './star/tokenizer';

const tokenizer = new Tokenizer();
const liner = new Liner();
const parser = new Parser();
const code = await Bun.file('./test.sr').text();
const tokens = tokenizer.tokenize(code);
console.log(tokens);
const element = liner.parse(tokens);
console.dir(element, { depth: null });
const scope = new Scope();

// Operators
scope.writeElement('&&', {
	type: 'OperatorGroup',
	prefix: null,
	infix: {
		bindingPower: 24,
		isRightBinded: true,
		expression: {
			type: 'ArgumentedExpression',
			creator(left: Expression, right: Expression) {
				return {
					type: 'LogicAndOperation',
					left,
					right,
				};
			},
		},
	},
	postfix: null,
});
scope.writeElement('!', {
	type: 'OperatorGroup',
	prefix: {
		bindingPower: 14,
		expression: {
			type: 'ArgumentedExpression',
			creator(expression: Expression): Expression {
				return {
					type: 'LogicNegationOperation',
					expression,
				};
			},
		},
	},
	infix: null,
	postfix: null,
});
const tree = parser.parse(element, scope);
console.dir(tree, { depth: null });
