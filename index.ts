import { loadStdl } from './star/libs/stdl';
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
loadStdl(scope);
const tree = parser.parse(element, scope);
console.dir(tree, { depth: null });
