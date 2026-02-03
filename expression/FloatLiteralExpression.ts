import { ContentToken } from "../parseStack/tokenizer";
import { IExpression } from "./IExpression";

export class FloatLiteralExpression implements IExpression {
  public get value() {
    return parseFloat(this.token.content);
  }
  constructor(private token: ContentToken) {}

  get startToken() {
    return this.token;
  }
  get endToken() {
    return this.token;
  }

  toTypedExpression(): TypedFloatLiteral {
    return new TypedFloatLiteral(this);
  }
}
