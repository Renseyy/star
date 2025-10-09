/**
 * Rejest tan działa na etapie parsowania i służy do dynamicznego definiowania danych składniowych.
 * W wyniku działania parsera, powinniśmy uzyskać 'czyste' drzewo składni, bez `wyrażeń uargumentowanych`
 * Rejestr jest także przydatny przy `wyrażeniach uargumentowanych`, gdzie służy do przekazywania parametrów
 */

import type { ArchetypeElement } from './metaRegisterElement';
import {
	defaultConstructorSymbol,
	type Archetype,
	type MetaScopeRegistrySymbolsType,
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
	defaultIntegerArchetype: ArchetypeElement;
	defaultFloatArchetype: ArchetypeElement;
	defaultStringArchetype: ArchetypeElement;
	defaultConstructorArchetype: ArchetypeElement;
	defaultIndexerArchetype: ArchetypeElement;
	prefixOperator: ArchetypeElement;
	postfixOperator: Collection<string>;
	infixOperator: Collection<ArchetypeElement>;
};

type ValueOf<T> = T[keyof T];
export type Group<T extends string> = { group: T; $: 'Group' };
export function Group<T extends string>(group: T): Readonly<Group<T>> {
	return {
		group,
		$: 'Group',
	};
}
export type GroupWithName<T> = { group: T; name: string; $: 'GroupWithName' };
export function GroupWithName<T extends string>(
	group: T,
	name: string
): Readonly<GroupWithName<T>> {
	return {
		group,
		name,
		$: 'GroupWithName',
	};
}
export type AnyGroup<T extends string> = Group<T> | GroupWithName<T>;

export type MetaRegisterKeys = {
	[Key in keyof MetaRegisterShape]: MetaRegisterShape[Key] extends Collection
		? GroupWithName<Key>
		: Group<Key>;
};

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
const someType = metaRegister.readElement(GroupWithName('infixOperator', '!'));
metaRegister.writeElement(Group('defaultConstructorArchetype'),);
