import { RenderItemFormSidebarPanelCtx } from "datocms-plugin-sdk"
import { Field as DatoField } from "datocms-plugin-sdk"
import { IIndexable, Field, Fields, ValueByLocale, UpdateDatoValue } from "./fieldsTypes"
import { marked } from "marked"
import Turndown from "turndown"

const turndownService = new Turndown();

export const isValidObject = (field: any): boolean =>
  (typeof field === 'object' && !Array.isArray(field) && field !== null)

type SetFieldValue = (path: string, value: unknown) => Promise<void>

type ValueBehavior = {
  validate: (value: any) => boolean,
  makeGetter: (item: IIndexable) => ValueByLocale,
  makeUpdater: (api_key: string, setFieldValue: SetFieldValue, item: IIndexable) => UpdateDatoValue
}

const defaultBehavior: ValueBehavior = {
  validate: (value) => typeof value === "string",
  makeGetter: (item) =>
    (locale) => {
      const value = item[locale]
      if (value) return marked.parse(value)
      else return undefined
    },
  makeUpdater: (api_key, setFieldValue) =>
    (_, target, value) => {
      if (!value) return Promise.reject(`Error with: ${api_key}`)
      const mdValue = turndownService.turndown(value)
      return setFieldValue(api_key + '.' + target, mdValue)
    }
}

// NOTE: doesn't work as expected, need to investigate to support alt text
//const assetBehavior: ValueBehavior = {
//  validate: (value) => isValidObject(value) && Object.hasOwnProperty('alt'),
//  makeGetter: (item) =>
//    (locale) => {
//      const value = item[locale]
//      if (!value || !value.alt) return undefined
//      else return value.alt
//    },
//  makeUpdater: (api_key, setFieldValue, item) =>
//    (locale, value) => setFieldValue(api_key + '.' + locale, { ...item, alt: value })
//}
//
type modularObj = {
  content: string
}

const modularBehavior: ValueBehavior = {
  validate: (value) => Array.isArray(value),
  makeGetter: (item) =>
    (locale) => {
      const value: Array<modularObj> = item[locale]
      if (!value) return undefined
      return value.reduce((acc, v) => {
        if (v.content) acc += `${marked.parse(v.content)}`
        acc += `<$$/>`
        return acc
      }, "")
    },
  makeUpdater: (api_key, setFieldValue, item) =>
    (source, target, value) => {
      const sourceValues = item[source] as Array<modularObj>
      const content = value.split('<$$/>')
      const newValue = sourceValues.map((sourceValue, index) => {
        return { ...sourceValue, content: turndownService.turndown(content[index]) }
      })
      return setFieldValue(api_key + '.' + target, newValue)

    }
}

const valueBehaviors: Array<ValueBehavior> = [
  defaultBehavior,
  modularBehavior
  // assetBehavior
]

const fromDatoItem = (item: IIndexable, api_key: string, setFieldValue: SetFieldValue): Field | undefined => {
  const itemValue = Object.values(item).find((value: any) => value)
  if (!itemValue) return undefined
  const behavior = valueBehaviors.find(behavior => behavior.validate(itemValue))
  if (!behavior) return undefined

  return {
    valueByLocale: behavior.makeGetter(item),
    updateDatoValue: behavior.makeUpdater(api_key, setFieldValue, item)
  }
}

const makeDatoIntlFields = (allDatoFields: Array<DatoField>): IIndexable =>
  allDatoFields.reduce((acc, datoField) => {
    if (datoField.attributes.localized) {
      acc[datoField.id] = datoField.attributes
    }
    return acc
  }, {} as IIndexable)

export const make = async (ctx: RenderItemFormSidebarPanelCtx, setFieldValue: SetFieldValue) =>
  ctx.loadItemTypeFields(ctx.itemType.id)
    .then((allDatoFields: Array<DatoField>) => {
      const datoFields = makeDatoIntlFields(allDatoFields)
      const datoItems = ctx.formValues

      return ctx.itemType.relationships.fields.data.reduce((acc, fieldData) => {
        const datoField = datoFields[fieldData.id]
        if (!datoField) {
          return acc
        }

        const api_key = datoField.api_key
        const item = datoItems[api_key] as IIndexable
        if (!item || !isValidObject(item)) return acc

        const field = fromDatoItem(item, api_key, setFieldValue)
        if (field) acc.push(field)

        return acc
      }, [] as Fields)
    })

export default { make }


