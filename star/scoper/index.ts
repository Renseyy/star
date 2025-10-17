import { MetaRegister } from '../metaRegister';
import { ExtendedToken } from './extendedToken';
import { FLAGS, TokenType, type Token } from '../tokenizer/token';
import { ScopeStack, type Scope } from './scope';

/**
 * Got MetaScope, and applies it to some tokens like objects or commands
 * notise that we also partially support directives #declare_operator and #declare_command
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
		let nextIsIrrelevant = false;
		const resultTokens: ExtendedToken[] = [];
		const getLastIgnoringSpaces = () => {
			for (let i = resultTokens.length - 1; i >= 0; i--) {
				const token = resultTokens[i] as ExtendedToken;
				if (token.type == TokenType.Space) {
					continue;
				}
				return token;
			}
			return null;
		};
		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i] as Token;
			// Irrelevant tokens
			if (i == 0 || i == tokens.length - 1) {
				nextIsIrrelevant = true;
			}
			if (
				token.type.in(
					TokenType.RightBrace,
					TokenType.RightBracket,
					TokenType.RightParenthesis,
					TokenType.Semicolon,
					TokenType.Comma
				)
			) {
				const last = getLastIgnoringSpaces();
				if (last) {
					last.flags |= FLAGS.IS_IRRELEVANT;
				}
			}
			if (token.type == 'LeftBrace') {
				scopeStack.push({});
			} else if (token.type == 'RightBrace') {
				scopeStack.pop();
			} else if (token.type == TokenType.Space) {
				const resultToken = ExtendedToken(
					token,
					isSkipped,
					line,
					column
				);

				isSkipped = true;
				resultTokens.push(resultToken);
				column += token.text.length;
				continue;
			} else if (token.type == TokenType.LineSeparator) {
				const resultToken = ExtendedToken(
					token,
					isSkipped,
					line,
					column
				);
				if (nextIsIrrelevant) {
					resultToken.flags |= FLAGS.IS_IRRELEVANT;
				}

				isSkipped = false;
				nextIsIrrelevant = false;
				line++;
				column = 1;
				resultTokens.push(resultToken);
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
					column += token.text.length;
					if (element == 'command') {
						extendedToken.flags |= FLAGS.IS_COMMAND;
					} else {
						if (element.ignoresLineAfter) {
							nextIsIrrelevant = true;
						}
						if (element.ignoresLineBefore) {
							const last = getLastIgnoringSpaces();
							if (!last) continue;
							if (last.type == TokenType.Space)
								last.flags |= FLAGS.IS_IRRELEVANT;
						}
						extendedToken.flags |= FLAGS.IS_OPERATOR;
					}
					nextIsIrrelevant = false;
					isSkipped = false;
					resultTokens.push(extendedToken);
					continue;
				}
			}
			nextIsIrrelevant = token.type.in(
				TokenType.LeftBrace,
				TokenType.LeftBracket,
				TokenType.LeftParenthesis,
				TokenType.Semicolon,
				TokenType.Comma
			);

			resultTokens.push(ExtendedToken(token, isSkipped, line, column));
			column += token.text.length;
			isSkipped = false;
		}
		return resultTokens;
	}
}
