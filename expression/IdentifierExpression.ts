import { Token } from "../parseStack/tokenizer";
import { Context, MemoryInfo, MemoryKey } from "../Context";
import { RangedError } from "../RangedError";
import { Range } from "../parseStack/parser";
import { IMemoryExpression } from "./IMemoryExpression";
import { IDataType } from "../DataType/IDataType.ts";
import { Environment } from "../Environment.ts";

export class IdentifierExpression implements IMemoryExpression {
  constructor(private token: Token, public atBaking: boolean) {}

  getMemoryInfo(context: Context): MemoryInfo {
    const memoryInfo = context.get(this.token.content);
    if (!memoryInfo) {
      throw new RangedError(
        `${this.token.content} is not defined in current scope`,
        this.getRange()
      );
    }
    return memoryInfo;
  }

  getKey(): MemoryKey {
    return this.token.content;
  }

  getRange() {
    return new Range(this.token.position, this.token.endPosition);
  }

  get startToken() {
    return this.token;
  }
  get endToken() {
    return this.token;
  }

  get symbol(): string {
    return this.token.content;
  }

  getType(environment: Environment): IDataType {
    const dataType = environment.getElement(this.symbol);
    if (!dataType) {
      throw new RangedError(
        `${this.symbol} is not defined in current scope`,
        this.getRange()
      );
    }
    return dataType;
  }

  public toString() {
    return this.token.content;
  }
}
