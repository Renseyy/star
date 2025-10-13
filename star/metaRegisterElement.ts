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
		| 'Ptr'
		| 'F32'
		| 'F64';
	count: number | null;
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
