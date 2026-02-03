import { Context, IMemoryElement, MemoryInfo, MemoryKey } from "./Context";

class _Buildin implements IMemoryElement {
  public hasValue: boolean = false;
  constructor(public _name?: string) {}
  extend(): Context {
    throw new Error("Cannot extend buildin value");
  }
  get(): MemoryInfo {
    throw new Error("Cannot get from buildin value");
  }
  set(): void {
    throw new Error("Cannot set into buildin value");
  }
  getCurrent(): MemoryInfo {
    throw new Error("Cannot search buildin value");
  }
}

export type Buildin = _Buildin;
export const BuildinTypes = {
  i32: new _Buildin("i32"),
  i64: new _Buildin("i64"),
  Float: new _Buildin("Float"),
  Pointer: new _Buildin("Pointer"),
  Boolean: new _Buildin("Boolean"),
  Undefined: new _Buildin("Undefined"),
  Struct: new _Buildin("Struct"),
  Tuple: new _Buildin("Tuple"),
};

class _BuildinInteger extends _Buildin {
  public hasValue: boolean = true;
  constructor(public value: number, public type: _Buildin = BuildinTypes.i32) {
    super();
  }
}

class _BuildinFloat extends _Buildin {
  public hasValue: boolean = true;
  constructor(public value: number) {
    super();
  }
}

class _BuildinPointer extends _Buildin {
  public hasValue: boolean = true;
  constructor(public value: number) {
    super();
  }
}

export class BuildinIdentifier extends _Buildin {
  public hasValue: boolean = true;
  constructor(public name: string) {
    super();
  }

  toString() {
    return this.name;
  }
}

export class BuildinBoolean extends _Buildin {
  public hasValue: boolean = true;
  constructor(public value: boolean) {
    super();
  }
}

class _BuildinFieldSet extends _Buildin {
  public hasValue: boolean = true;
  constructor(public values: MemoryKey[]) {
    super();
  }
}

export class BuildinArray<T extends IMemoryElement> extends _Buildin {
  public hasValue: boolean = true;
  constructor(public values: T[]) {
    super();
  }
}

export const BuildinValues = {
  i32: (value: number) => new _BuildinInteger(value),
  Float: (value: number) => new _BuildinFloat(value),
  Pointer: (value: number) => new _BuildinPointer(value),
  Identifier: (name: string) => new BuildinIdentifier(name),
  Boolean: (value: boolean) => new BuildinBoolean(value),
  FieldSet: (values: MemoryKey[]) => new _BuildinFieldSet(values),
  Array: <T extends IMemoryElement>(values: T[]) => new BuildinArray<T>(values),
};
