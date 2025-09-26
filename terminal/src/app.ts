import type { Token } from '../../star/token';
import { Tokenizer } from '../../star/tokenizer';
import { Parser } from '../../star/parser';
import './style/main.css';
import 'victormono';

function renderToken(token: Token): string {
	const type =
		token.text != 'Array' && token.text != 'Map' ? token.type : 'Hint';
	return `<span data-index="${
		token.index
	}" class="_Token _${type}">${token.text.replaceAll('\n', () =>
		type == 'IrrelevantToken' ? '␤<br>' : '⏎<br>'
	)}</span>`;
}

document.addEventListener('DOMContentLoaded', () => {
	const tokenizer = new Tokenizer();
	const liner = new Parser();
	const terminal = document.getElementById('terminal');
	const textarea = terminal?.querySelector('textarea') as HTMLTextAreaElement;
	const output = terminal?.querySelector('#tokens') as HTMLDivElement;
	const tokenize = () => {
		const content = textarea.value;
		console.log(content);
		const tokens = tokenizer.tokenize(content);
		console.log(tokens);
		output.innerHTML =
			tokens.map(renderToken).join('') +
			'<br><hr>' +
			tokenizer.errors.map((e) => e.message).join('<br>');
	};
	textarea.addEventListener('input', tokenize);
	textarea.addEventListener('keydown', function (e) {
		if (e.key === 'Tab') {
			e.preventDefault();
			var start = this.selectionStart;
			var end = this.selectionEnd;

			// set textarea value to: text before caret + tab + text after caret
			this.value =
				this.value.substring(0, start) +
				'\t' +
				this.value.substring(end);

			// put caret at right position again
			this.selectionStart = this.selectionEnd = start + 1;
		}
		// Smart inserts
		if (e.key === '{') {
			e.preventDefault();
			this.value =
				this.value.substring(0, this.selectionStart) +
				'{}' +
				this.value.substring(this.selectionStart);
			this.selectionStart = this.selectionEnd = this.selectionStart - 1;
			tokenize();
		} else if (e.key === '}') {
			const nextChar = this.value[this.selectionStart];
			if (nextChar === '}') {
				e.preventDefault();
				this.selectionStart = this.selectionEnd =
					this.selectionStart + 1;
			}
		}
	});
	tokenize();
});
