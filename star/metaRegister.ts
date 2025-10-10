/**
 * Rejest tan działa na etapie parsowania i służy do dynamicznego definiowania danych składniowych.
 * W wyniku działania parsera, powinniśmy uzyskać 'czyste' drzewo składni, bez `wyrażeń uargumentowanych`
 * Rejestr jest także przydatny przy `wyrażeniach uargumentowanych`, gdzie służy do przekazywania parametrów
 */

import type { ArchetypeElement } from './metaRegisterElement';
import {
	defaultConstructorSymbol,
	type Archetype,
	type Expression,
	type InfixOperator,
	type MetaScopeRegistrySymbolsType,
	type UnaryOperator,
} from './parser';

type MetaRegisterGroups =
	| 'defaultIntegerArchetype'
	| 'defaultFloatArchetype'
	| 'defaultStringArchetype'
	| 'defaultConstructorArchetype'
	| 'defaultIndexerArchetype'
	| 'prefixOperator'
	| 'postfixOperator'
	| 'infixOperator';

export type Collection<Inner extends any = any> = {
	$: 'Collection';
} & Record<string, Inner>;

export function Collection<Inner extends any = any>(
	record: Record<string, Inner>
): Collection<Inner> {
	const collection = record as Collection<Inner>;
	collection.$ = 'Collection';
	return collection;
}

export type MetaRegisterShape = {
	defaultIntegerArchetype: Expression;
	defaultFloatArchetype: Expression;
	defaultStringArchetype: Expression;
	defaultConstructorArchetype: Expression;
	defaultIndexerArchetype: Expression;
	prefixOperator: Collection<UnaryOperator>;
	postfixOperator: Collection<UnaryOperator>;
	infixOperator: Collection<InfixOperator>;
	shape: Collection<Expression>;
};

type ValueOf<T> = T[keyof T];
export type Key<T extends string> = { group: T; $: 'Group' };
export function Key<T extends string>(group: T): Readonly<Key<T>> {
	return {
		group,
		$: 'Group',
	};
}
export type CollectionKey<T> = { group: T; name: string; $: 'GroupWithName' };
export function CollectionKey<T extends string>(
	group: T,
	name: string
): Readonly<CollectionKey<T>> {
	return {
		group,
		name,
		$: 'GroupWithName',
	};
}
export type AnyGroup<T extends string> = Key<T> | CollectionKey<T>;

export type MetaRegisterKeys = {
	[Index in keyof MetaRegisterShape]: MetaRegisterShape[Index] extends Collection
		? CollectionKey<Index>
		: Key<Index>;
};

export type CollectionGroups = ValueOf<{
	[Index in keyof MetaRegisterShape]: MetaRegisterShape[Index] extends Collection
		? Index
		: never;
}>;

export type MetaRegisterKey = ValueOf<MetaRegisterKeys>;

export type MetaRegisterValues = {
	[Key in keyof MetaRegisterShape]: MetaRegisterShape[Key] extends Collection<
		infer T
	>
		? T
		: MetaRegisterShape[Key];
};

export type ExcludeCollections<T> = T extends Collection ? never : T;
export type OnlyCollections<T> = T extends Collection ? T : never;
export class MetaRegister {
	private id = crypto.randomUUID();
	private registry: Partial<MetaRegisterShape> = {};
	constructor(public parent?: MetaRegister) {}

	public readElement<Key extends MetaRegisterKey>(
		key: Key
	): MetaRegisterValues[Key['group']] | null {
		const groupRegistry = this.registry[key.group];
		if (groupRegistry == void 0) {
			return this.parent?.readElement(key) || null;
		} else if (groupRegistry == null) {
			return null;
		}

		if (key.$ == 'GroupWithName') {
			const collectionRegistry = groupRegistry as OnlyCollections<
				typeof groupRegistry
			>;
			if (!collectionRegistry) {
				return this.parent?.readElement(key) || null;
			}
			return (collectionRegistry[key.name] as any) || null;
		} else {
			const excudingCollections = groupRegistry as ExcludeCollections<
				typeof groupRegistry
			>;
			return (excudingCollections as any) || null;
		}
		// If no $name, return the group registry itself
	}
	public readCollection<Group extends CollectionGroups>(
		group: Group
	): MetaRegisterShape[Group] | null {
		const groupRegistry = this.registry[group];
		if (groupRegistry == void 0) {
			return this.parent?.readCollection(group) || null;
		} else if (groupRegistry == null) {
			return null;
		}

		return this.registry[group] as any;
		// If no $name, return the group registry itself
	}

	public writeElement<Key extends MetaRegisterKey>(
		key: Key,
		element: MetaRegisterValues[Key['group']] | null
	): void {
		if (key.$ == 'GroupWithName') {
			if (this.registry[key.group] == void 0)
				this.registry[key.group] = Collection({ [key.name]: element });
			else
				(this.registry[key.group] as Collection<any>)[key.name] =
					element;
		} else {
			this.registry[key.group] = element;
		}
	}

	public __toString() {
		return `Scope#${this.id}`;
	}

	public toJSON() {
		return this.__toString();
	}
}

const metaRegister = new MetaRegister();
const someType = metaRegister.readElement(CollectionKey('infixOperator', '!'));
metaRegister.writeElement(Key('defaultConstructorArchetype'));
