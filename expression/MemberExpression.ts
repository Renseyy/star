import { hasMethods } from "../../utils/types";
import { RangedError } from "../RangedError";
import { MemoryInfo, Context, MemoryKey } from "../Context";
import { BinaryOperator } from "./BinaryOperator";
import { IMemoryExpression } from "./IMemoryExpression";
import { IExpression } from "./IExpression";
import { Token } from "../parseStack/tokenizer";

export class MemberExpression
  extends BinaryOperator
  implements IMemoryExpression
{
  public isMemoryExpression: true = true;
  public left: IMemoryExpression;
  public right: IMemoryExpression;
  constructor(public operator: Token, left: IExpression, right: IExpression) {
    super(operator, left, right);
    if (!hasMethods<IMemoryExpression, IExpression>(left, "getMemoryInfo")) {
      console.log("LEFT", left);
      throw new RangedError(
        "left side of member operator must have [memoryInfo]",
        left.getRange()
      );
    }
    this.left = left;
    if (!hasMethods<IMemoryExpression, IExpression>(right, "getMemoryInfo")) {
      throw new RangedError(
        "right side of member operator must have [memoryInfo]",
        right.getRange()
      );
    }
    this.right = right;
  }
  getContext(): Context {
    throw new Error("Method not implemented.");
  }
  getKey(): MemoryKey {
    throw new Error("Method not implemented.");
  }
  getMemoryInfo(context: Context): MemoryInfo {
    const leftInfo = this.left.getMemoryInfo(context);
    const memoryElement = leftInfo.memoryElement;
    if (!memoryElement) {
      throw new RangedError("element is not defined", this.left.getRange());
    }
    return this.right.getMemoryInfo(memoryElement);
  }
}
