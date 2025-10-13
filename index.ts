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
} from './star/parser';
import { Tokenizer } from './star/tokenizer';

const tokenizer = new Tokenizer();
const liner = new Parser();
const code = await Bun.file('./test.sr').text();
const tokens = tokenizer.tokenize(code);
console.log(tokens);
const globalRegister = new MetaRegister();
loadStdl(globalRegister);
const element = liner.parse(tokens, globalRegister);
console.dir(JSON.parse(JSON.stringify(element)), { depth: null });
