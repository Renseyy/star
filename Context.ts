import { Maybe } from "../utils/types";
import { Atom, buildinAtom } from "./Atom";
import {
  BuildinArray,
  BuildinBoolean,
  BuildinIdentifier,
} from "./BuildinValue";
import { MetaKey } from "./MetaKey";
import { RangedError } from "./RangedError";

export class MemoryInfo<T extends IMemoryElement = IMemoryElement> {
  constructor(
    public index: string | null,
    public origin: Context,
    public symbol: MemoryKey,
    public isFrozen: boolean = false,
    public isConstant: boolean = false
  ) {}

  set(element: T) {
    this.element = element;
  }
}

export interface IMemoryElement {
  hasValue: boolean;
  get(symbol: MemoryKey, originalContext?: Context): MemoryInfo | null;
  set(symbol: MemoryKey, memoryElement: MemoryInfo): void;
}

export type MemoryKey = number | string | Atom | MetaKey;

export type ContextMetaData = Partial<{
  outer_scopes: BuildinArray<Context>;
  has_value: BuildinBoolean;
  type: IMemoryElement;
  source: IMemoryElement;
  prototype: Context;
  symbol: BuildinIdentifier;
  is_buildin_wrapper: BuildinBoolean;
  is_instance: BuildinBoolean;
}>;

// Rewrite context

export class Memory {
  public cells: Map<MemoryKey, IMemoryElement> = new Map();
}

export class Context implements IMemoryElement {
  public metaData: ContextMetaData = {};
  public elements: Map<MemoryKey, MemoryInfo> = new Map();
  constructor() {}

  public getMetaData(key: keyof ContextMetaData): IMemoryElement | undefined {
    return this.metaData[key];
  }

  public setMetadata<K extends keyof ContextMetaData>(
    key: K,
    value: ContextMetaData[K]
  ) {
    this.metaData[key] = value;
  }

  /**
   *! Special metadata
   */

  public get hasValue(): boolean {
    const hasValue = this.metaData["has_value"];
    return hasValue ? hasValue.value : false;
  }

  public get outerScopes(): Context[] {
    const outerScopes = this.metaData["outer_scopes"];
    if (outerScopes) {
      return outerScopes.values;
    }
    return [];
  }

  public set outerScopes(outerScopes: Context[]) {
    this.metaData["outer_scopes"] = new BuildinArray(outerScopes);
  }

  public get(symbol: MemoryKey): MemoryInfo {
    const currentScopeElement = this.elements.get(symbol);
    if (currentScopeElement) {
      return currentScopeElement;
    }

    // Wartości liczbowe są nie dziedziczne
    if (symbol instanceof Number) {
      return new MemoryInfo(null, this, symbol);
    }

    for (const outerScope of this.outerScopes) {
      const outerScopeElement = outerScope.get(symbol);
      if (outerScopeElement) {
        return outerScopeElement;
      }
    }

    return new MemoryInfo(null, this, symbol);
  }

  public set(memoryInfo: MemoryInfo): void;
  public set(symbol: MemoryKey, memoryElement: IMemoryElement): void;
  public set(symbol: MemoryKey, memoryInfo: MemoryInfo): void;
  public set(
    first: MemoryKey | MemoryInfo,
    second?: MemoryInfo | IMemoryElement
  ) {
    if (first instanceof MemoryInfo) {
      this.elements.set(first.symbol, first);
      return;
    }
    second = second as MemoryInfo | IMemoryElement;
    if (!(second instanceof MemoryInfo)) {
      second = new MemoryInfo(second, this, first);
    }
    this.elements.set(first, second);
  }

  public toString() {
    const name = this.elements.get(buildinAtom("symbol"));
    if (name) {
      return `${name.toString()}.Context`;
    }
    return `Context.Anonymous`;
  }
}

// Context is now some sort of a map
