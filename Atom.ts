import { arraysEqual } from "../utils/LazyArray";
import { IMemoryElement } from "./Context";

/**
 * Atom with same values are equal
 * TODO: this is propably not most optimized way to do this
 */
export class Atom {
  static allSymbols: Atom[] = [];
  constructor(
    public name: string,
    public params: (string | IMemoryElement)[] = [],
    public isType = false
  ) {
    for (const symbol of Atom.allSymbols) {
      if (symbol.name == this.name && arraysEqual(symbol.params, this.params)) {
        return symbol;
      }
    }
    Atom.allSymbols.push(this);
  }

  toFormatted(): string {
    if (this.name == "#") {
      let base = `<span class='atom system'>#`;
      if (this.params.length > 0) {
        base += `{${this.params.join(" ")}}`;
      }
      base += "</span>";
      return base;
    }
    let base = `<span class='atom'>\`${this.name}`;
    if (this.params.length > 0) {
      base += `{${this.params.join(" ")}}`;
    }
    base += "</span>";
    return base;
  }
}

export function buildinAtom(
  name: string,
  ...params: (string | IMemoryElement)[]
) {
  return new Atom("#", [name, ...params], true);
}
