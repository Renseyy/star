import { Range } from "../parseStack/parser";
import { Token } from "../parseStack/tokenizer";
import { IExpression } from "./IExpression";
import {IDataType} from "../DataType/IDataType.ts";
import {DataTypes} from "../DataType/DataTypes.ts";

export class IntegerLiteralExpression implements IExpression {
  public get value() {
    return parseInt(this.token.content);
  }
  constructor(private token: Token) {}
  toString(): string {
    throw new Error("Method not implemented.");
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

  getType(): IDataType {
    return DataTypes.Integer
  }
}
