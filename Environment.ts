import { MemoryKey } from "./Context.ts";
import { IDataType } from "./DataType/IDataType.ts";

export class Environment {
    public elements = new Map<MemoryKey, IDataType>()
    constructor(public parent: Environment | null = null) {

    }

    /**
     * Finds environment that holds some element
     */
    lookup(key: MemoryKey, selfDefault: true): Environment
    lookup(key: MemoryKey, selfDefault: false): Environment | null
    lookup(key: MemoryKey, selfDefault: boolean = true): Environment | null {
        return this.elements.has(key)
            ? this
            : this.parent
                ? this.parent.lookup(key, false)
                : selfDefault
                    ? this
                    : null

    }

    getElement(key: MemoryKey): IDataType | null {
        return this.elements.has(key)
            ? this.elements.get(key) as IDataType
            : this.parent
                ? this.parent.getElement(key)
                : null
    }

    setElement(key: MemoryKey, dataType: IDataType | null): void {
        if (dataType == null) {
            this.elements.delete(key)
        } else {
            this.elements.set(key, dataType)
        }
    }

    hasOwnElement(key: MemoryKey): boolean {
        return this.elements.has(key)
    }

    hasElement(key: MemoryKey): boolean {
        return this.elements.has(key) || !!this.parent?.hasElement(key)
    }

    toFormatted() {
        return {
            elements: Array.from(this.elements.entries()).map(([key, value]) => ({
                key,
                value
            })),
            hasParent: this.parent !== null
        };
    }
}