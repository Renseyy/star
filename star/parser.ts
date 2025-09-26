import type { Scope } from './parser-old';
import { Token, TokenType } from './token';

/**
 * Liner zajmuje się rozwiązywaniem dyrektyw. W następnym kroku rozwiązywane będą wyrażenia w liniach
 */

export const ElementType = {
	Literal: 'Literal',
	Identifier: 'Identifier',
	Block: 'Block',
	Group: 'Group',
	Line: 'Line',
	Member: 'Member',
} as const;

export type ElementType = keyof typeof ElementType;

export type Literal = {
	type: 'Literal';
	contentType: string;
	value: string;
	startIndex: number;
	endIndex: number;
};

export type Identifier = {
	type: 'Identifier';
	value: string;
	startIndex: number;
	endIndex: number;
};

export type Block = {
	type: 'Block';
	expressions: Element[];
	startIndex: number;
	endIndex: number;
};

export type Group = {
	type: 'Group';
	lines: Line[];
	startIndex: number;
	endIndex: number;
};

export type Line = {
	type: 'Line';
	isJoinable: boolean;
	elements: Element[];
	startIndex: number;
	endIndex: number;
};

export type Element = Literal | Identifier | Block | Group | Line;

export type TokenHelper = {
	type: 'TokenHelper';
	token: Token;
};

export class Parser {
	private index = 0;

	// Tokens without irrelevant
	private tokens: Token[] = [];

	private getCurrentToken(): Token | undefined {
		return this.tokens[this.index];
	}

	private getCurrentTokenIndex(): number {
		return this.getCurrentToken()?.index ?? -1;
	}

	private getLastTokenIndex(): number {
		return this.tokens.last()?.index ?? -1;
	}

	private hasToken(): boolean {
		return this.index < this.tokens.length;
	}

	private advanceToken(): Token | undefined {
		this.index++;
		return this.getCurrentToken();
	}

	private reportError(
		message: string,
		tokenIndex: number = this.getCurrentTokenIndex()
	) {
		throw new Error(message);
	}

	private paraseBlock(isDirect: boolean = false): Block {
		const expressions: Element[] = [];
		let currentToken = this.getCurrentToken();
		const startIndex = currentToken?.index as number;
		if (!isDirect) {
			if (currentToken != undefined) {
				if (currentToken.type == TokenType.LeftBrace) {
					currentToken = this.advanceToken();
				} else {
					this.reportError(
						`Unexpected token ${currentToken.toString()} expected [ LEFT_BRACE '{' ]`
					);
				}
			} else {
				this.reportError(
					'Unexpected END_OF_TOKENS expected [ LEFT_BRACE `{` ]'
				);
			}
		}
		let endIndex = startIndex;
		while (currentToken) {
			const line = this.parseLine(true);
			expressions.push(line);
			endIndex = line.endIndex;
			const newToken = this.getCurrentToken();
			if (newToken == undefined) {
				if (!isDirect) {
					this.reportError(
						'Unexpected END_OF_TOKENS expected [ RIGHT_BRACE `}` ]'
					);
				}
				break;
			} else {
				if (
					newToken.type != TokenType.Semicolon &&
					newToken.type != TokenType.EndOfLine
				) {
					if (newToken.type == TokenType.RightBrace && !isDirect) {
						// eat right brace
						this.advanceToken();
						break;
					}
					this.reportError(
						`Unexpected token ${newToken.toString()}, expected end_of_line or semicolon`
					);
					endIndex--;
				}
				currentToken = this.advanceToken();
			}
			endIndex = newToken.index;
		}
		return {
			type: ElementType.Block,
			expressions,
			startIndex,
			endIndex,
		};
	}

	/**
	 * Jako, że musimy od razu połączyć odpowiednie elementy w grupy, linie, ale też member
	 * Algorytm:
	 * Idziemy od lewej do prawej strony aż dojdziemy do tokenów końcowych [END_OF_LINE, SEMICOLON]
	 * Po drodze, jeżeli napotkamy przecinek, to podajemy mu tokeny które już przeszliśmy i taki przecinek wykonuje dalszą częśc operacji na fragmentach, a później je łączy
	 * Jeżeli napotkamy początek elementu grupującego: [ ( { to parsujemy je w wyrażenie i idziemy dalej
	 * Po dojściu do końca przechodzimy jeszcze raz
	 * Każdy token traktujemy parseExpression
	 * Uzyskujemy gotowe wyrażenia w lini
	 *
	 * W ten sposób nie musimy mieć pełego parsera na tym etapie
	 * @returns
	 */

	private parseLine(fromBlock: boolean = false): Line | Group {
		const halfExpressions: (Element | TokenHelper)[] = [];
		const finish = (): Element[] => {
			const expressions: Element[] = [];
			for (const halfExpression of halfExpressions) {
				if (halfExpression.type == 'TokenHelper') {
					const expression = this.parseLiteral(halfExpression.token);
					expressions.push(expression);
				} else {
					expressions.push(halfExpression);
				}
			}
			return expressions;
		};
		for (
			let currentToken = this.getCurrentToken();
			currentToken;
			currentToken = this.getCurrentToken()
		) {
			if (
				currentToken.type == TokenType.EndOfLine ||
				currentToken.type == TokenType.Semicolon ||
				currentToken.type == TokenType.RightBrace ||
				currentToken.type == TokenType.RightBracket ||
				currentToken.type == TokenType.RightParenthes
			) {
				break;
			} else if (
				currentToken.type.in(
					TokenType.LeftBrace,
					TokenType.LeftBracket,
					TokenType.LeftParenthes
				)
			) {
				halfExpressions.push(this.parseExpression());
			} else if (currentToken.type == TokenType.Comma) {
				this.advanceToken();
				const afterComma = this.parseLine();
				const elements = finish();
				let startIndex = elements[0]?.startIndex as number;
				let endIndex = elements.last()?.endIndex as number;
				const lines: Line[] = [
					{
						type: ElementType.Line,
						elements: elements,
						isJoinable: false,
						startIndex,
						endIndex,
					},
				];
				if (afterComma.type == ElementType.Group) {
					lines.push(...afterComma.lines);
				} else {
					lines.push(afterComma);
				}
				startIndex = lines[0]?.startIndex as number;
				endIndex = lines.last()?.endIndex as number;
				return {
					type: ElementType.Group,
					lines: lines,
					startIndex,
					endIndex,
				};
			} else {
				halfExpressions.push({
					type: 'TokenHelper',
					token: currentToken,
				});
				this.advanceToken();
			}
		}
		const elements = finish();
		const startIndex = elements[0]?.startIndex as number;
		const endIndex = elements.last()?.endIndex as number;
		return {
			type: ElementType.Line,
			elements: elements,
			isJoinable: fromBlock,
			startIndex,
			endIndex,
		};
	}

	private parseLiteral(Token: Token): Element {
		if (Token.type == TokenType.Identifier) {
			return {
				type: ElementType.Identifier,
				value: Token.text,
				startIndex: Token.index,
				endIndex: Token.index,
			};
		} else if (Token.type.in(TokenType.Number, TokenType.String)) {
			return {
				type: ElementType.Literal,
				contentType: Token.type,
				value: Token.text,
				startIndex: Token.index,
				endIndex: Token.index,
			};
		} else {
			throw this.reportError(
				`Unexpected token ${Token.toString()}, expected Literal`
			);
		}
	}

	private parseExpression(): Element {
		const currentToken = this.getCurrentToken();
		if (currentToken == undefined) {
			throw this.reportError('Unexpected END_OF_TOKENS');
		} else if (
			currentToken.type.in(
				TokenType.Identifier,
				TokenType.Number,
				TokenType.String
			)
		) {
			this.advanceToken();
			return this.parseLiteral(currentToken);
		} else if (currentToken.type == TokenType.LeftBrace) {
			return this.paraseBlock();
		} else {
			throw this.reportError(
				`Unexpected token ${currentToken.toString()}, expected identifier`
			);
		}
	}

	public parse(tokens: Token[], scope: Scope) {
		this.index = 0;
		this.tokens = tokens.filter((t) => t.type != TokenType.IrrelevantToken);
		return this.paraseBlock(true);
	}
}
