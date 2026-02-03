import { go } from "../../utils/go";
import { Range } from "../parseStack/parser";
import { IExpression } from "./IExpression";
import { raise } from "../../utils/event";
import {Token} from "../parseStack/tokenizer.ts";
import {Environment} from "../Environment.ts";
import {IDataType} from "../DataType/IDataType.ts";
import {RangedError} from "../RangedError.ts";
import {DataTypes} from "../DataType/DataTypes.ts";

export class BlockExpression implements IExpression {
  constructor(
    public startToken: Token,
    public endToken: Token,
    public expressions: IExpression[]
  ) {}
  getRange() {
    return new Range(this.startToken.position, this.endToken.endPosition);
  }

  getType(environment: Environment): IDataType {
    let lastType: IDataType = DataTypes.Void
    const innerEnvironment = new Environment(environment)
    for (const expression of this.expressions) {
      const [error, dataType] = go<RangedError, IDataType>(() =>
        expression.getType(innerEnvironment)
      );
      if (error) {
        raise(error);
      }else {
        lastType = dataType;
      }
    }
    return lastType
  }
  toString(): string {
    throw new Error("Method not implemented");
  }
}
