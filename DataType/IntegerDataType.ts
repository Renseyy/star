import {BaseDataType} from "./BaseDataType.ts";
import {Token} from "../parseStack/tokenizer.ts";
import {IDataType} from "./IDataType.ts";
import {TokenType} from "../language.ts";
import {DataTypes} from "./DataTypes.ts";

export class IntegerDataType extends BaseDataType {
    public constructor() {
        super("Integer");
    }

    resolveOperationDataType(operator: Token, type: 'prefix' | 'postfix' | 'infix', other?: IDataType): IDataType | false {
        if(operator.type === TokenType.AdditionOperator){
            if(other === DataTypes.Integer && type){
                return DataTypes.Integer;
            }
            return false
        }
        return false
    }
}