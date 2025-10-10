import type { Block } from 'typescript';
import type { Extrans } from './core/extrans';
import type { Directive, HashCommands } from './directive';
import { Token, TokenType } from './token';
import { Key, CollectionKey, MetaRegister } from './metaRegister';

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

export type InfixOperator = {
	$: 'InfixOperator';
	bindingPower: bindingPower;
	isRightBinded: boolean;
	expression: ArgumentedExpression<[Expression, Expression]>;
};

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
	type: 'ArgumentedExpression';
	creator: (...args: Args) => Expression;
};

export type LiteralExpression = {
	type: 'LiteralExpression';
	contentType: string;
	value: string;
};

export type BlockExpression = {
	type: 'BlockExpression';
	expressions: Expression[];
};

export type IdentifierExpression = {
	type: 'IdentifierExpression';
	name: string;
};

export function Identifier(name: string): IdentifierExpression {
	return {
		type: 'IdentifierExpression',
		name,
	};
}

export type TemporaryOperatorExpression = {
	type: 'TemporaryOperatorExpression';
	expressions: Expression[];
	name: string;
	info: string;
};

export type GroupExpression = {
	type: 'GroupExpression';
	expressions: Expression[];
};

export function GroupExpression(...expressions: Expression[]): GroupExpression {
	return {
		type: 'GroupExpression',
		expressions,
	};
}

export type CallCommandExpression = {
	type: 'CallCommandExpression';
	command: Command;
	arguments: Expression[];
};

export type UnresolvedExpression = {
	type: 'UnresolvedExpression';
	resolve: (...args: Expression[]) => Expression;
};

export type Directive = {
	type: 'Directive';
	name: string;
	arguments: Expression[];
};

export type ScopedExpressions = {
	type: 'ScopedExpressions';
	scope: MetaRegister;
	expressions: Expression[];
};

export type Call = {
	type: 'Call';
	callee: Expression;
	argumentBlock: Expression;
};

export function Call(callee: Expression, argumentBlock: Expression): Call {
	return {
		type: 'Call',
		callee,
		argumentBlock,
	};
}

export type BuildExpression = {
	type: 'BuildExpression';
	context: Expression;
	expressions: Expression[];
};

export type MemberOf = {
	type: 'MemberOf';
	parent: Expression | null;
	member: Expression;
};

export function MemberOf(
	parent: Expression | null,
	member: Expression
): MemberOf {
	return {
		type: 'MemberOf',
		parent,
		member,
	};
}

export type TodoExpression = {
	type: 'TodoExpression';
	expressions: Expression[];
};

export function TodoExpression(...expressions: Expression[]): TodoExpression {
	return {
		type: 'TodoExpression',
		expressions,
	};
}

export type MetaArchetypeOf = {
	type: '#ArchetypeOf';
	expression: Expression;
};

export function MetaArchetypeOf(expression: Expression): MetaArchetypeOf {
	return {
		type: '#ArchetypeOf',
		expression,
	};
}

export type Operator = {
	type: 'Operator';
	name: string;
};

export function Operator(name: string): Operator {
	return {
		type: 'Operator',
		name,
	};
}

export type Expression =
	| LiteralExpression
	| BlockExpression
	| GroupExpression
	| IdentifierExpression
	| Directive
	| TemporaryOperatorExpression
	| ArgumentedExpression<any>
	| CallCommandExpression
	| HashCommands
	| BuildExpression
	| Extrans
	| Call
	| MemberOf
	| TodoExpression
	| MetaArchetypeOf
	| Operator;

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

export class ExtendedToken extends Token {
	skipped: boolean;

	public constructor(token: Token, isSkipped: boolean) {
		super(token.type, token.text, token.index, token.content);
		this.skipped = isSkipped;
	}
}

// Ten parser ma za zadanie zmienić poszczególne elementy na wyrażenia - posiadając już wiedzę o odpowienich operatorach
export class Parser {
	private tokens: ExtendedToken[] = [];
	private index = 0;
	public decorations: Decoration[] = [];

	private loadTokens(tokens: Token[]) {
		let isSkipped = false;
		for (const token of tokens) {
			if (token.type == 'IrrelevantToken') {
				isSkipped = true;
				continue;
			}
			this.tokens.push(new ExtendedToken(token, isSkipped));
			isSkipped = false;
		}
	}

	private getCurrentToken(forTest: true): ExtendedToken | null;
	private getCurrentToken(forTest?: false): ExtendedToken;
	private getCurrentToken(forTest: boolean = false): ExtendedToken | null {
		let token = this.tokens[this.index];
		if (forTest) {
			return token ?? null;
		}
		if (!token) {
			throw new Error('Unexpected end of input');
		}
		return token;
	}

	private hasToken(): boolean {
		return this.index < this.tokens.length;
	}

	private parseDirective = {
		define: (register: MetaRegister) => {
			this.index++;
			const name = this.parseElement(register);
			if (name.type != 'IdentifierExpression')
				throw new Error(
					`Unexpected token ${name.type}, expected IdentifierExpression`
				);
			const nameIdentifier = name.name;

			const value = this.parseElement(register);
			return {
				type: 'Directive',
				name: 'declare',
				arguments: [name],
			};
		},
	};

	private parseBlock(
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
			type: 'BlockExpression',
			expressions: expressions,
		};
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
			type: 'BlockExpression',
			expressions: expressions,
		};
	}

	private parseIdentifier(): Expression {
		const token = this.getCurrentToken();
		this.index++;
		return {
			type: 'IdentifierExpression',
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

	private parseElement(register: MetaRegister): Expression {
		let currentToken = this.getCurrentToken();
		if (['Number', 'String'].includes(currentToken.type)) {
			this.index++;
			return {
				type: 'LiteralExpression',
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
				type: 'Call',
				callee: defaultConstructor,
				argumentBlock: this.parseCallBlock(register),
			};
		} else if (currentToken.type == 'Identifier') {
			return (
				this.parseMaybePrefixOperator(register) ??
				this.parseIdentifier()
			);
		} else if (currentToken.type == TokenType.Directive) {
			const parseFunction = this.parseDirective[currentToken.content];
			if (parseFunction) {
				return parseFunction(register);
			}
			throw new Error('Undefined directive ' + currentToken.content);
		}
		throw new Error('Unexpected token ' + currentToken.type);
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
				if (right.type == 'GroupExpression') {
					expressions.push(...right.expressions);
				} else {
					expressions.push(right);
				}
				left = {
					type: 'GroupExpression',
					expressions,
				};
				continue;
			} else if (
				!token.skipped &&
				token.type == TokenType.LeftBrace &&
				isGreaterThan(maxBindingPower, rightBindingPower)
			) {
				const right = this.parseBlock(register);
				left = {
					type: 'BuildExpression',
					context: left,
					expressions: right.expressions,
				};
				continue;
			} else if (
				!token.skipped &&
				token.type == TokenType.LeftParenthesis &&
				isGreaterThan(maxBindingPower, rightBindingPower)
			) {
				const right = this.parseCallBlock(register);
				left = {
					type: 'Call',
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
				TokenType.LeftParenthesis
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
			const expression = this.parseExpression(scope);
			expressions.push(expression);
			if (!endType) {
				if (!this.hasToken()) break;
			}
			token = this.getCurrentToken();
			if (token.type.in(TokenType.Semicolon, TokenType.EndOfLine)) {
				this.index++;
			} else if (!endType || (endType && token.type != endType)) {
				throw new Error(`Unexpected token ${token}`);
			}
		}
		return expressions;
	}

	public parse(
		tokens: Token[],
		register: MetaRegister = new MetaRegister()
	): BlockExpression {
		this.loadTokens(tokens);
		this.index = 0;
		return {
			type: 'BlockExpression',
			expressions: this.parseInner(register),
		};
	}
}
