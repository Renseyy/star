import {Token} from "../parseStack/tokenizer.ts";
import {StringEnum} from "../../utils/constructs.ts";

export const DataTypeRelation = StringEnum(
    'notRelated',
    'generalization',
    'superset',
    'exact',
    'subset',
    'clarification'
)

export type DataTypeRelation = typeof DataTypeRelation[keyof typeof DataTypeRelation];

export interface IDataType {

  resolveOperationDataType(operator: Token, type: 'prefix'): IDataType | false
  resolveOperationDataType(operator: Token, type: 'postfix'): IDataType | false
  resolveOperationDataType(operator: Token, type: 'infix', other: IDataType): IDataType | false

  relationTo(other: IDataType): DataTypeRelation

  /*
  * Returns 'clarification' of variable
  * */
  clarify(dataType: IDataType): IDataType

  toString(): string
}