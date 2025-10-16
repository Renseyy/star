import { MetaRegister } from '../metaRegister';
import { ExtendedToken } from '../parser/extendedToken';
import { TokenType, type Token } from '../tokenizer/token';
import { ScopeStack, type Scope } from './scope';

/**
 * Got MetaScope, and applies it to some tokens like objects or commands
 * notise that we also partially support directives #define_operator and #define_command
 *
 * That directives cannot be placed mannualy, remember that
 *
 * Scopes are resolved in very simple way: each { starts new scope and each } ends scope
 *
 */

/**
 * @todo Dodać wsparcie dla dyrektyw #define_operator i #define_command
 */
export class Scoper {
	public resolveScopes(tokens: Token[], scope: Scope = {}): ExtendedToken[] {
		let scopeStack = new ScopeStack(scope);
		let line = 1;
		let column = 1;
		let isSkipped = false;
		let nextLineIsIrrelevant = false;
		const resultTokens: ExtendedToken[] = [];
		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i] as Token;
			if (token.type == 'LeftBrace') {
				scopeStack.push({});
			} else if (token.type == 'RightBrace') {
				scopeStack.pop();
			} else if (token.type == TokenType.Space) {
				resultTokens.push(
					ExtendedToken(token, isSkipped, line, column)
				);
				isSkipped = true;
				if (token.content == 'newline') {
					line++;
					column = 1;
				}
				continue;
			}
			if (token.type == TokenType.EndOfLine) {
				line++;
				column = 1;
			} else if (token.type == 'Identifier') {
				const element = scopeStack.get(token.text);
				if (element && element != null) {
					const extendedToken = ExtendedToken(
						token,
						isSkipped,
						line,
						column
					);
					if (element == 'command') {
						extendedToken.tags.push('command');
					} else {
						if (element.ignoresLineAfter) {
							nextLineIsIrrelevant = true;
						}
						if (element.ignoresLineBefore) {
							const last = resultTokens[resultTokens.length - 1];
							if (!last) continue;
							if (last.type == TokenType.EndOfLine)
								last.tags.push('irrelevant');
						}
						extendedToken.tags.push('operator');
					}
					isSkipped = false;
					resultTokens.push(extendedToken);
					continue;
				}
			}
			nextLineIsIrrelevant = false;
			resultTokens.push(ExtendedToken(token, isSkipped, line, column));
			isSkipped = false;
		}
		return resultTokens;
	}
}
