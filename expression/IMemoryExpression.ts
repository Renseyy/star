import { IExpression } from "./IExpression";
import { Context, MemoryInfo, MemoryKey } from "../Context.ts";

export interface IMemoryExpression extends IExpression {
  getMemoryInfo(context: Context): MemoryInfo;
}
