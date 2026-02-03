import {Token} from "../parseStack/tokenizer.ts";
import {DataTypeRelation, IDataType} from "./IDataType.ts";

export class BaseDataType implements IDataType {
    constructor(public name: string) {}

    resolveOperationDataType(_: Token, __: string, ___?: IDataType): IDataType | false {return false}

    relationTo(other: IDataType): DataTypeRelation {return this == other ? DataTypeRelation.exact : DataTypeRelation.notRelated;}

    /*
    * Returns 'clarification' of variable
    * */
    clarify(dataType: IDataType): IDataType {
        return dataType;
    }

    toString(): string{
        return this.name
    }
}