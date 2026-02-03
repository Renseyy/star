import {DataTypeRelation, IDataType} from "./IDataType.ts";
import {Token} from "../parseStack/tokenizer.ts";
import {TokenType} from "../language.ts";
import {MaybeDataType} from "./MaybeDataType.ts";

export class SomeDataType implements IDataType{
    constructor(public type: IDataType) {
    }

    clarify(dataType: IDataType): IDataType {
        return dataType
    }
    toString(): string {
        return `Some ${this.type}`;
    }
    resolveOperationDataType(operator: Token, type: 'prefix' | 'postfix' | 'infix', _?: IDataType): IDataType | false {
        if(type == 'prefix' && operator.type === TokenType.OptionOperator){
            return new MaybeDataType(this.type, true);
        }
        return false
    }
    relationTo(other: IDataType): DataTypeRelation {
        if(other === this.type){
            return DataTypeRelation.generalization;
        }
        return DataTypeRelation.notRelated
    }
}