declare global {
	interface Array<T> {
		last(index?: number): T | undefined;
	}

	interface String {
		in(...array: Array<string>): boolean;
	}
}

Array.prototype.last = function (index: number = 1) {
	if (this.length === 0) return undefined;
	return this[this.length - index];
};

String.prototype.in = function (this: string, ...array: Array<string>) {
	return array.includes(this);
};
