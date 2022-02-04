import { RenderConfigScreenCtx } from 'datocms-plugin-sdk';
import { Canvas, Form, FieldGroup, SwitchField, Spinner, TextField, Button } from 'datocms-react-ui';
import { useState } from 'react';
import { Params } from '../paramsTypes'

export default function ConfigScreen({ ctx }: { ctx: RenderConfigScreenCtx }) {
  const params = ctx.plugin.attributes.parameters as Params;

  const [apiKey, setApiKey] = useState(params.apiKey || "")
  const [freeMode, setFreeMode] = useState(params.freeMode || false)
  const [maxRequest, setMaxRequest] = useState(params.maxRequest || 5)

  const [loading, setLoading] = useState(false)

  const handleSubmit = () => {
    setLoading(true)
    ctx.updatePluginParameters({ apiKey, freeMode, maxRequest })
      .then(() => {
        setLoading(false)
        ctx.notice("Settings updated succesfully !")
      })
      .catch(e => {
        ctx.alert(`Error will saving setting : ${e}`)
      })
  }

  return (
    <Canvas ctx={ctx}>
      <h2>Config</h2>
      <Form >
        <FieldGroup>
          <TextField
            required
            name="apikey"
            id="apikey"
            label="Authentication key"
            value={apiKey}
            placeholder="XXXX-XXXX-XXXX-XXX"
            textInputProps={{
              disabled: loading
            }}
            hint="https://www.deepl.com/fr/pro-account/summary"
            onChange={value => setApiKey(value)}
          />
          <SwitchField
            name="free"
            id="free"
            label="Free plan"
            value={freeMode}
            switchInputProps={{
              disabled: loading,
              value: freeMode,
              id: 'free',
              name: 'free'
            }}
            onChange={value => setFreeMode(value)}
          />
          <TextField
            required
            name="maxrequest"
            id="maxrequest"
            textInputProps={
              {
                type: "number",
                min: 1,
                disabled: loading
              }
            }
            label="Max concurrent requests"
            value={maxRequest}
            placeholder="5"
            hint="One request will contain 50 fields"
            onChange={value => setMaxRequest(Number(value))}
          />
        </FieldGroup>
        <FieldGroup>
          {loading ? <Spinner /> :
            <Button
              fullWidth
              buttonType="primary"
              onClick={handleSubmit}
              disabled={loading}>
              SAVE
            </Button>}
        </FieldGroup>
      </Form>
      <p>Made with ❤️  at <a target="_blank" href="https://oeilpouroeilcreations.fr">https://oeilpouroeilcreations.fr</a> 👀</p>
    </Canvas >
  );
}
