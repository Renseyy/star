import { Collection, CollectionKey, type MetaRegister } from './metaRegister';
import {
	IdentifierExpression,
	LiteralExpression,
	maxBindingPower,
	type InfixOperator,
	type Parser,
} from './parser/parser';
import { expect } from './utils';

export function staticDirectives(parser: Parser) {
	return {
		InfixOperator: (register: MetaRegister): InfixOperator => {
			const scope = parser.parseScope(register);
			const collection = scope.readCollection('shape');
			if (!collection) throw new Error('Cannot get shape');
			const bindingPower = collection.binding_power.value;
			const isRightBinded = collection.is_right_binded.value;
			const creator = collection.creator;
			return {
				$: 'InfixOperator',
				bindingPower,
				expression: creator,
				isRightBinded,
			};
		},
		'=': (register: MetaRegister) => {
			const identifier = expect<IdentifierExpression>(
				'IdentifierExpression',
				parser.parseElement(register)
			);
			const expression = parser.parseElement(register);
			register.writeElement(
				CollectionKey('shape', identifier.name),
				expression
			);

			return null;
		},
		MAX_BINDING_POWER: (register: MetaRegister) => ({
			$: ['BindingPower', 'MaxBindingPower'],
			bindingPower: maxBindingPower,
		}),
		BindingPower: (register: MetaRegister) => {
			const value = expect<LiteralExpression>(
				'LiteralExpression',
				parser.parseElement(register)
			);
			return {
				$: ['BindingPower', 'Numeric'],
				bindingPower: value.value,
			};
		},
		TRUE: () => ({
			$: ['LiteralExpression', 'Boolean', 'True'],
			contentType: 'Boolean',
			value: true,
		}),
		FALSE: () => ({
			$: ['LiteralExpression', 'Boolean', 'False'],
			contentType: 'Boolean',
			value: true,
		}),
		indexer: (register: MetaRegister) => {
			return {
				$: 'Indexer',
			};
		},
	} as const;
}
