import { arraysEqual } from "../utils/LazyArray";
import { IMemoryElement } from "./Context";

export class MetaKey {
  static allSymbols: MetaKey[] = [];
  public params: (string | IMemoryElement)[] = [];
  constructor(public name: string, ...params: (string | IMemoryElement)[]) {
    for (const symbol of MetaKey.allSymbols) {
      if (symbol.name == this.name && arraysEqual(symbol.params, params)) {
        return symbol;
      }
    }
    this.params = params;
    MetaKey.allSymbols.push(this);
  }

  toFormatted(): string {
    let base = `<span class='meta-key'>#`;
    if (this.params.length > 0) {
      base += `{${this.params.join(" ")}}`;
    }
    base += "</span>";
    return base;
  }
}
