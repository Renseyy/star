import { loadStdl } from './star/libs/stdl';
import { Key, CollectionKey, MetaRegister } from './star/metaRegister';
import {
	type Expression,
	Parser,
	maxBindingPower,
	Call,
	MetaArchetypeOf,
	Identifier,
	GroupExpression,
} from './star/parser/parser';
import { Scoper } from './star/scoper';
import { operator, type Scope } from './star/scoper/scope';
import { Tokenizer } from './star/tokenizer/tokenizer';
import { renderCodeBlock } from './star/utils';

const tokenizer = new Tokenizer();
const scoper = new Scoper();
const liner = new Parser();
const code = await Bun.file('./test.sr').text();
const tokens = tokenizer.tokenize(code);
const scope: Scope = {
	fn: 'command',
	'|>': {
		$: 'operator',
		ignoresLineBefore: true,
		ignoresLineAfter: false,
	},
	'::': operator(false, true),
	':': operator(false, true),
	':=': operator(false, true),
	'=': operator(false, true),
};
const extendedTokens = scoper.resolveScopes(tokens, scope);
console.table(
	extendedTokens.map((token) => ({
		...token,
		text: token.text.replace(/[\r\n]/g, ''),
	}))
);
console.log(renderCodeBlock(extendedTokens));
const globalRegister = new MetaRegister();
loadStdl(globalRegister);
const element = liner.parse(extendedTokens, globalRegister);
// console.dir(JSON.parse(JSON.stringify(element)), { depth: null });
