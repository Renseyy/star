import { TokenType, Token } from './token';
import './ArrayUtil';
import {
	isDigit,
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

	private trimBefore(): boolean {
		if (this.tokens.length <= 0) return false;
		const last = this.tokens.last();
		if (last && last.type === TokenType.EndOfLine) {
			last.type = TokenType.IrrelevantToken;
			return true;
		}
		return false;
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
		while (this.hasChars()) {
			const start = this.index;
			let currentChar = this.getChar();
			if (currentChar == ',') {
				this.pushToken(new Token(TokenType.Comma, currentChar, start));
			} else if (currentChar == '(') {
				this.pushToken(
					new Token(TokenType.LeftParenthes, currentChar, start),
					true
				);
			} else if (currentChar == ')') {
				this.trimBefore();
				this.expect(TokenType.LeftParenthes, TokenType.RightParenthes);
				this.pushToken(
					new Token(TokenType.RightParenthes, currentChar, start)
				);
			} else if (currentChar == '{') {
				this.pushToken(
					new Token(TokenType.LeftBrace, currentChar, start),
					true
				);
			} else if (currentChar == '}') {
				this.trimBefore();
				this.expect(TokenType.LeftBrace, TokenType.RightBrace);
				this.pushToken(
					new Token(TokenType.RightBrace, currentChar, start)
				);
			} else if (currentChar == '[') {
				this.pushToken(
					new Token(TokenType.LeftBracket, currentChar, start),
					true
				);
			} else if (currentChar == ']') {
				this.trimBefore();
				this.expect(TokenType.LeftBracket, TokenType.RightBracket);
				this.tokens.push(
					new Token(TokenType.RightBracket, currentChar, start)
				);
			} else if (currentChar == '.') {
				this.trimBefore();
				this.tokens.push(new Token(TokenType.Dot, currentChar, start));
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
				this.tokens.push(new Token(TokenType.String, content, start));
				continue;
			} else if (currentChar == '#') {
				let directive = '';
				while (true) {
					if (!this.next()) {
						break;
					}
					currentChar = this.getChar();
					if (isSpace(currentChar)) {
						break;
					}
					directive += currentChar;
				}
				this.tokens.push(
					new Token(
						TokenType.Directive,
						'#' + directive,
						start,
						directive
					)
				);
				continue;
			} else {
				if (isSpace(currentChar)) {
					if (currentChar == '\n') {
						const last = this.tokens.last();
						const lastType = last?.type;
						const nextChar = this.nextChar();
						const shouldEmitEol =
							nextChar !== undefined &&
							lastType !== undefined &&
							lastType !== TokenType.IrrelevantToken &&
							last?.text != '\n' &&
							lastType !== TokenType.Comma &&
							lastType !== TokenType.EndOfLine &&
							lastType !== TokenType.LeftBrace &&
							lastType !== TokenType.LeftBracket &&
							lastType !== TokenType.LeftParenthes;
						if (shouldEmitEol) {
							this.tokens.push(
								new Token(TokenType.EndOfLine, '\n', start)
							);
						} else {
							this.tokens.push(
								new Token(
									TokenType.IrrelevantToken,
									'\n',
									start
								)
							);
						}
					} else {
						this.tokens.push(
							new Token(
								TokenType.IrrelevantToken,
								currentChar,
								start
							)
						);
					}
				} else if (isDigit(currentChar)) {
					let number = currentChar;
					while (true) {
						if (!this.next()) break;
						currentChar = this.getChar();
						if (!isDigit(currentChar)) break;
						number += currentChar;
					}
					this.tokens.push(
						new Token(TokenType.Number, number, start)
					);
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
					this.tokens.push(
						new Token(TokenType.Identifier, text, start)
					);
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
					this.tokens.push(
						new Token(TokenType.Identifier, text, start)
					);
					continue;
				} else {
					this.reportError(
						`Unexpected character "${currentChar}" at index ${start}`
					);
					this.tokens.push(
						new Token(TokenType.InvalidToken, currentChar, start)
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
