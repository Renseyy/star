import type { ExtendedToken } from './scoper/extendedToken';
import { TokenType } from './tokenizer/token';

export interface StringRecord<T> {
	[key: string]: T;
}

export function expect<T>(name: string, value: { $: string }): T {
	if (value.$ != name) {
		throw new Error(`Expected ${name} got ${value.$}`);
	}
	return value as T;
}

/**
 * Calculates the Levenshtein distance between two strings.
 * This function is optimized to use less memory by only keeping track of two rows.
 *
 * @param a The first string.
 * @param b The second string.
 * @returns The Levenshtein distance.
 */
function levenshteinDistance(a: string, b: string): number {
	let m = a.length;
	let n = b.length;

	// Ensure n <= m to use less space
	if (n > m) {
		[a, b] = [b, a];
		[m, n] = [n, m];
	}

	let previousRow: number[] = Array.from({ length: n + 1 }, (_, i) => i);
	let currentRow: number[] = Array(n + 1).fill(0);

	for (let i = 1; i <= m; i++) {
		currentRow[0] = i;
		for (let j = 1; j <= n; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			currentRow[j] = Math.min(
				(previousRow[j] as number) + 1, // deletion
				(currentRow[j - 1] as number) + 1, // insertion
				(previousRow[j - 1] as number) + cost // substitution
			);
		}
		// Swap rows for the next iteration
		[previousRow, currentRow] = [currentRow, previousRow];
	}

	return previousRow[n] as number;
}

export interface Suggestion {
	value: string;
	distance: number;
}

/**
 * Provides "did you mean?" suggestions based on user input and a list of options.
 *
 * @param userInput The string provided by the user.
 * @param options The list of valid strings to compare against.
 * @param threshold The maximum Levenshtein distance for a suggestion to be considered.
 * @param ignoreCase Whether to ignore case during comparison.
 * @returns An array of suggested options, sorted by distance.
 */
export function getSuggestions(
	userInput: string,
	options: string[],
	threshold: number = 2, // Default threshold, adjust as needed
	ignoreCase: boolean = true
): Suggestion[] {
	const normalizedUserInput = ignoreCase
		? userInput.toLowerCase()
		: userInput;
	const suggestions: Suggestion[] = [];

	for (const option of options) {
		const normalizedOption = ignoreCase ? option.toLowerCase() : option;
		const distance = levenshteinDistance(
			normalizedUserInput,
			normalizedOption
		);

		if (distance <= threshold) {
			suggestions.push({ value: option, distance: distance });
		}
	}

	// Sort suggestions by distance (smallest distance first)
	return suggestions.sort((a, b) => a.distance - b.distance);
}

export function colorToken(token: ExtendedToken): string {
	if (token.type.in(TokenType.LeftBrace, TokenType.RightBrace))
		return `\x1b[38;5;215m${token.text}\x1b[0m`;
	else if (
		token.type.in(TokenType.LeftParenthesis, TokenType.RightParenthesis)
	)
		return `\x1b[38;5;27m${token.text}\x1b[0m`;
	else if (token.type.in(TokenType.LeftBracket, TokenType.RightBracket))
		return `\x1b[38;5;215m${token.text}\x1b[0m`;
	else if (token.isOperator()) return `\x1b[38;5;77m${token.text}\x1b[0m`;
	else if (token.isCommand()) return `\x1b[35m${token.text}\x1b[0m`;
	else if (token.type == TokenType.Directive)
		return `\x1b[36m${token.text}\x1b[0m`;
	else if (token.type == TokenType.Number)
		return `\x1b[93m${token.text}\x1b[0m`;
	else if (token.type == TokenType.SingleLineComment)
		return `\x1b[30m${token.text}\x1b[0m`;
	return token.text;
}

export function renderCodeBlock(
	tokens: ExtendedToken[],
	showHiddenSymbols: boolean = false,
	fromLine: number = 1,
	toLine?: number,
	messages: {
		content: string;
		line: number;
		column: number;
		length: number;
	}[] = [],
	title?: string
) {
	const lines: string[][] = [];
	let line: string[] = [];
	for (const token of tokens) {
		if (token.type == TokenType.LineSeparator) {
			const count = token.text.length;
			for (let i = 0; i < count; i++) {
				if (showHiddenSymbols) {
					if (token.isIrrelevant()) {
						line.push('\x1b[30m␤\x1b[0m');
					} else {
						if (i == 0) {
							line.push('\x1b[30m⏎\x1b[0m');
						} else {
							line.push('\x1b[30m↧\x1b[0m');
						}
					}
				}
				lines.push(line);
				line = [];
			}
			continue;
		} else if (token.type == TokenType.Space) {
			if (showHiddenSymbols) {
				line.push(`\x1b[30m${'·'.repeat(token.text.length)}\x1b[0m`);
				continue;
			}
		}
		line.push(colorToken(token));
	}
	if (line.length > 0) {
		lines.push(line);
	}

	const lineNumberCharCount = String(lines.length + 1).length;
	let code = '';
	if (title) {
		const leftFiller =
			' '.repeat(lineNumberCharCount) +
			' \x1b[30m ╭─┤ ' +
			title +
			' \x1b[30m\x1b[0m';
		code += leftFiller + '\n';
		if (fromLine != 1) {
			code += ' '.repeat(lineNumberCharCount) + '\x1b[30m⌃ │ \x1b[0m\n';
		} else {
			code += ' '.repeat(lineNumberCharCount) + ' \x1b[30m │ \x1b[0m\n';
		}
	}
	for (let i = 1; i <= lines.length; i++) {
		if (i < fromLine) {
			continue;
		}
		if (toLine && i >= toLine) {
			break;
		}
		const line = lines[i - 1] as string[];
		const padding = lineNumberCharCount - String(i).length;
		const lineNumber = ' '.repeat(padding) + ` \x1b[30m${i}` + ' │ \x1b[0m';
		const lineContent = lineNumber + line.join('');
		code += lineContent + '\n';
		const lineMessages = messages.filter((message) => message.line == i);
		for (const message of lineMessages) {
			const leftFiller =
				' '.repeat(lineNumberCharCount) + '\x1b[30m· │ \x1b[0m';
			const columnFiller = ' '.repeat(message.column - 1);
			const top =
				'\x1b[31m┬' + '─'.repeat(message.length - 1) + '\x1b[0m';
			const messageLine = leftFiller + columnFiller + top;
			code += messageLine + '\n';
			const fullMessage = `[ ${message.content} ]`;
			const messageLength = fullMessage.length + 1;
			if (messageLength < message.column) {
				const padding = message.column - messageLength;
				code +=
					leftFiller +
					'\x1b[31m' +
					' '.repeat(message.length + padding) +
					fullMessage +
					'─┘\x1b[0m' +
					'\n';
			} else {
				code +=
					leftFiller +
					'\x1b[31m' +
					' '.repeat(message.column - 1) +
					'└─' +
					fullMessage +
					'\x1b[0m\n';
			}
		}
	}
	if (toLine && toLine != lines.length + 1) {
		code += ' '.repeat(lineNumberCharCount) + '\x1b[30m⌄ │ \x1b[0m\n';
	}
	return code;
}
