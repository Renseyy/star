import { IDataType } from "../DataType/IDataType.ts";
import { IExpression } from "../expression/IExpression";
import { IntegerLiteralExpression } from "../expression/IntegerLiteralExpression";
import { RangedError } from "../RangedError";

export class DataTypeChecer {
  public inferDataType(expression: IExpression): IDataType {
    if (expression instanceof IntegerLiteralExpression) {
      return IDataType.Integer;
    }
    throw new RangedError(
      "Cannot infer data type of expression",
      expression.range
    );
  }
}
