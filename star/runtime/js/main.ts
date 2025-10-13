import type { BlockExpression } from '../../parser';

class ScopedMemory {
	memory: Map<string, any> = new Map();
	constructor(private parent: ScopedMemory | null = null) {}

	public get(key: string): any {
		if (this.memory.has(key)) {
			return this.memory.get(key);
		}
		if (this.parent) {
			return this.parent.get(key);
		}
		return null;
	}

	public set(key: string, value: any): void {
		this.memory.set(key, value);
	}
}

export class Runtime {
	memory: ScopedMemory = new ScopedMemory();
	constructor(public block: BlockExpression) {}
}
