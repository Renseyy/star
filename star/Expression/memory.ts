import type { Expression } from '../parser';

// Expressions for memory and type system

export type DefineExpression = {
	$: 'DefineExpression';
	location: Expression;
	value: Expression;
};

export function DefineExpression(
	location: Expression,
	value: Expression
): DefineExpression {
	return {
		$: 'DefineExpression',
		location,
		value,
	};
}

export type SetExpression = {
	$: 'SetExpression';
	location: Expression;
	value: Expression;
};

export function SetExpression(
	location: Expression,
	value: Expression
): SetExpression {
	return {
		$: 'SetExpression',
		location,
		value,
	};
}

export type DeclareExpression = {
	$: 'GuardExpression';
	what: Expression;
	type: Expression;
};

export function DeclareExpression(
	what: Expression,
	type: Expression
): DeclareExpression {
	return {
		$: 'GuardExpression',
		what,
		type,
	};
}

export type ConstantExpression = {
	$: 'ConstantExpression';
	location: Expression;
	value: Expression;
};

export function ConstantExpression(
	location: Expression,
	value: Expression
): ConstantExpression {
	return {
		$: 'ConstantExpression',
		location,
		value,
	};
}

export type ExtendsExpression = {
	$: 'ExtendsExpression';
	left: Expression;
	right: Expression;
};

export function ExtendsExpression(
	left: Expression,
	right: Expression
): ExtendsExpression {
	return {
		$: 'ExtendsExpression',
		left,
		right,
	};
}

export type MemoryExpressions =
	| DefineExpression
	| SetExpression
	| DeclareExpression
	| ConstantExpression
	| ExtendsExpression;

export const Memory = {
	DefineExpression,
	SetExpression,
	DeclareExpression,
	ConstantExpression,
	ExtendsExpression,
};

export default Memory;
