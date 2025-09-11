import type { Directive, HashCommands } from './directive';
import type { Block, Element, Identifier, Line, Literal } from './liner';

export type Atom = {
	type: 'Atom';
	value: string;
};

export type Command = {
	type: 'Command';
	constructor: ArgumentedExpression<[Expression, Expression]>;
};

export type OperatorGroup = {
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

export type ScopeElement = Command | OperatorGroup | ExpressionHolder;

//TODO: dodać rejestr pamięci i układanie zgodnie z nim wartości
export class Memory {
	private registry: Record<string, string> = {};
}
export class Scope {
	private registry: Record<string, ScopeElement> = {};
	constructor(public parent?: Scope) {}

	public readElement(name: string): ScopeElement | null {
		if (this.registry[name]) return this.registry[name];
		if (this.parent) return this.parent.readElement(name);
		return null;
	}

	public writeElement(name: string, element: ScopeElement) {
		this.registry[name] = element;
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
	resolve: () => ScopeElement;
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

export type Expression =
	| LiteralExpression
	| BlockExpression
	| IdentifierExpression
	| TemporaryOperatorExpression
	| ArgumentedExpression<any>
	| CallCommandExpression
	| HashCommands;

// Ten parser ma za zadanie zmienić poszczególne elementy na wyrażenia - posiadając już wiedzę o odpowienich operatorach
export class Parser {
	private parseLiteral(element: Literal, scope: Scope): LiteralExpression {
		return {
			type: 'LiteralExpression',
			contentType: element.contentType,
			value: element.value,
		};
	}

	private parseBlock(
		element: Block,
		scope: Scope,
		isTransparent: boolean = false
	): BlockExpression {
		const innerScope = isTransparent ? scope : new Scope(scope);
		return {
			type: 'BlockExpression',
			expressions: element.expressions.map((element: Element) =>
				this.parseElement([element], innerScope)
			),
		};
	}

	private parseIdentifier(
		element: Identifier,
		scope: Scope,
		autoResolve: boolean = false
	): typeof autoResolve extends true ? ScopeElement : IdentifierExpression {
		const scopeElement = scope.readElement(element.value);
		const resolve = (): ScopeElement => {
			if (!scopeElement)
				throw new Error(`Cannot resolve ${element.value}`);
			return scopeElement;
		};
		return autoResolve
			? resolve()
			: { type: 'IdentifierExpression', name: element.value, resolve };
	}

	private parseGroup(element: Element, scope: Scope): Expression {
		throw new Error('Group is not implemented');
	}

	private parseMaybePrefixOperator(
		identifier: Identifier,
		elements: Element[],
		scope: Scope
	): null | Expression {
		const name = identifier.value;
		const operatorGroup = scope.readElement(name);
		if (!operatorGroup || operatorGroup.type != 'OperatorGroup')
			return null;
		if (operatorGroup.prefix == null) return null;
		const bindingPower = operatorGroup.prefix.bindingPower;
		const argument = this.parseSubline(elements, scope, bindingPower);
		return operatorGroup.prefix.expression.creator(argument);
	}

	private parseElement(elements: Element[], scope: Scope): Expression {
		const element = elements.shift();
		if (!element) {
			throw new Error('PANIC NO ELEMENT');
		}
		if (element.type == 'Literal') {
			return this.parseLiteral(element, scope);
		} else if (element.type == 'Block') {
			return this.parseBlock(element, scope);
		} else if (element.type == 'Identifier') {
			return (
				this.parseMaybePrefixOperator(element, elements, scope) ??
				this.parseIdentifier(element, scope)
			);
		} else if (element.type == 'Group') {
			return this.parseGroup(element, scope);
		} else if (element.type == 'Line') {
			return this.parseLine(element, scope);
		}
	}
	/**
	 * @mutates elements
	 */
	public isFirstGetCommand(
		elements: Element[],
		scope: Scope
	): Command | null {
		if (elements.length < 1) return null;
		const element = elements[0] as Element;
		if (element.type != 'Identifier') return null;
		const scopeElement = scope.readElement(element.value);
		if (!scopeElement || scopeElement.type != 'Command') return null;
		elements.shift();
		return scopeElement;
	}

	public parseSubline(
		elements: Element[],
		scope: Scope,
		rightBindingPower: number = 0
	): Expression {
		let element = elements[0];
		if (!element) {
			throw new Error(
				'PANIC: Subline is empty - this should never happend at this stage of evaluating'
			);
		}
		let left = this.parseElement(elements, scope);
		while (this.shouldParseInfixOrPostfix(elements[0], scope)) {
			element = elements[0];
			if (!element || element.type != 'Identifier') break;
			const operatorGroup = scope.readElement(element.value);
			if (!operatorGroup || operatorGroup.type != 'OperatorGroup') {
				throw new Error(
					'PANIC: OperatorGroup not found - add error message in future'
				);
			}
			if (operatorGroup.postfix != null) {
				const bindingPower = operatorGroup.postfix.bindingPower;
				if (bindingPower > rightBindingPower) {
					left = operatorGroup.postfix.expression.creator(left);
					element = elements.shift();
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
					const oldElement = element;
					element = elements.shift();
					const right = this.parseSubline(
						elements,
						scope,
						bindingPower
					);
					left = operatorGroup.infix.expression.creator(left, right);

					continue;
				}
			}
			break;
		}
		return left;
	}

	public parseLine(
		line: Line,
		scope: Scope,
		firstCanBeCommand: boolean = true
	): Expression {
		// Add schema infering
		const command = this.isFirstGetCommand(line.elements, scope);
		const sublines: Expression[] = [];
		while (line.elements.length > 0) {
			const subline = this.parseSubline(line.elements, scope, 0);
			sublines.push(subline);
		}
		if (command) {
			return {
				type: 'CallCommandExpression',
				command,
				arguments: sublines,
			};
		} else {
			if (sublines.length == 1) return sublines[0] as Expression;
			console.dir(sublines, { depth: null });
			throw new Error('Line have more than one expression');
		}
	}

	public shouldParseInfixOrPostfix(
		element: Element | undefined,
		scope: Scope
	): boolean {
		if (!element) return false;
		if (element.type != 'Identifier') return false;
		const scopeElement = scope.readElement(element.value);
		if (!scopeElement || scopeElement.type != 'OperatorGroup') return false;
		return scopeElement.postfix != null || scopeElement.infix != null;
	}

	public parse(element: Element, scope: Scope = new Scope()) {
		return this.parseElement([element], scope);
	}
}
