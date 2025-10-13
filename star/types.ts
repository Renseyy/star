export type Archetype<
	T extends string = string,
	U extends Record<string, any> = Record<string, any>,
	Parents extends string[] = []
> = {
	$: [...Parents, T];
} & U;

export type TypeHandler = Archetype;

export function constructType<
	Name extends string,
	Fields extends Record<string, TypeHandler>
>(name: Name): { new: (fields: Fields) => Archetype<Name, Fields> };

export function constructType<
	Name extends string,
	Fields extends Record<string, TypeHandler>,
	Parent extends Archetype
>(
	name: Name,
	parent: Parent
): { new: (fields: Fields) => Archetype<Name, Fields, Parent['$']> };
export function constructType<
	Name extends string,
	Fields extends Record<string, TypeHandler>,
	Parent extends Archetype
>(
	name: Name,
	parent?: Parent
): { new: (fields: Fields) => Archetype<Name, Fields, Parent['$']> } {
	const parentStrings: string[] = parent ? parent.$ : [];
	return {
		new: (fields: Fields) =>
			({
				...fields,
				$: [...parentStrings, name],
			} as Archetype<Name, Fields, Parent['$']>),
	};
}

export type ObjectType<T extends () => Archetype> = ReturnType<T>;

export type BindingPower = Archetype<'BindingPower', { bindingPower: number }>;

export const Constant = constructType('Constant');
const someConst = Constant.new({});

export const NumberConstant = constructType('NumberConstant', someConst);

export const BindingPower = constructType('BindingPower');
