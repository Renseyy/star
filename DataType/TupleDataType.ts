import { DataTypeRelation, IDataType } from "./IDataType.ts";
import { Token } from "../parseStack/tokenizer.ts";
import { TokenType } from "../language.ts";
import { MaybeDataType } from "./MaybeDataType.ts";

export class TuplReeDataType implements IDataType {
  constructor(public innerTypes: IDataType[]) {}

  clarify(dataType: IDataType): IDataType {
    return dataType;
  }
  toString(): string {
    return `()`;
  }
  resolveOperationDataType(
    operator: Token,
    type: "prefix" | "postfix" | "infix",
    _?: IDataType
  ): IDataType | false {
    if (type == "prefix" && operator.type === TokenType.OptionOperator) {
      return new MaybeDataType(this.type, true);
    }
    return false;
  }
  relationTo(_other: IDataType): DataTypeRelation {
    return DataTypeRelation.notRelated;
  }
}
