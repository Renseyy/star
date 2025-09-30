import type { Identifier } from '../parser';

// Used to represent scoped memory. With this, we can ommit scopes in next level
export type MemoryExtran = {
	type: 'MemoryExtran';
	identifier: Identifier;
	address: string;
};

export type Extrans = MemoryExtran;
