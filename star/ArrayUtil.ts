declare global {
	interface Array<T> {
		last(): T | undefined;
	}

	interface String {
		in(...array: Array<string>): boolean;
	}
}

Array.prototype.last = function () {
	if (this.length === 0) return undefined;
	return this[this.length - 1];
};

String.prototype.in = function (this: string, ...array: Array<string>) {
	return array.includes(this);
};
