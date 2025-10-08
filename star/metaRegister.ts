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

export type Collection<Inner extends any = any> = Record<string, Inner> & {
	$: 'Collection';
};

export type MetaRegisterShape = {
	defaultIntegerArchetype: ArchetypeElement;
	defaultFloatArchetype: ArchetypeElement;
	defaultStringArchetype: ArchetypeElement;
	defaultConstructorArchetype: ArchetypeElement;
	defaultIndexerArchetype: ArchetypeElement;
	prefixOperator: MetaScopeRegistrySymbolsType;
	postfixOperator: MetaScopeRegistrySymbolsType;
	infixOperator: Collection<ArchetypeElement>;
};

type ValueOf<T> = T[keyof T];

export type MetaRegisterKeys = {
	[key in keyof MetaRegisterShape]: MetaRegisterShape[key] extends Collection
		? { $group: key; $name: string }
		: { $group: key };
};

export type MetaRegisterKey = ValueOf<MetaRegisterKeys>;

export class MetaRegister {
	private id = crypto.randomUUID();
	private registry: Partial<MetaRegisterShape> = {};
	constructor(public parent?: MetaRegister) {}
	public readElement(key: MetaRegisterKey): any {
		const groupRegistry = this.registry[key.$group];
		if (groupRegistry) {
			if ('$name' in key) {
				const element =
					groupRegistry as MetaRegisterShape[typeof key.$group];
				if (element) {
					return element;
				}
			}
			if (element) {
				return element;
			}
		}
		return this.parent?.readElement(key);
	}

	public writeElement(key: MetaRegisterKey, element: any): void {
		if (key.$name) {
			this.registry[key.$group][key.$name] = element;
		} else {
			this.registry[key.$group] = element;
		}
	}

	public __toString() {
		return `Scope#${this.id}`;
	}

	public toJSON() {
		return this.__toString();
	}
}
