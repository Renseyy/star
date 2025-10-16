import type { ExtendedToken } from '../parser/extendedToken';

export const TokenType = {
	InvalidToken: 'InvalidToken',

	Space: 'Space',
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
