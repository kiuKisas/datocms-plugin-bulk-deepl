// NOTE: https://www.deepl.com/fr/docs-api/translating-text/request/
import { IIndexable } from "./fieldsTypes"

export type DeeplCredentials = { key: string, free: boolean }

export type Translate = (content: Array<string>) => Promise<Array<string>>
export type MakeTranslateWithLangs = (from: string, to: string) => Translate

export type DeeplContent = Array<string>

export type TranslateResponse = {
  translations: Array<{
    text: string
  }>
}

export type UsageResponse = {
  character_count: number,
  character_limit: number
}

const freeUrl = "https://api-free.deepl.com/v2/"
const proUrl = "https://api.deepl.com/v2/"

export type MakeTranslate = (credentials: DeeplCredentials) => MakeTranslateWithLangs
const makeTranslate: MakeTranslate = ({ key, free }) => {
  const url = (free ? freeUrl : proUrl) + 'translate'
  return (from, to) => async (content) => {
    const contentText = content.map(c => `text=${encodeURIComponent(c)}`).join("&")
    const body = `auth_key=${key}&tag_handling=xml&source_lang=${from}&target_lang=${to}&${contentText}`
    return fetch(url, {
      body,
      method: "POST",
      headers: new Headers({
        "Content-type": "application/x-www-form-urlencoded",
      })
    }).then(async resp => {
      if (!resp.ok) return Promise.reject("A error occured with Deepl. Please check your account.")
      return resp.json().then(data =>
        Promise.resolve(data["translations"].map(
          (translation: IIndexable) => translation.text)
        )
      )
    })
  }
}

export type Usage = (credentials: DeeplCredentials) => Promise<UsageResponse>
const usage: Usage = async ({ key, free }) => {
  const url = (free ? freeUrl : proUrl) + 'usage'
  return fetch(url, {
    method: "GET",
    mode: 'no-cors',
    headers: new Headers({
      "Authorization": 'DeepL-Auth-Key ' + key
    })
  }).then(async resp => {
    if (!resp.ok) return Promise.reject(resp.statusText)
    return resp.json().then(data => {
      return Promise.resolve(data)
    })
  })
}

export default { makeTranslate, usage }
