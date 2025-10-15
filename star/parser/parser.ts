import type { Block } from 'typescript';
import type { Extrans } from '../core/extrans';
import type { Directive, HashCommands } from '../directive';
import { Token, TokenType } from '../tokenizer/token';
import { Key, CollectionKey, MetaRegister } from '../metaRegister';
import { staticDirectives } from '../staticDirectives';
import type { MemoryExpressions } from '../Expression/memory';
import { colorToken, getSuggestions, type Suggestion } from '../utils';
import { ExtendedToken } from './extendedToken';

export const defaultConstructorSymbol = Symbol('defaultConstructor');
export const defaultIntegerArchetypeSymbol = Symbol('defaultIntegerArchetype');
export type defaultIntegerArchetypeType = typeof defaultIntegerArchetypeSymbol;
export type defaultConstructorType = typeof defaultConstructorSymbol;
/**
 * Add support for decorations and directives,
 * - members, function calls, incontexts and indexers,
 */

export type Atom = {
	isLineJoiner?: true;
	isTransparent?: true;
	$type: 'Atom';
	value: string;
};

export type Command = {
	$type: 'Command';
	constructor: ArgumentedExpression<Expression[]>;
};

export type OperatorGroup = {
	isLineJoiner?: true;
	$type: 'OperatorGroup';
	prefix: null | {
		expression: ArgumentedExpression<[Expression]>;
		bindingPower: bindingPower;
	};
	infix: null | {
		expression: ArgumentedExpression<[Expression, Expression]>;
		bindingPower: bindingPower;
		isRightBinded: boolean;
	};
	postfix: null | {
		expression: ArgumentedExpression<[Expression]>;
		bindingPower: bindingPower;
	};
};

export type UnaryOperator = {
	$: 'UnaryOperator';
	bindingPower: bindingPower;
	expression: ArgumentedExpression<[Expression]>;
};

export function UnaryOperator(
	bindingPower: bindingPower,
	expression: ArgumentedExpression<[Expression]>
): UnaryOperator {
	return {
		$: 'UnaryOperator',
		bindingPower,
		expression,
	};
}

export type InfixOperator = {
	$: 'InfixOperator';
	bindingPower: bindingPower;
	isRightBinded: boolean;
	expression: ArgumentedExpression<[Expression, Expression]>;
};

export function InfixOperator(
	bindingPower: bindingPower,
	expression: ArgumentedExpression<[Expression, Expression]>,
	isRightBinded: boolean = false
): InfixOperator {
	return {
		$: 'InfixOperator',
		bindingPower,
		expression,
		isRightBinded,
	};
}

export type ExpressionHolder = {
	$type: 'ExpressionHolder';
	expression: Expression;
};

export type Archetype = {
	$type: 'Archetype';
	expression: Expression;
};

export type ScopeElement =
	| Command
	| OperatorGroup
	| ExpressionHolder
	| Atom
	| Archetype;

//TODO: dodać rejestr pamięci i układanie zgodnie z nim wartości
export class Memory {
	private registry: Record<string, string> = {};
}

export type MetaScopeRegistrySymbolsType =
	| defaultConstructorType
	| defaultIntegerArchetypeType;

export type MetaScopeRegistryKey = MetaScopeRegistrySymbolsType | string;

export type MetaScopeRegistry = {
	[defaultConstructorSymbol]?: Archetype;
	[defaultIntegerArchetypeSymbol]?: Archetype;
} & Record<string, Record<string, ScopeElement>>;

export type ArgumentedExpression<Args extends Expression[]> = {
	$: 'ArgumentedExpression';
	creator: (...args: Args) => Expression;
};

export type LiteralExpression = {
	$: 'LiteralExpression';
	contentType: string;
	value: string;
};

export type BlockExpression = {
	$: 'BlockExpression';
	expressions: Expression[];
};

export type IdentifierExpression = {
	$: 'IdentifierExpression';
	name: string;
};

export function Identifier(name: string): IdentifierExpression {
	return {
		$: 'IdentifierExpression',
		name,
	};
}

export type TemporaryOperatorExpression = {
	$: 'TemporaryOperatorExpression';
	expressions: Expression[];
	name: string;
	info: string;
};

export type GroupExpression = {
	$: 'GroupExpression';
	expressions: Expression[];
};

export function GroupExpression(...expressions: Expression[]): GroupExpression {
	return {
		$: 'GroupExpression',
		expressions,
	};
}

export type CallCommandExpression = {
	$: 'CallCommandExpression';
	command: Command;
	arguments: Expression[];
};

export type UnresolvedExpression = {
	$: 'UnresolvedExpression';
	resolve: (...args: Expression[]) => Expression;
};

export type Directive = {
	$: 'Directive';
	name: string;
	arguments: Expression[];
};

export type ScopedExpressions = {
	$: 'ScopedExpressions';
	scope: MetaRegister;
	expressions: Expression[];
};

export type Call = {
	$: 'Call';
	callee: Expression;
	argumentBlock: Expression;
};

export function Call(callee: Expression, argumentBlock: Expression): Call {
	return {
		$: 'Call',
		callee,
		argumentBlock,
	};
}

export type BuildExpression = {
	$: 'BuildExpression';
	context: Expression;
	expressions: Expression[];
};

export type IndexExpression = {
	$: 'IndexExpression';
	context: Expression;
	expressions: Expression[];
};

export function IndexExpression(
	context: Expression,
	expressions: Expression[]
): IndexExpression {
	return {
		$: 'IndexExpression',
		context,
		expressions,
	};
}

export type MemberExpression = {
	$: 'MemberExpression';
	parent: Expression | null;
	member: Expression;
};

export function MemberExpression(
	parent: Expression | null,
	member: Expression
): MemberExpression {
	return {
		$: 'MemberExpression',
		parent,
		member,
	};
}

export type TodoExpression = {
	$: 'TodoExpression';
	expressions: Expression[];
};

export function TodoExpression(...expressions: Expression[]): TodoExpression {
	return {
		$: 'TodoExpression',
		expressions,
	};
}

export type MetaArchetypeOf = {
	$: '#ArchetypeOf';
	expression: Expression;
};

export function MetaArchetypeOf(expression: Expression): MetaArchetypeOf {
	return {
		$: '#ArchetypeOf',
		expression,
	};
}

export type Operator = {
	$: 'Operator';
	name: string;
};

export function Operator(name: string): Operator {
	return {
		$: 'Operator',
		name,
	};
}

export type Expression =
	| LiteralExpression
	| BlockExpression
	| GroupExpression
	| IdentifierExpression
	| TemporaryOperatorExpression
	| ArgumentedExpression<any>
	| CallCommandExpression
	| BuildExpression
	| Call
	| MemberExpression
	| TodoExpression
	| MetaArchetypeOf
	| Operator
	| IndexExpression
	| MemoryExpressions;

export class Decoration {}

export const maxBindingPower = Symbol();
export type maxBindingPower = typeof maxBindingPower;

export type bindingPower = number | maxBindingPower;

export function isGreaterThan(a: bindingPower, b: bindingPower) {
	if (a === b && b === maxBindingPower) return false;
	if (a === maxBindingPower) return true;
	if (b === maxBindingPower) return false;
	return a > b;
}

// Ten parser ma za zadanie zmienić poszczególne elementy na wyrażenia - posiadając już wiedzę o odpowienich operatorach
export class Parser {
	private tokens: ExtendedToken[] = [];
	private index = 0;
	public decorations: Decoration[] = [];

	private throwTokenError(
		token: ExtendedToken,
		message: string,
		suggestions: Suggestion[] = []
	) {
		// Collect tokens from line
		const tokens = [];
		// Calculate all tokens before - to end of line or start
		for (let i = this.index - 1; i >= 0; i--) {
			const token = this.tokens[i];
			if (!token) {
				break;
			}
			if (token.type == TokenType.EndOfLine) break;
			if (
				token.type == TokenType.IrrelevantToken &&
				token.content == 'newline'
			)
				break;
			tokens.unshift(token);
		}

		const location = tokens.reduce(
			(acc, token) => acc + token.text.length,
			0
		);
		tokens.push(token);
		for (let i = this.index + 1; i < this.tokens.length; i++) {
			const token = this.tokens[i];
			if (!token) break;
			if (token.type == TokenType.EndOfLine) break;
			if (
				token.type == TokenType.IrrelevantToken &&
				token.content == 'newline'
			)
				break;
			tokens.push(token);
		}
		console.error('Parser error:\n');
		const prefix = `${token.line} | `;
		const line = `${prefix}\x1b[37m${tokens
			.map((t) => colorToken(t))
			.join('')}\x1b[0m`;
		console.error(line);
		const filler =
			'\x1b[31m┬' + '─'.repeat(token.text.length - 1) + '\x1b[0m';
		console.error(' '.repeat(location + prefix.length) + filler);
		const fullMessage = `[ ${message} ]`;
		const messageLength = fullMessage.length + 1;
		if (messageLength < location) {
			const padding = location - messageLength;
			console.error(
				'\x1b[31m' +
					' '.repeat(prefix.length + padding) +
					fullMessage +
					'─┘\x1b[0m'
			);
		} else {
			console.error(
				' '.repeat(location + prefix.length) + '└─' + fullMessage
			);
		}
		console.error();
		if (suggestions.length > 0) {
			console.error('\x1b[33mSimilar options:\x1b[0m');
			for (const suggestion of suggestions) {
				console.error(` \x1b[37m- ${suggestion.value}\x1b[0m`);
			}
			console.error();
		}
		process.exit(-1);
	}

	private loadTokens(tokens: Token[]) {
		let isSkipped = false;
		let line = 1;
		let column = 1;
		for (const token of tokens) {
			if (token.type == 'IrrelevantToken') {
				this.tokens.push(ExtendedToken(token, isSkipped, line, column));
				isSkipped = true;
				if (token.content == 'newline') {
					line++;
					column = 1;
				}
				continue;
			}
			this.tokens.push(ExtendedToken(token, isSkipped, line, column));
			isSkipped = false;
			if (token.type == TokenType.EndOfLine) {
				line++;
				column = 1;
			}
		}
	}

	public getCurrentToken(forTest: true): ExtendedToken | null;
	public getCurrentToken(forTest?: false): ExtendedToken;
	public getCurrentToken(forTest: boolean = false): ExtendedToken | null {
		let token = this.tokens[this.index];
		if (token?.isIrrelevant()) {
			this.index++;
			return this.getCurrentToken(forTest as any);
		}
		if (forTest) {
			return token ?? null;
		}
		if (!token) {
			throw new Error('Unexpected end of input');
		}
		return token;
	}

	public hasToken(): boolean {
		return this.index < this.tokens.length;
	}

	private parseDirective = {
		define: (register: MetaRegister) => {
			this.index++;
			const name = this.parseElement(register);
			if (name.$ != 'IdentifierExpression')
				throw new Error(
					`Unexpected token ${name.$}, expected IdentifierExpression`
				);
			const nameIdentifier = name.name;

			const value = this.parseElement(register);
			return {
				type: 'Directive',
				name: 'declare',
				arguments: [name],
			};
		},
		...staticDirectives(this),
	};

	public parseBlock(
		register: MetaRegister,
		isTransparent: boolean = false
	): BlockExpression {
		const innerRegister = isTransparent
			? register
			: new MetaRegister(register);

		// Eat {
		this.index++;
		const expressions = this.parseInner(
			innerRegister,
			TokenType.RightBrace
		);
		this.index++;
		return {
			$: 'BlockExpression',
			expressions: expressions,
		};
	}

	public parseScope(register: MetaRegister): MetaRegister {
		const innerRegister = new MetaRegister(register);
		this.parseBlock(innerRegister, true);
		return innerRegister;
	}

	private parseCallBlock(
		register: MetaRegister,
		isTransparent: boolean = false
	): BlockExpression {
		this.index++;
		const expressions = this.parseInner(
			register,
			TokenType.RightParenthesis
		);
		this.index++;
		return {
			$: 'BlockExpression',
			expressions: expressions,
		};
	}

	private parseIndexBlock(
		register: MetaRegister,
		isTransparent: boolean = false
	): BlockExpression {
		this.index++;
		const expressions = this.parseInner(register, TokenType.RightBracket);
		this.index++;
		return {
			$: 'BlockExpression',
			expressions: expressions,
		};
	}

	private parseIdentifier(): Expression {
		const token = this.getCurrentToken();
		this.index++;
		return {
			$: 'IdentifierExpression',
			name: token.text,
		};
	}

	private parseMaybePrefixOperator(
		register: MetaRegister
	): null | Expression {
		const token: Token = this.getCurrentToken();
		const name = token.text;
		const prefixOperator = register.readElement(
			CollectionKey('prefixOperator', name)
		);
		if (prefixOperator) {
			const bindingPower = prefixOperator.bindingPower;
			const argument = this.parseExpression(register, bindingPower);
			return prefixOperator.expression.creator(argument);
		} // Ad support for atoms
		return null;
	}

	public parseElement(register: MetaRegister): Expression {
		let currentToken = this.getCurrentToken();
		if (['Number', 'String'].includes(currentToken.type)) {
			this.index++;
			return {
				$: 'LiteralExpression',
				contentType: currentToken.type,
				value: currentToken.content || currentToken.text,
			};
		} else if (currentToken.type == TokenType.LeftBrace) {
			return this.parseBlock(register);
		} else if (currentToken.type == TokenType.LeftParenthesis) {
			const defaultConstructor = register.readElement(
				Key('defaultConstructorArchetype')
			);
			if (!defaultConstructor) {
				throw new Error('Cannot get default constructor');
			}
			return {
				$: 'Call',
				callee: defaultConstructor,
				argumentBlock: this.parseCallBlock(register),
			};
		} else if (currentToken.type == TokenType.LeftBracket) {
			const defaultConstructor = register.readElement(
				Key('defaultIndexerArchetype')
			);
			if (!defaultConstructor) {
				throw new Error('Cannot get default indexer');
			}
			const block = this.parseIndexBlock(register);
			return IndexExpression(defaultConstructor, block.expressions);
		} else if (currentToken.type == 'Identifier') {
			return (
				this.parseMaybePrefixOperator(register) ??
				this.parseIdentifier()
			);
		} else if (currentToken.type == TokenType.Directive) {
			const directive = currentToken.content as string;
			const parseFunction =
				this.parseDirective[
					directive as keyof typeof this.parseDirective
				];

			if (parseFunction) {
				this.index++;
				return parseFunction(register);
			}
			const directives = Object.keys(this.parseDirective);
			const suggestions = getSuggestions(directive, directives, 3);
			this.throwTokenError(
				currentToken,
				`Undefined directive "${currentToken.content}"`,
				suggestions
			);
		}
		this.throwTokenError(
			currentToken,
			`Undefined token "${currentToken.type}"`
		);
	}
	/**
	 * @mutates elements
	 */

	public parseExpression(
		register: MetaRegister,
		rightBindingPower: bindingPower = 0
	): Expression {
		let left = this.parseElement(register);
		while (this.shouldParseInfixOrPostfix(register)) {
			const token = this.getCurrentToken(true);
			if (!token) break;
			if (token.type == TokenType.Comma) {
				const expressions = [left];
				this.index++;
				const right = this.parseExpression(register);
				if (right.$ == 'GroupExpression') {
					expressions.push(...right.expressions);
				} else {
					expressions.push(right);
				}
				left = {
					$: 'GroupExpression',
					expressions,
				};
				continue;
			} else if (
				token.type == TokenType.LeftBrace &&
				isGreaterThan(maxBindingPower, rightBindingPower)
			) {
				const right = this.parseBlock(register);
				left = {
					$: 'BuildExpression',
					context: left,
					expressions: right.expressions,
				};
				continue;
			} else if (
				!token.skipped &&
				token.type == TokenType.LeftBracket &&
				isGreaterThan(maxBindingPower, rightBindingPower)
			) {
				const right = this.parseIndexBlock(register);
				left = IndexExpression(left, right.expressions);
				continue;
			} else if (
				!token.skipped &&
				token.type == TokenType.LeftParenthesis &&
				isGreaterThan(maxBindingPower, rightBindingPower)
			) {
				const right = this.parseCallBlock(register);
				left = {
					$: 'Call',
					callee: left,
					argumentBlock: right,
				};
				continue;
			}
			if (token.type != TokenType.Identifier) break;
			const postfixOperator = register.readElement(
				CollectionKey('prefixOperator', token.text)
			);
			if (postfixOperator != null) {
				const bindingPower = postfixOperator.bindingPower;
				if (isGreaterThan(bindingPower, rightBindingPower)) {
					left = postfixOperator.expression.creator(left);
					this.index++;
					continue;
				}
			}
			const infixOperator = register.readElement(
				CollectionKey('infixOperator', token.text)
			);
			if (infixOperator != null) {
				const bindingPower = infixOperator.bindingPower;
				if (
					isGreaterThan(bindingPower, rightBindingPower) ||
					(bindingPower == rightBindingPower &&
						infixOperator.isRightBinded)
				) {
					this.index++;
					const right = this.parseExpression(register, bindingPower);
					left = infixOperator.expression.creator(left, right);
					continue;
				}
			}
			break;
		}
		return left;
	}

	public shouldParseInfixOrPostfix(register: MetaRegister): boolean {
		const token = this.getCurrentToken(true);
		if (!token) return false;
		if (
			token.type.in(
				TokenType.Comma,
				TokenType.LeftBrace,
				TokenType.LeftParenthesis,
				TokenType.LeftBracket
			)
		)
			return true;
		if (token.type != TokenType.Identifier) return false;
		const infixOperator = register.readElement(
			CollectionKey('infixOperator', token.text)
		);
		if (infixOperator != null) return true;
		const postfixOperator = register.readElement(
			CollectionKey('postfixOperator', token.text)
		);
		return postfixOperator != null;
	}

	private parseInner(
		register: MetaRegister,
		endType?: TokenType
	): Expression[] {
		const expressions: Expression[] = [];
		for (
			let token = this.getCurrentToken(true);
			token != null && (!endType || token.type != endType);
			token = this.getCurrentToken(true)
		) {
			const expression = this.parseExpression(register);
			expressions.push(expression);
			if (!endType) {
				if (!this.hasToken()) break;
			}
			token = this.getCurrentToken();
			if (token.type.in(TokenType.Semicolon, TokenType.EndOfLine)) {
				this.index++;
			} else if (!endType || (endType && token.type != endType)) {
				this.throwTokenError(token, `Unexpected token`);
			}
		}
		return expressions;
	}

	public parse(
		extendedToken: ExtendedToken[],
		register: MetaRegister = new MetaRegister()
	): BlockExpression {
		this.tokens = extendedToken;
		this.index = 0;
		return {
			$: 'BlockExpression',
			expressions: this.parseInner(register),
		};
	}
}
