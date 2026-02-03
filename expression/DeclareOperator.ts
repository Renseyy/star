import { Range } from "../parseStack/parser";
import { Token } from "../parseStack/tokenizer";
import { RangedError } from "../RangedError";
import { IExpression } from "./IExpression";
import { IMemoryExpression } from "./IMemoryExpression";
import { BinaryOperator } from "./BinaryOperator";
import { hasMethods } from "../../utils/types";
import { Environment } from "../Environment.ts";
import { IDataType } from "../DataType/IDataType.ts";
import { raise } from "../../utils/event.ts";
import { RangedHint, RangedHintType } from "../RangedHint.ts";

export class DeclareOperator extends BinaryOperator {
  public left: IMemoryExpression;
  constructor(
    public operator: Token,
    left: IExpression,
    public right: IExpression,
    public isConstDeclaration: boolean
  ) {
    super(operator, left, right);
    if (!hasMethods<IMemoryExpression, IExpression>(left, "getKey")) {
      throw new RangedError(
        "Left side of declare operator must be an memoryExpression",
        left.getRange()
      );
    }
    this.left = left;
  }
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
    const rightDataType = this.right.getType(environment);

    const leftKey = this.left.getKey();

    if (environment.hasOwnElement(leftKey)) {
      throw new RangedError(
        `${leftKey} is already declarated in current scope`,
        this.getRange()
      );
    }
    environment.setElement(leftKey, rightDataType);
    raise(
      new RangedHint(
        `### Variable\nname: \`${leftKey}\`  \ntype: \`${rightDataType}\``,
        RangedHintType.hover,
        this.left.getRange()
      )
    );
    return rightDataType;
  }
}
