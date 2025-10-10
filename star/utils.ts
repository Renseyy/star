export interface StringRecord<T> {
	[key: string]: T;
}

export function expect<T>(name: string, value: { $: string }): T {
	if (value.$ != name) {
		throw new Error(`Expected ${name} got ${value.$}`);
	}
	return value as T;
}

declare global {
	interface Object {
		$?: string[];
		is(name: string): boolean;
	}
}
Object.prototype.is = function (name: string): boolean {
	const type = this.$ ?? [];
	return type.includes(name);
};

export function infer(parent: {});
