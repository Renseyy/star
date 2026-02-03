
import { IExpression } from "./IExpression";
import {Token} from "../parseStack/tokenizer.ts";
import {RangedError} from "../RangedError.ts";
import {Environment} from "../Environment.ts";
import {IDataType} from "../DataType/IDataType.ts";
import {Range} from "../parseStack/parser.ts";

export class UnaryOperator implements IExpression {
  constructor(
    public operator: Token,
    public operand: IExpression,
    public isPrefix: boolean
  ) {}
  get startToken() {
    return this.isPrefix ? this.operator : this.operand.startToken;
  }
  get endToken() {
    return this.isPrefix ? this.operand.endToken : this.operator;
  }

  getRange(){
    return new Range(this.startToken.position, this.endToken.endPosition)
  }

  getType(environment: Environment): IDataType {
    const operandDataType = this.operand.getType(environment);
    const type = this.isPrefix ? 'prefix' : 'postfix'
    const resultDataType = operandDataType.resolveOperationDataType(this.operator, type as any)
    if(!resultDataType) {
      throw new RangedError(`Unsupported ${type} operator ${this.operator.type} on type ${operandDataType.name}`, this.getRange());
    }


    return resultDataType;
  }
}
