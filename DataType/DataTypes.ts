import {IDataType} from "./IDataType.ts";
import {MaybeDataType} from "./MaybeDataType.ts";
import {SomeDataType} from "./SomeDataType.ts";
import {IntegerDataType} from "./IntegerDataType.ts";
import {BaseDataType} from "./BaseDataType.ts";
import {ConstDataType} from "./ConstDataType.ts";

export const DataTypes = {
    Integer: new IntegerDataType(),
    String: new BaseDataType("String"),
    Void: new BaseDataType("Void"),
    Some: (innerType: IDataType) => new SomeDataType(innerType),
    Const: (innerType: IDataType) => new ConstDataType(innerType),
    Maybe: (innerType: IDataType, currentIsNone: boolean = true) => new MaybeDataType(innerType, currentIsNone)
}