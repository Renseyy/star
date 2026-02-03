import { Range } from "./parseStack/parser";
import {Enum} from "../utils/constructs.ts";

export const RangedHintType = Enum(
    "typeClarification",
    "memoryAllocation",
    "spellingError",
    "deprecatedInfo",
    "inlineHint",
    "hover",
    "error"
)
export type RangedHintType = typeof RangedHintType[keyof typeof RangedHintType];
export class RangedHint {
  constructor(public content: string, public type: RangedHintType, public range: Range) {
  }
}
