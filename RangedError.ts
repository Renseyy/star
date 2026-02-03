import { Range } from "./parseStack/parser";

export class RangedError extends Error {
  constructor(message: string, public range: Range, public code?: string) {
    super(message);
  }
}
