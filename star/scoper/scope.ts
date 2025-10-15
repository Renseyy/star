export type Operator = {
	$: 'operator';
	ignoresLineBefore: boolean;
	ignoresLineAfter: boolean;
};

export type ScopeElement = null | 'command' | Operator;

export function operator(
	ignoresLineBefore: boolean,
	ignoresLineAfter: boolean
): Operator {
	return {
		$: 'operator',
		ignoresLineBefore,
		ignoresLineAfter,
	};
}
export type Scope = Record<string, ScopeElement>;

export class ScopeStack {
	private scopes: [Scope, ...Scope[]];

	public constructor(baseScope: Scope = {}) {
		this.scopes = [baseScope];
	}
	public push(scope: Scope) {
		this.scopes.push(scope);
	}
	public pop(): Scope {
		return this.scopes.pop()!;
	}

	public get(name: string): ScopeElement {
		for (let i = this.scopes.length - 1; i >= 0; i--) {
			const scope = this.scopes[i];
			if (scope === undefined) return null;
			const element = scope[name];
			if (element === void 0) {
				continue;
			}
			return element;
		}
		return null;
	}

	public set(name: string, value: ScopeElement) {
		const last = this.scopes.length - 1;
		const scope = this.scopes[last];
		if (!scope) {
			throw new Error('Cannot set scope');
		}
		scope[name] = value;
	}
}
