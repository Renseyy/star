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

export type BaseToken = {
	type: TokenType;
	text: string;
	index: number;
	content?: string;
	operatorSet?: true;

	toString(): string;
};

export type Token =
	| BaseToken
	| (BaseToken & { type: 'IrreleavantToken'; content: 'space' | 'newline' });

export function Token(
	type: TokenType,
	text: string,
	index: number,
	content?: string,
	operatorSet?: true
) {
	return {
		type,
		text,
		index,
		content,
		operatorSet,
		toString: () => `[ ${type} '${text.replace('\n', '⏎')}' @${index})]`,
	};
}

export function colorToken(token: Token): string {
	if (token.type.in(TokenType.LeftBrace, TokenType.RightBrace))
		return `\x1b[38;5;215m${token.text}\x1b[0m`;
	else if (
		token.type.in(TokenType.LeftParenthesis, TokenType.RightParenthesis)
	)
		return `\x1b[38;5;27m${token.text}\x1b[0m`;
	else if (token.type.in(TokenType.LeftBracket, TokenType.RightBracket))
		return `\x1b[38;5;215m${token.text}\x1b[0m`;
	else if (token.type.in(TokenType.Identifier) && token?.operatorSet)
		return `\x1b[38;5;77m${token.text}\x1b[0m`;
	return token.text;
}
