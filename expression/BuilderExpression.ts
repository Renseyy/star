import { Range } from "../parseStack/parser";
import { Token } from "../parseStack/tokenizer";
import { BlockExpression } from "./BlockExpression";
import { IExpression } from "./IExpression";
import {IDataType} from "../DataType/IDataType.ts";
import {DataTypes} from "../DataType/DataTypes.ts";

export class BuilderExpression implements IExpression {
  startToken: Token;
  endToken: Token;

  constructor(
    public contextExpression: IExpression,
    public blockExpression: BlockExpression
  ) {
    this.startToken = contextExpression.startToken;
    this.endToken = blockExpression.endToken;
  }
  getRange() {
    return new Range(this.startToken.position, this.endToken.endPosition);
  }

  getType(): IDataType {
    return DataTypes.Void
  }

  toString(): string {
    throw new Error("Method not implemented.");
  }
}
