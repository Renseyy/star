import { Token } from "../parseStack/tokenizer.ts";
import {IDataType, DataTypeRelation} from "./IDataType.ts";

export class MaybeDataType implements IDataType {
    constructor(public type: IDataType, public currentIsNone: boolean = false) {
    }

    resolveOperationDataType(operator: Token, type: "prefix"): IDataType | false;
    resolveOperationDataType(operator: Token, type: "postfix"): IDataType | false;
    resolveOperationDataType(operator: Token, type: "infix", other: IDataType): IDataType | false;
    resolveOperationDataType(_operator: unknown, _type: unknown, _other?: unknown): false | IDataType {
        throw new Error("Method not implemented.");
    }
    clarify(_dataType: IDataType): IDataType {
        throw new Error("Method not implemented.");
    }

    relationTo(other: IDataType): DataTypeRelation
    {
        if(other === this.type){
            return DataTypeRelation.superset;
        }
        return DataTypeRelation.notRelated
    }

    toString(): string {
        return `Maybe[${this.type.toString()}] With ${this.currentIsNone ? 'None' : this.type.toString()}`
    }
}