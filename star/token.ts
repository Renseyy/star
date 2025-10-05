export const TokenType = {
	InvalidToken: 'InvalidToken',
	IrrelevantToken: 'IrrelevantToken',

	EndOfLine: 'EndOfLine',
	Identifier: 'Identifier',
	String: 'String',
	Number: 'Number',
	MetaDirective: 'MetaDirective',
	Directive: 'Directive',
	Resource: 'Resource',

	// (
	LeftParenthesis: 'LeftParenthesis',
	//)
	RightParenthesis: 'RightParenthesis',

	// [
	LeftBracket: 'LeftBracket',
	// ]
	RightBracket: 'RightBracket',

	// {
	LeftBrace: 'LeftBrace',
	//}
	RightBrace: 'RightBrace',

	Comma: 'Comma',
	Semicolon: 'Semicolon',
} as const;

export type TokenType = keyof typeof TokenType;

export class Token {
	public constructor(
		public type: TokenType,
		public text: string,
		public index: number,
		public content?: string
	) {}

	public toString() {
		return `[ ${this.type} '${this.text.replace('\n', '⏎')}' ]`;
	}
}
