import { TokenType, Token, FLAGS } from './token';
import './ArrayUtil';
import {
	isDigit,
	isNewline,
	isSpace,
	isValidAlphaNumericIdentifier,
	isValidIdentifier,
} from './tokenizerUtil';

export type TokenizerOptions = {
	throwErrors: boolean;
};

export type TokenizerError = {
	message: string;
	index: string;
};

export class Tokenizer {
	public length = 0;
	public index = 0;
	public input = '';
	public errors: TokenizerError[] = [];
	public options: TokenizerOptions = {
		throwErrors: false,
	};

	public tokens: Token[] = [];
	public bracketStack: [TokenType, number][] = [];

	public endTrimable: number = 0;

	constructor(options: Partial<TokenizerOptions> = {}) {
		this.options = { ...this.options, ...options };
	}

	private getChar(): string {
		return this.input[this.index] || '\0';
	}

	private nextChar(delta = 1): string | undefined {
		return this.input[this.index + delta];
	}

	private next(): boolean {
		this.index++;
		return this.index < this.length;
	}

	private previous(): boolean {
		this.index--;
		return this.index >= 0;
	}

	private match(text: string): boolean {
		return this.input.slice(this.index, this.index + text.length) === text;
	}

	private hasChars(): boolean {
		return this.index < this.length;
	}

	private reportError(message: string) {
		if (this.options.throwErrors) {
			throw new Error(message);
		}
		this.errors.push({
			message,
			index: this.index.toString(),
		});
	}

	private pushToken(token: Token, pushToBracketStack: boolean = false) {
		if (pushToBracketStack) {
			this.bracketStack.push([token.type, this.index]);
		}
		this.tokens.push(token);
	}

	private expect(tokenType: TokenType, current: TokenType) {
		const lastTokenType = this.bracketStack.last();
		if (!lastTokenType) {
			this.reportError(
				`Unexpected token: ${current}, no matching ${tokenType} found before`
			);
			return;
		} else if (lastTokenType[0] !== tokenType) {
			this.reportError(
				`Unexpected token: ${current}, expected ${tokenType} witch started with ${lastTokenType[0]} @ ${lastTokenType[1]}`
			);
		} else {
			this.bracketStack.pop();
		}
	}

	public tokenize(input: string): Token[] {
		this.input = input;
		this.length = input.length;
		this.errors = [];
		this.tokens = [];
		this.index = 0;
		this.bracketStack = [];
		// find trimmable end
		for (let i = this.length - 1; i >= 0; i--) {
			if (!isSpace(this.input[i] as string)) {
				this.endTrimable = i + 1;
				break;
			}
		}

		while (this.hasChars()) {
			const start = this.index;
			let currentChar = this.getChar();
			if (currentChar == ',') {
				this.pushToken(Token(TokenType.Comma, currentChar, start));
			} else if (currentChar == '(') {
				this.pushToken(
					Token(TokenType.LeftParenthesis, currentChar, start),
					true
				);
			} else if (currentChar == ')') {
				this.expect(
					TokenType.LeftParenthesis,
					TokenType.RightParenthesis
				);
				this.pushToken(
					Token(TokenType.RightParenthesis, currentChar, start)
				);
			} else if (currentChar == '{') {
				this.pushToken(
					Token(TokenType.LeftBrace, currentChar, start),
					true
				);
			} else if (currentChar == '}') {
				this.expect(TokenType.LeftBrace, TokenType.RightBrace);
				this.pushToken(Token(TokenType.RightBrace, currentChar, start));
			} else if (currentChar == '[') {
				this.pushToken(
					Token(TokenType.LeftBracket, currentChar, start),
					true
				);
			} else if (currentChar == ']') {
				this.expect(TokenType.LeftBracket, TokenType.RightBracket);
				this.tokens.push(
					Token(TokenType.RightBracket, currentChar, start)
				);
			} else if (currentChar == "'") {
				let content = "'";
				let finished = false;
				while (true) {
					if (!this.next()) {
						break;
					}
					currentChar = this.getChar();
					if (currentChar == "'") {
						finished = true;
						content += "'";
						this.next();
						break;
					}
					content += currentChar;
				}
				if (!finished) {
					this.reportError('Unterminated string started at ' + start);
				}
				this.tokens.push(Token(TokenType.String, content, start));
				continue;
			} else if (currentChar == '#') {
				let directive = '';
				while (true) {
					if (!this.next()) {
						break;
					}
					currentChar = this.getChar();
					if (isSpace(currentChar) || currentChar == '{') {
						break;
					}
					directive += currentChar;
				}
				this.tokens.push(
					Token(
						TokenType.Directive,
						'#' + directive,
						start,
						directive
					)
				);
				continue;
			} else {
				if (isSpace(currentChar)) {
					let text = '';
					let flag = 0;
					do {
						if (currentChar == '\n') {
							flag |= FLAGS.CONTAINS_NEW_LINE;
						}
						text += currentChar;
						if (!this.next()) break;
						currentChar = this.getChar();
					} while (isSpace(currentChar));
					this.tokens.push(
						Token(TokenType.Space, text, start, void 0, flag)
					);
					continue;
				} else if (isDigit(currentChar)) {
					let number = currentChar;
					while (true) {
						if (!this.next()) break;
						currentChar = this.getChar();
						if (!isDigit(currentChar)) break;
						number += currentChar;
					}
					this.tokens.push(Token(TokenType.Number, number, start));
					continue;
				} else if (isValidIdentifier(currentChar)) {
					let text = currentChar;
					while (true) {
						if (!this.next()) break;
						currentChar = this.getChar();
						if (isValidIdentifier(currentChar)) {
							text += currentChar;
							continue;
						}
						break;
					}
					const token = Token(
						TokenType.Identifier,
						text,
						start,
						void 0,
						FLAGS.OPERATOR_SET
					);
					this.tokens.push(token);
					continue;
				} else if (isValidAlphaNumericIdentifier(currentChar, false)) {
					let text = currentChar;
					while (true) {
						if (!this.next()) break;
						currentChar = this.getChar();
						if (isValidAlphaNumericIdentifier(currentChar, false)) {
							text += currentChar;
							continue;
						}
						break;
					}
					this.tokens.push(Token(TokenType.Identifier, text, start));
					continue;
				} else {
					this.reportError(
						`Unexpected character "${currentChar}" at index ${start}`
					);
					this.tokens.push(
						Token(TokenType.InvalidToken, currentChar, start)
					);
				}
			}
			this.next();
		}
		for (const bracket of this.bracketStack.reverse()) {
			this.reportError(
				`Missing closing "${bracket[0]}" at index ${bracket[1]}`
			);
		}
		return this.tokens;
	}
}
