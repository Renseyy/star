import { Range } from "../parseStack/parser";
import { Token } from "../parseStack/tokenizer";
import { RangedError } from "../RangedError";
import { IExpression } from "./IExpression";
import { IMemoryExpression } from "./IMemoryExpression";
import { BinaryOperator } from "./BinaryOperator";
import { hasMethods } from "../../utils/types";
import { Environment } from "../Environment.ts";
import { IDataType, DataTypeRelation } from "../DataType/IDataType.ts";
import { raise } from "../../utils/event.ts";
import { RangedHint, RangedHintType } from "../RangedHint.ts";
import { DataTypes } from "../DataType/DataTypes.ts";

export class AssignmentOperator extends BinaryOperator {
  public left: IMemoryExpression;
  constructor(
    public operator: Token,
    left: IExpression,
    public right: IExpression,
    public isConstAssignment: boolean
  ) {
    super(operator, left, right);
    console.log("AssignmentOperator", { isConstAssignment: isConstAssignment });
    if (!hasMethods<IMemoryExpression, IExpression>(left, "getKey")) {
      throw new RangedError(
        "Left side of assignment operator must be an memoryExpression",
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

    if (!environment.hasElement(leftKey)) {
      throw new RangedError(
        `${leftKey} is not declarated in current scope`,
        this.getRange()
      );
    }
    // Check if we can assign to this element
    const leftDataType = environment.getElement(leftKey) as IDataType;
    const relation = leftDataType.relationTo(rightDataType);
    if (relation === DataTypeRelation.generalization) {
      const clarifiedDataType = leftDataType.clarify(rightDataType);
      environment.setElement(leftKey, clarifiedDataType);
      raise(
        new RangedHint(
          `### Type clarification\nfrom \`${leftDataType}\` to \`${rightDataType}\``,
          RangedHintType.typeClarification,
          this.getRange()
        )
      );
    } else if (
      relation !== DataTypeRelation.superset &&
      relation !== DataTypeRelation.exact
    ) {
      throw new RangedError(
        `Cannot assign ${rightDataType} to ${leftDataType}`,
        this.getRange()
      );
    }
    if (this.isConstAssignment) {
      environment.setElement(leftKey, DataTypes.Const(rightDataType));
    }
    return rightDataType;
  }
}
