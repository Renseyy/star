import type { Operation } from './core/operation';
import type { Expression } from './parser-old';

export type ParametredDirective = {
	type: 'ParametredDirective';
	resolver: (params: Expression[]) => Expression;
};

export type SetDirective = {
	type: 'SetDirective';
	address: Expression;
	value: Expression;
};

export type ReturnDirective = {
	type: 'ReturnDirective';
	expression: Expression;
};

export type Variable = {
	type: 'Variable';
	address: string;
};

export type Directive = SetDirective | ReturnDirective | Variable;

export type HashCommands = Directive | Operation;
