import type { ExtendedToken } from './parser/extendedToken';
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
				previousRow[j] + 1, // deletion
				currentRow[j - 1] + 1, // insertion
				previousRow[j - 1] + cost // substitution
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
	return token.text;
}

export function renderCodeBlock(tokens: ExtendedToken[]) {
	let code = '';
	for (const token of tokens) {
		code += colorToken(token);
	}
	return code;
}
