import type { MetaRegisterGroup } from './metaRegister';

export type MetaRegisterElement = {};

/**
 * Holds information about an archetype
 */
export type ArchetypeElement = {
	type: 'Archetype';
	expression: string;
	fields: string[];
};
