import React, { useState } from "react";
import { RenderItemFormSidebarPanelCtx } from "datocms-plugin-sdk";
import { Locales } from '../paramsTypes'

import { Button, Form, SelectField, SwitchField, FieldGroup, Spinner } from 'datocms-react-ui'
//import { JsxElement } from 'typescript';
import langs from '../langs.json'
import { Translator } from '../translator'
import s from '../styles.module.css';

type InitTranslator = () => Promise<Translator>

const findLangByValue = (value: string) => langs.find(lang => lang.value === value)

export default function Sidebar({ locales, initTranslator, ctx }: { locales: Locales, initTranslator: InitTranslator, ctx: RenderItemFormSidebarPanelCtx }) {

  const [source, setSource] = useState(locales.main)
  const [target, setTarget] = useState(locales.current)
  const [override, setOverride] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [errMsg, setErrMsg] = useState("")

  const handleSubmit = async () => {
    setError(false)
    setLoading(true)
    await initTranslator().then(translator =>
      translator({ source, target, override })
        .then(() => {
          console.log("YOOOOO")
          setLoading(false)
          ctx.notice("SUCCESS !")
        })
        .catch((e: Error) => {
          setError(true)
          setLoading(false)
          ctx.alert(e.message)
          setErrMsg(e.message)
        }))
  }
  return (
    <Form >
      <FieldGroup >
        <SelectField
          required
          name="source"
          id="source"
          label="Source"
          onChange={value => value !== null && setSource(value.value)}
          value={findLangByValue(source)}
          selectInputProps={{
            isMulti: false,
            options: langs
          }}
        />
        <SelectField
          required
          name="target"
          id="target"
          label="Target"
          onChange={value => value !== null && setTarget(value.value)}
          value={findLangByValue(target)}
          selectInputProps={{
            isMulti: false,
            options: langs
          }}
        />
        <SwitchField
          name="override"
          id="override"
          label="Override target content"
          hint="By default, this plugins keep the current content in the target"
          value={override}
          onChange={value => setOverride(value)}
        />
      </FieldGroup>
      <FieldGroup>
        {error && <p className={s.error}>{errMsg}</p>}
        {loading ? <Spinner /> :
          <Button
            fullWidth
            buttonType="primary"
            onClick={handleSubmit}
            disabled={loading}>
            Translate
          </Button>}
      </FieldGroup>
    </Form>
  )
}
