import deepl, { Translate } from "./deepl"
import { Field, Fields, IIndexable } from './fieldsTypes'
import { Params } from "./paramsTypes";
import { forEachOfLimit } from "async-es"
//import { ItemAttributes } from "datocms-plugin-sdk/dist/types/SiteApiSchema";

const chunks = (array: Array<any>, chunkSize: number) => {
  const chunkedArr = [];
  let counter = 0;
  while (counter < array.length) {
    chunkedArr.push(array.slice(counter, counter + chunkSize));
    counter += chunkSize;
  } return chunkedArr;
}

type UpdateField = (fields: Fields) => Promise<void | Array<void>>
type MakeUpdateFields = ({ translate, source, target }: { translate: Translate, source: string, target: string }) => UpdateField
const makeUpdateFields: MakeUpdateFields = ({ translate, source, target }) => {
  return async (fields) => {
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
          }
          )
        )
      )
  }
}

const removeEmptyFieldValue = (fields: Fields, override: boolean, source: string, target: string): Fields => {
  return fields.filter(field => {
    const sourceContent = field.valueByLocale(source)
    if (!sourceContent || sourceContent.trim().length === 0) {
      return false
    } else if (!override) {
      const targetContent = field.valueByLocale(target)
      if (targetContent && targetContent.trim().length > 0) {
        return false
      } else {
        return true
      }
    }
  })
}

export type Translator = ({ source, target, override }: { source: string, target: string, override: boolean }) => Promise<void>
export type MakeTranslator = ({ params, fields }: { params: Params, fields: Fields }) => Translator

const makeTranslator: MakeTranslator = ({ params, fields }) => {
  const makeTranslateWithLangs = deepl.makeTranslate({ key: params.apiKey, free: params.freeMode })
  return ({ source, target, override }) => {
    const cleanFields = removeEmptyFieldValue(fields, override, source, target)
    const fieldsChunks = chunks(cleanFields, 50)

    const translate = makeTranslateWithLangs(source, target)
    const updateFields = makeUpdateFields({ translate, source, target })
    return forEachOfLimit(fieldsChunks, params.maxRequest, updateFields)
  }
}

export default makeTranslator

      // https://www.datocms.com/docs/plugin-sdk/working-with-form-values
      // https://github.com/SKLINET/datocms-plugin-deepl-translate-button/blob/main/src/index.js
      //https://github.com/marcelofinamorvieira/record-comments/blob/9d5595337fbbe21506ad03cc5fc85eca470bc250/src/entrypoints/CommentsBar.tsx
      //https://github.com/datocms/plugins/blob/78a524d1a00cf57596db8e6d3a92e0c6e0f934f0/notes/src/entrypoints/NotesSidebar.tsx
      //https://github.com/commercelayer/dato-plugin/blob/75861d4c3df50896e6df38b8319bbda41b2b774c/src/entrypoints/FieldExtension.tsx
      // --> ca depend du format (meme si on aura markdown dans tout les cas, tout le temps)
// https://github.com/Eurac-Research/datocms-plugin-deepl-translate-from-original/blob/master/src/index.js
