import { loadStdl } from './star/libs/stdl';
import { Scope, type Expression, Parser } from './star/parser';
import { Tokenizer } from './star/tokenizer';

const tokenizer = new Tokenizer();
const liner = new Parser();
const code = await Bun.file('./test.sr').text();
const tokens = tokenizer.tokenize(code);
console.log(tokens);
const scope = new Scope();
const element = liner.parse(tokens, scope);
console.dir(JSON.parse(JSON.stringify(element)), { depth: null });
