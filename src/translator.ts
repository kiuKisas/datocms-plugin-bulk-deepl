import deepl, { Translate } from "./deepl"
import { Fields } from './fieldsTypes'
import { Params } from "./paramsTypes";
import async from 'async';

const chunks = (array: Array<any>, chunkSize: number) => {
  const chunkedArr = [];
  let counter = 0;
  while (counter < array.length) {
    chunkedArr.push(array.slice(counter, counter + chunkSize));
    counter += chunkSize;
  } return chunkedArr;
}

type UpdateField = (fields: Fields, fn: async.ErrorCallback | undefined) => Promise<void>
type MakeUpdateFields = ({ translate, source, target }: { translate: Translate, source: string, target: string }) => UpdateField
const makeUpdateFields: MakeUpdateFields = ({ translate, source, target }) => {
  return async (fields, fn) => {
    const content = fields.reduce((acc, field) => {
      const value = field.valueByLocale(source)
      if (value) acc.push(value)
      return acc
    }, [] as Array<string>)
    return translate(content)
      .then(deeplContent =>
        Promise.all(
          fields.map(async (field, index) => {
            const text = deeplContent[index]
            return field.updateDatoValue(source, target, text)
          })
        ).then(() => fn ? fn() : Promise.resolve())
          .catch((e) => fn ? fn(e) : Promise.reject(e))
      )
  }
}

const removeEmptyFieldValue = (fields: Fields, override: boolean, source: string, target: string): Fields => fields.filter(field => {
  const sourceContent = field.valueByLocale(source)
  if (!sourceContent || sourceContent.trim().length === 0) {
    return false
  } else if (!override) {
    const targetContent = field.valueByLocale(target)
    return !(targetContent && targetContent.trim().length > 0)
  } else return true
})

export type Translator = ({ source, target, override }: { source: string, target: string, override: boolean }, fn: async.ErrorCallback) => void
export type MakeTranslator = ({ params, fields }: { params: Params, fields: Fields }) => Translator

const makeTranslator: MakeTranslator = ({ params, fields }) => {
  const makeTranslateWithLangs = deepl.makeTranslate({ key: params.apiKey, free: params.freeMode })
  return async ({ source, target, override }, fn) => {
    const cleanFields = removeEmptyFieldValue(fields, override, source, target)
    const fieldsChunks = chunks(cleanFields, 50)

    const translate = makeTranslateWithLangs(source, target)
    const updateFields = makeUpdateFields({ translate, source, target })
    return async.forEachLimit(fieldsChunks, params.maxRequest, updateFields, fn)
  }
}

export default makeTranslator
