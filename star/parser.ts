import type { Block } from 'typescript';
import type { Extrans } from './core/extrans';
import type { Directive, HashCommands } from './directive';
import { Token, TokenType } from './token';

export const defaultConstructorSymbol = Symbol('defaultConstructor');
export const defaultIntegerArchetypeSymbol = Symbol('defaultIntegerArchetype');
export type defaultIntegerArchetypeSymbol =
	typeof defaultIntegerArchetypeSymbol;

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

export type InfixOperator = {
	$type: 'InfixOperator';
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

export type MetaScopeRegistry = {
	[defaultConstructorSymbol]?: Archetype;
	[defaultIntegerArchetypeSymbol]?: Archetype;
} & Record<string, ScopeElement>;
export class MetaScope {
	private id = crypto.randomUUID();
	private registry: MetaScopeRegistry = {};
	constructor(public parent?: MetaScope) {}

	public readElement<Key extends keyof MetaScopeRegistry>(
		name: Key
	): NonNullable<MetaScopeRegistry[Key]> | null {
		if (this.registry[name]) return this.registry[name];
		if (this.parent) return this.parent.readElement(name);
		return null;
	}

	public writeElement(name: string, element: ScopeElement) {
		this.registry[name] = element;
	}

	/**
	 * Znajduje zasięg w którym obecnie zdefiniowana jest zmienna
	 * @param name
	 */
	public declarationScope(name: string): MetaScope | null {
		if (this.registry[name]) return this;
		if (this.parent) return this.parent.declarationScope(name);
		return null;
	}

	public declare(name: string, element: ScopeElement): void {
		this.registry[name] = element;
	}

	public __toString() {
		return `Scope#${this.id}`;
	}

	public toJSON() {
		return this.__toString();
	}

	public setDefaultConstructor(expression: Expression) {
		this.registry[defaultConstructorSymbol] = {
			$type: 'Archetype',
			expression,
		};
	}

	public getDefaultConstructor(): Expression {
		const defaultConstructor = this.readElement(defaultConstructorSymbol);
		if (defaultConstructor) {
			return defaultConstructor.expression;
		}
		throw new Error(`No default constructor`);
	}

	public getDefaultIntegerArchetype(): Expression {
		const defaultIntegerArchetype = this.readElement(
			defaultIntegerArchetypeSymbol
		);
		if (defaultIntegerArchetype) {
			return defaultIntegerArchetype.expression;
		}
		throw new Error(`No default integer archetype`);
	}
}

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

export function Group(...expressions: Expression[]): GroupExpression {
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
	scope: MetaScope;
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

export type ArchetypeOf = {
	type: 'ArchetypeOf';
	expression: Expression;
};

export function ArchetypeOf(expression: Expression): ArchetypeOf {
	return {
		type: 'ArchetypeOf',
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
	| ArchetypeOf
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

	// Scopes as a stack
	private scopes: MetaScope[] = [];

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
		declare: (scope: MetaScope) => {
			this.index++;
			const name = this.parseElement(scope);
			if (name.type != 'IdentifierExpression')
				throw new Error(
					`Unexpected token ${name.type}, expected IdentifierExpression`
				);
			const nameIdentifier = name.name;
			// scope.declare(nameIdentifier, {
			// 	$type: 'VariableHolder',
			// });
			return {
				type: 'Directive',
				name: 'declare',
				arguments: [name],
			};
		},
	};

	private parseBlock(
		scope: MetaScope,
		isTransparent: boolean = false
	): BlockExpression {
		const innerScope = isTransparent ? scope : new MetaScope(scope);

		// Eat {
		this.index++;
		const expressions = this.parseInner(innerScope, TokenType.RightBrace);
		this.index++;
		return {
			type: 'BlockExpression',
			expressions: expressions,
		};
	}

	private parseCallBlock(
		scope: MetaScope,
		isTransparent: boolean = false
	): BlockExpression {
		this.index++;
		const expressions = this.parseInner(scope, TokenType.RightParenthesis);
		this.index++;
		return {
			type: 'BlockExpression',
			expressions: expressions,
		};
	}

	private parseIdentifier(scope: MetaScope): Expression {
		const token = this.getCurrentToken();
		this.index++;
		return {
			type: 'IdentifierExpression',
			name: token.text,
		};
	}

	private parseMaybePrefixOperator(scope: MetaScope): null | Expression {
		const token: Token = this.getCurrentToken();
		const name = token.text;
		const element = scope.readElement(name);
		if (element?.$type == 'OperatorGroup') {
			if (element.prefix == null) return null;
			const bindingPower = element.prefix.bindingPower;
			const argument = this.parseExpression(scope, bindingPower);
			return element.prefix.expression.creator(argument);
		} else if (element?.$type == 'Atom') {
		}
		return null;
	}

	private parseElement(scope: MetaScope): Expression {
		let currentToken = this.getCurrentToken();
		if (['Number', 'String'].includes(currentToken.type)) {
			this.index++;
			return {
				type: 'LiteralExpression',
				contentType: currentToken.type,
				value: currentToken.content || currentToken.text,
			};
		} else if (currentToken.type == TokenType.LeftBrace) {
			return this.parseBlock(scope);
		} else if (currentToken.type == TokenType.LeftParenthesis) {
			const defaultConstructor = scope.getDefaultConstructor();
			return {
				type: 'Call',
				callee: defaultConstructor,
				argumentBlock: this.parseCallBlock(scope),
			};
		} else if (currentToken.type == 'Identifier') {
			return (
				this.parseMaybePrefixOperator(scope) ??
				this.parseIdentifier(scope)
			);
		} else if (currentToken.type == TokenType.Directive) {
			const parseFunction = this.parseDirective[currentToken.content];
			if (parseFunction) {
				return parseFunction(scope);
			}
			throw new Error('Undefined directive ' + currentToken.content);
		}
		throw new Error('Unexpected token ' + currentToken.type);
	}
	/**
	 * @mutates elements
	 */

	public parseExpression(
		scope: MetaScope,
		rightBindingPower: bindingPower = 0
	): Expression {
		let left = this.parseElement(scope);
		while (this.shouldParseInfixOrPostfix(scope)) {
			const token = this.getCurrentToken(true);
			if (!token) break;
			if (token.type == TokenType.Comma) {
				const expressions = [left];
				this.index++;
				const right = this.parseExpression(scope);
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
				const right = this.parseBlock(scope);
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
				const right = this.parseCallBlock(scope);
				left = {
					type: 'Call',
					callee: left,
					argumentBlock: right,
				};
				continue;
			}
			if (token.type != TokenType.Identifier) break;
			const operatorGroup = scope.readElement(token.text);
			if (!operatorGroup || operatorGroup.$type != 'OperatorGroup') {
				throw new Error(
					'PANIC: OperatorGroup not found - add error message in future'
				);
			}
			if (operatorGroup.postfix != null) {
				const bindingPower = operatorGroup.postfix.bindingPower;
				if (isGreaterThan(bindingPower, rightBindingPower)) {
					left = operatorGroup.postfix.expression.creator(left);
					this.index++;
					continue;
				}
			}
			if (operatorGroup.infix != null) {
				const bindingPower = operatorGroup.infix.bindingPower;
				if (
					isGreaterThan(bindingPower, rightBindingPower) ||
					(bindingPower == rightBindingPower &&
						operatorGroup.infix.isRightBinded)
				) {
					this.index++;
					const right = this.parseExpression(scope, bindingPower);
					left = operatorGroup.infix.expression.creator(left, right);
					continue;
				}
			}
			break;
		}
		return left;
	}

	public shouldParseInfixOrPostfix(scope: MetaScope): boolean {
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
		const scopeElement = scope.readElement(token.text);
		if (!scopeElement || scopeElement.$type != 'OperatorGroup')
			return false;
		return scopeElement.postfix != null || scopeElement.infix != null;
	}

	private parseInner(scope: MetaScope, endType?: TokenType): Expression[] {
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
		scope: MetaScope = new MetaScope()
	): BlockExpression {
		this.loadTokens(tokens);
		this.index = 0;
		this.scopes.push(scope);
		return {
			type: 'BlockExpression',
			expressions: this.parseInner(scope),
		};
	}
}
