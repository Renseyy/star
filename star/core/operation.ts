// Login operations

import type { Expression } from '../parser';

// Test operations

/**
 * Equals
 * @returns `##bool` {`#TRUE` | `#FALSE`}
 */

export type Equals = {
	type: 'Equals';
	left: Expression;
	right: Expression;
};

/**
 * Compare
 * Returns `##comperor` of two expressions [`#GREATER`, `#LESS`, `#EQUAL`]
 */
export type Compare = {
	type: 'Compare';
	left: Expression;
	right: Expression;
};

//

export type BitwiseAndOperation = {
	type: 'BitwiseAndOperation';
	left: Expression;
	right: Expression;
};

export type BitwiseOrOperation = {
	type: 'BitwiseOrOperation';
	left: Expression;
	right: Expression;
};

export type BitwiseXorOperation = {
	type: 'BitwiseXorOperation';
	left: Expression;
	right: Expression;
};

export type BitwiseLeftShiftOperation = {
	type: 'BitwiseLeftShiftOperation';
	left: Expression;
	right: Expression;
};

export type BitwiseArithmeticRightShiftOperation = {
	type: 'BitwiseArithmeticRightShiftOperation';
	left: Expression;
	right: Expression;
};

export type BitwiseLogicalRightShiftOperation = {
	type: 'BitwiseLogicalRightShiftOperation';
	left: Expression;
	right: Expression;
};

export type BitwiseRotateLeftShiftOperation = {
	type: 'BitwiseRotateLeftShiftOperation';
	left: Expression;
	right: Expression;
};

export type BitwiseRotateRightShiftOperation = {
	type: 'BitwiseRotateRightShiftOperation';
	left: Expression;
	right: Expression;
};

export type BitwiseNotOperation = {
	type: 'BitwiseNotOperation';
	expression: Expression;
};

// Logic operations

export type LogicNotOperation = {
	type: 'LogicNotOperation';
	expression: Expression;
};

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

export type LogicXorOperation = {
	type: 'LogicNandOperation';
	left: Expression;
	right: Expression;
};

// Math

export type Operation =
	| Equals
	| Compare
	| BitwiseAndOperation
	| BitwiseOrOperation
	| BitwiseXorOperation
	| BitwiseLeftShiftOperation
	| BitwiseArithmeticRightShiftOperation
	| BitwiseLogicalRightShiftOperation
	| BitwiseRotateLeftShiftOperation
	| BitwiseRotateRightShiftOperation
	| BitwiseNotOperation
	| LogicNotOperation
	| LogicAndOperation
	| LogicOrOperation
	| LogicXorOperation;
