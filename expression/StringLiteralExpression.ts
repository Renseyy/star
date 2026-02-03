import { Range } from "../parseStack/parser";
import { Token } from "../parseStack/tokenizer";
import { IExpression } from "./IExpression";
import {IDataType} from "../DataType/IDataType.ts";

export class StringLiteralExpression implements IExpression {
  constructor(public startToken: Token, public endToken: Token, public value: string) {}
  toString(): string {
    throw new Error("Method isn't implemented.");
  }
  getRange() {
    return new Range(this.startToken.position, this.endToken.endPosition);
  }

  getType(): IDataType {
    return IDataType.String
  }
}
