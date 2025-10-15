import type { Token } from '../tokenizer/token';

export type ExtendedToken = Token & {
	skipped: boolean;
	line: number;
	column: number;
	tags: string[];

	isIrrelevant(): boolean;
	isOperator(): boolean;
	isCommand(): boolean;
};

export function ExtendedToken(
	token: Token,
	isSkipped: boolean,
	line: number,
	column: number
): ExtendedToken {
	const self = {
		...token,
		skipped: isSkipped,
		line,
		column,
		tags: [],

		isIrrelevant: () =>
			token.type == 'IrrelevantToken' || self.tags.includes('irrelevant'),
		isOperator: () =>
			token.type == 'Identifier' && self.tags.includes('operator'),
		isCommand: () =>
			token.type == 'Identifier' && self.tags.includes('command'),
	} as ExtendedToken;
	return self;
}
