import { DataTypes } from "../DataType/DataTypes";
import { IDataType } from "../DataType/IDataType";
import { UserDefinedType } from "../DataType/UserDefinedDataType";
import { Environment } from "../Environment";
import { Range } from "../parseStack/parser";
import { Token } from "../parseStack/tokenizer";
import { IExpression } from "./IExpression";

export class GroupExpression implements IExpression {
  constructor(
    public startToken: Token,
    public endToken: Token,
    public expressions: IExpression[],
    public isTypedContext: boolean = false
  ) {
    console.log("GroupExpression", { isTypedContext: isTypedContext });
  }

  getType(environment: Environment): IDataType {
    if (this.isTypedContext) {
      return new UserDefinedType();
    }
    return DataTypes.Void;
  }
  toString(): string {
    throw new Error("Method not implemented.");
  }
  getRange() {
    return new Range(this.startToken.position, this.endToken.endPosition);
  }
}
