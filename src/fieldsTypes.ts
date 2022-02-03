// https://stackoverflow.com/questions/34727936/typescript-bracket-notation-property-access
export interface IIndexable<T = any> { [key: string]: T }

//export type Field = {
//  id: string,
//  api_key: string,
//  item: IIndexable
//}

export type ValueByLocale = (locale: string) => string | undefined
export type UpdateDatoValue = (source: string, target: string, value: string) => Promise<void>

export type Field = {
  valueByLocale: ValueByLocale,
  updateDatoValue: UpdateDatoValue
}

export type Fields = Array<Field>

