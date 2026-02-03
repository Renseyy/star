import { DataTypeRelation, IDataType } from "./IDataType.ts";
import { Token } from "../parseStack/tokenizer.ts";
import { TokenType } from "../language.ts";
import { MaybeDataType } from "./MaybeDataType.ts";

export class UserDefinedType implements IDataType {
  constructor() {}

  clarify(dataType: IDataType): IDataType {
    return dataType;
  }
  toString(): string {
    return `UserDefinedType`;
  }
  resolveOperationDataType(
    operator: Token,
    type: "prefix" | "postfix" | "infix",
    _?: IDataType
  ): IDataType | false {
    return false;
  }
  relationTo(_other: IDataType): DataTypeRelation {
    return DataTypeRelation.notRelated;
  }
}
