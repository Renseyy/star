export const TokenType = {
	InvalidToken: 'InvalidToken',
	IrrelevantToken: 'IrrelevantToken',

	EndOfLine: 'EndOfLine',
	Identifier: 'Identifier',
	String: 'String',
	Number: 'Number',
	Directive: 'Directive',
	Resource: 'Resource',

	// (
	LeftParenthes: 'LeftParenthes',
	//)
	RightParenthes: 'RightParenthes',

	// [
	LeftBracket: 'LeftBracket',
	// ]
	RightBracket: 'RightBracket',

	// {
	LeftBrace: 'LeftBrace',
	//}
	RightBrace: 'RightBrace',

	Dot: 'Dot',
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
