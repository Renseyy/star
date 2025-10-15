import type { MetaRegisterGroup } from './metaRegister';

export type MetaRegisterElement = {};

/**
 * Holds information about an archetype
 */

export type HashType = {
	$: 'HashType';
	name:
		| 'I8'
		| 'I16'
		| 'I32'
		| 'I64'
		| 'U8'
		| 'U16'
		| 'U32'
		| 'U64'
		| 'F32'
		| 'F64';

	count: number | null;
	isReference: boolean;
};

export function HashType(
	name: HashType['name'],
	count: number | null = 1,
	isReference: boolean = false
): HashType {
	return {
		$: 'HashType',
		name,
		count,
		isReference,
	};
}

export type Reference = {
	$: 'Reference';
	path: string[];
};

export type Type = HashType | ArchetypeElement;

export type ArchetypeElement = {
	type: 'Archetype';
	fields: Record<string, Type>;
	// Add support for procedures
};

export function ArchetypeElement(
	fields: Record<string, Type>
): ArchetypeElement {
	return {
		type: 'Archetype',
		fields,
	};
}

export type ScopedLiteral = {
	$: 'ScopedLiteral';
	metaAdress: string;
};

export type MemoryElement = {
	$: 'MemoryElement';
	id: string;
	archetype: ArchetypeElement;
};
