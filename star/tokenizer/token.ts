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

export const FLAGS = {
	CONTAINS_NEW_LINE: 0b1,
	IS_IRRELEVANT: 0b10,
	IS_COMMAND: 0b100,
	IS_OPERATOR: 0b1_000,
	OPERATOR_SET: 0b10_000,
	AFTER_SPACE: 0b100_000,
} as const;

export type TokenType = keyof typeof TokenType;

export type BaseToken = {
	type: TokenType;
	text: string;
	index: number;
	content?: string;
	flags: number;

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
	flags: number = 0
): Token {
	const self = {
		type,
		text,
		index,
		content,
		flags,
		toString: () => `[ ${type} '${text.replace('\n', '⏎')}' @${index})]`,
	};

	return self;
}
