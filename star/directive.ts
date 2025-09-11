import type { Expression } from './parser';

export type ParametredDirective = {
	type: 'ParametredDirective';
	resolver: (params: Expression[]) => Expression;
};

export type SetDirective = {
	type: 'SetDirective';
	address: Expression;
	value: Expression;
};

export type Directive = SetDirective;

// Login operations

export type LogicAndOperation = {
	type: 'LogicAndOperation';
	left: Expression;
	right: Expression;
};

export type LogicOrOperation = {
	type: 'LogicOrOperation';
	left: Expression;
	right: Expression;
};

export type LogicNegationOperation = {
	type: 'LogicNegationOperation';
	expression: Expression;
};

export type Opration =
	| LogicAndOperation
	| LogicOrOperation
	| LogicNegationOperation;

export type HashCommands = Directive | Opration;
