import type { Extrans } from './core/extrans';
import type { Directive, HashCommands } from './directive';
import { TokenType, type Token } from './token';

export const defaultConstructorSymbol = Symbol('defaultConstructor')

/**
 * Add support for decorations and directives,
 * - members, function calls, incontexts and indexers,
 */

export type Atom = {
	isLineJoiner?: true;
	isTransparent?: true;
	type: 'Atom';
	value: string;
};

export type Command = {
	type: 'Command';
	constructor: ArgumentedExpression<Expression[]>;
};

export type OperatorGroup = {
	isLineJoiner?: true;
	type: 'OperatorGroup';
	prefix: null | {
		expression: ArgumentedExpression<[Expression]>;
		bindingPower: number;
	};
	infix: null | {
		expression: ArgumentedExpression<[Expression, Expression]>;
		bindingPower: number;
		isRightBinded: boolean;
	};
	postfix: null | {
		expression: ArgumentedExpression<[Expression]>;
		bindingPower: number;
	};
};

export type InfixOperator = {
	type: 'InfixOperator';
	bindingPower: number;
	isRightBinded: boolean;
	expression: ArgumentedExpression<[Expression, Expression]>;
};

export type ExpressionHolder = {
	type: 'ExpressionHolder';
	expression: Expression;
};

export type VariableHolder = {
	type: 'VariableHolder';
};

export type ScopeElement =
	| Command
	| OperatorGroup
	| ExpressionHolder
	| Atom
	| VariableHolder;

//TODO: dodać rejestr pamięci i układanie zgodnie z nim wartości
export class Memory {
	private registry: Record<string, string> = {};
}
export class Scope {
	private id = crypto.randomUUID();
	private registry: Record<string | symbol, ScopeElement> = {};
	constructor(public parent?: Scope) {}

	public readElement(name: string | symbol): ScopeElement | null {
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
	public declarationScope(name: string): Scope | null {
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
	declarationScope: Scope | null;
	locationScope: Scope;
};

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
	scope: Scope;
	expressions: Expression[];
};

export type Call = {
	type: 'Call';
	callee: Command;
	callBlock: ScopedExpressions;
};

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
	| Extrans;

export class Decoration {}

// Ten parser ma za zadanie zmienić poszczególne elementy na wyrażenia - posiadając już wiedzę o odpowienich operatorach
export class Parser {
	private tokens: Token[] = [];
	private index = 0;
	public decorations: Decoration[] = [];
	private scopes: Scope[] = [];

	private getCurrentToken(forTest: true): Token | null;
	private getCurrentToken(forTest?: false): Token;
	private getCurrentToken(forTest: boolean = false): Token | null {
		let token = this.tokens[this.index];
		// Skip irrelevant tokens
		while (token && token.type == 'IrrelevantToken') {
			this.index++;
			token = this.tokens[this.index];
		}
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
		declare: (scope: Scope) => {
			this.index++;
			const name = this.parseElement(scope);
			if (name.type != 'IdentifierExpression')
				throw new Error(
					`Unexpected token ${name.type}, expected IdentifierExpression`
				);
			const nameIdentifier = name.name;
			scope.declare(nameIdentifier, {
				type: 'VariableHolder',
			});
			return {
				type: 'Directive',
				name: 'declare',
				arguments: [name],
			};
		},
	};

	private parseBlock(
		scope: Scope,
		isTransparent: boolean = false
	): BlockExpression {
		const innerScope = isTransparent ? scope : new Scope(scope);

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
		scope: Scope,
		isTransparent: boolean = false
	): BlockExpression {
		const innerScope = isTransparent ? scope : new Scope(scope);

		// Eat {
		this.index++;
		const expressions = this.parseInner(innerScope, TokenType.RightParenthesis);
		this.index++;
		return {
			type: 'BlockExpression',
			expressions: expressions,
		};
	}

	private parseIdentifier(
		scope: Scope,
		autoResolve: boolean = false
	): Expression {
		const token = this.getCurrentToken();
		this.index++;
		return {
			type: 'IdentifierExpression',
			name: token.text,
			declarationScope: scope.declarationScope(token.text),
			locationScope: scope,
		};
	}

	private parseMaybePrefixOperator(scope: Scope): null | Expression {
		const token: Token = this.getCurrentToken();
		const name = token.text;
		const element = scope.readElement(name);
		if (element?.type == 'OperatorGroup') {
			if (element.prefix == null) return null;
			const bindingPower = element.prefix.bindingPower;
			const argument = this.parseExpression(scope, bindingPower);
			return element.prefix.expression.creator(argument);
		} else if (element?.type == 'Atom') {
		}
		return null;
	}

	private parseElement(scope: Scope): Expression {
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
			const defaultConstructor = scope.readElement(defaultConstructorSymbol);
			if(defaultConstructor?.type != 'VariableHolder') throw new Error('Unexpected default constructor');{
				
			}
		
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
		scope: Scope,
		rightBindingPower: number = 0
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
			}
			if (token.type == TokenType.LeftParenthesis) {
				const callee = left;
				const scope = 
			}
			if (token.type != TokenType.Identifier) break;
			const operatorGroup = scope.readElement(token.text);
			if (!operatorGroup || operatorGroup.type != 'OperatorGroup') {
				throw new Error(
					'PANIC: OperatorGroup not found - add error message in future'
				);
			}
			if (operatorGroup.postfix != null) {
				const bindingPower = operatorGroup.postfix.bindingPower;
				if (bindingPower > rightBindingPower) {
					left = operatorGroup.postfix.expression.creator(left);
					this.index++;
					continue;
				}
			}
			if (operatorGroup.infix != null) {
				const bindingPower = operatorGroup.infix.bindingPower;
				if (
					bindingPower > rightBindingPower ||
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

	public shouldParseInfixOrPostfix(scope: Scope): boolean {
		const token = this.getCurrentToken(true);
		if (!token) return false;
		if (token.type != TokenType.Identifier) return false;
		const scopeElement = scope.readElement(token.text);
		if (!scopeElement || scopeElement.type != 'OperatorGroup') return false;
		return scopeElement.postfix != null || scopeElement.infix != null;
	}

	private parseInner(scope: Scope, endType?: TokenType): Expression[] {
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

	public parse(tokens: Token[], scope: Scope = new Scope()): BlockExpression {
		this.tokens = tokens;
		this.index = 0;
		this.scopes.push(scope);
		return {
			type: 'BlockExpression',
			expressions: this.parseInner(scope),
		};
	}
}
