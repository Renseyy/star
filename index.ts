import { loadStdl } from './star/libs/stdl';
import { Parser } from './star/parser';
import { Scope, type Expression } from './star/parser-old';
import { Tokenizer } from './star/tokenizer';

const tokenizer = new Tokenizer();
const liner = new Parser();
const code = await Bun.file('./test.sr').text();
const tokens = tokenizer.tokenize(code);
console.log(tokens);
const scope = new Scope();
const element = liner.parse(tokens, scope);
console.dir(element, { depth: null });
