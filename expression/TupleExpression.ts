import { IDataType } from "../DataType/IDataType";
import { Environment } from "../Environment";
import { Range } from "../parseStack/parser";
import { Token } from "../parseStack/tokenizer";
import { IExpression } from "./IExpression";

export class TupleExpression implements IExpression {
  constructor(
    public startToken: Token,
    public endToken: Token,
    expressions: IExpression[],
    public isTypedContext: boolean = false
  ) {
    // Check for validity of expression
  }
  abstracta;

  getType(environment: Environment): IDataType {}
  toString(): string {
    throw new Error("Method not implemented.");
  }
  getRange() {
    return new Range(this.startToken.position, this.endToken.endPosition);
  }
}
