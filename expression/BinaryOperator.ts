import { Range } from "../parseStack/parser";
import { Token } from "../parseStack/tokenizer";
import { IExpression } from "./IExpression";
import {Environment} from "../Environment.ts";
import {IDataType} from "../DataType/IDataType.ts";
import {RangedError} from "../RangedError.ts";

export class BinaryOperator implements IExpression {
  constructor(
    public operator: Token,
    public left: IExpression,
    public right: IExpression
  ) {}
  toString(): string {
    throw new Error("Method not implemented.");
  }
  getRange() {
    return new Range(this.startToken.position, this.endToken.endPosition);
  }
  get startToken() {
    return this.left.startToken;
  }
  get endToken() {
    return this.right.endToken;
  }

  getType(environment: Environment): IDataType {
    const rightType = this.right.getType(environment);
    const leftType = this.left.getType(environment);

    const resultDataType = leftType.resolveOperationDataType(this.operator, 'infix', rightType)
    if(!resultDataType) {
      throw new RangedError(`Unsupported binary operation ${this.operator.type} on type ${leftType.name} with ${rightType.name}`, this.getRange());
    }


    return resultDataType;
  }
}
