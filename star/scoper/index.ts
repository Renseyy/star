import { MetaRegister } from '../metaRegister';
import { ExtendedToken } from '../parser/extendedToken';
import { FLAGS, TokenType, type Token } from '../tokenizer/token';
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
				const next = tokens[i + 1];
				const isIrrelevant = i == 0 || i == tokens.length - 1;
				if (isIrrelevant) {
					token.flags |= FLAGS.IS_IRRELEVANT;
				}
				resultTokens.push(
					ExtendedToken(token, isSkipped, line, column)
				);
				isSkipped = true;
				if (token) {
					line++;
					column = 1;
				}
				continue;
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
						extendedToken.flags |= FLAGS.IS_COMMAND;
					} else {
						if (element.ignoresLineAfter) {
							nextLineIsIrrelevant = true;
						}
						if (element.ignoresLineBefore) {
							const last = resultTokens[resultTokens.length - 1];
							if (!last) continue;
							if (last.type == TokenType.Space)
								last.tags.push('irrelevant');
						}
						extendedToken.flags |= FLAGS.IS_OPERATOR;
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
