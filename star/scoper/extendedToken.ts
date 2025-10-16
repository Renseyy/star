import { FLAGS, type Token } from '../tokenizer/token';

export type ExtendedToken = Token & {
	skipped: boolean;
	line: number;
	column: number;

	isIrrelevant(): boolean;
	isOperator(): boolean;
	isCommand(): boolean;
	containsNewLine(): boolean;
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

		isIrrelevant: () => !!(self.flags & FLAGS.IS_IRRELEVANT),
		isOperator: () => !!(self.flags & FLAGS.IS_OPERATOR),
		isCommand: () => !!(self.flags & FLAGS.IS_COMMAND),
		containsNewLine: () => !!(self.flags & FLAGS.CONTAINS_NEW_LINE),
	} as ExtendedToken;
	return self;
}
