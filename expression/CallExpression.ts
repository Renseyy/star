import { IDataType } from "../DataType/IDataType";
import { Environment } from "../Environment";
import { TokenType } from "../language";
import { Range } from "../parseStack/parser";
import { Token } from "../parseStack/tokenizer";
import { RangedError } from "../RangedError";
import { GroupExpression } from "./GroupExpression";
import { IExpression } from "./IExpression";

export class CallExpression implements IExpression {
  constructor(
    public callee: IExpression,
    public parameters: GroupExpression,
    public startToken: Token,
    public endToken: Token
  ) {}
  getType(environment: Environment): IDataType {
    const calleeType = this.callee.getType(environment);
    const resolvedDataType = calleeType.resolveOperationDataType(
      TokenType.AdditionOperator,
      "postfix"
    );
    if (!resolvedDataType) {
      throw new RangedError(
        `Unsupported operator call on type ${calleeType}`,
        this.getRange()
      );
    }
    return resolvedDataType;
  }
  getRange() {
    return new Range(this.startToken.position, this.endToken.endPosition);
  }

  toString(): string {
    throw new Error("Method not implemented.");
  }
}
