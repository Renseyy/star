import { Range } from "../parseStack/parser";
import { Token } from "../parseStack/tokenizer";
import { IDataType } from "../DataType/IDataType.ts";
import { Environment } from "../Environment.ts";

export interface IExpression {
  startToken: Token;
  endToken: Token;
  getType(environment: Environment): IDataType;
  toString(): string;
  getRange: () => Range;
  atBaking: boolean;
}
