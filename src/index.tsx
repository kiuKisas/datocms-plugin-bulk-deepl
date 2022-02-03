import { connect, RenderItemFormSidebarPanelCtx } from 'datocms-plugin-sdk';
import { Canvas } from 'datocms-react-ui';
import { Params } from './paramsTypes';
import { make as makeFields } from './fields'
import { render } from './render';
import ConfigScreen from './entrypoints/ConfigScreen';
import Sidebar from './entrypoints/Sidebar';
import makeTranslator from './translator'
import 'datocms-react-ui/styles.css';


connect({
  renderConfigScreen(ctx) {
    return render(<ConfigScreen ctx={ctx} />);
  },
  itemFormSidebarPanels() {
    return [
      {
        id: 'bulk-deepl',
        label: 'Translate with deepl',
        startOpen: false,
      },
    ];
  },
  renderItemFormSidebarPanel(id: string, ctx: RenderItemFormSidebarPanelCtx) {
    if (id !== 'bulk-deepl') return
    const params = ctx.plugin.attributes.parameters as Params
    const locales = {
      current: ctx.locale,
      main: ctx.site.attributes.locales[0]
    }
    const initTranslator = () => makeFields(ctx, ctx.setFieldValue)
      .then(fields => makeTranslator({ params, fields }))

    render(
      <Canvas ctx={ctx}>
        <Sidebar initTranslator={initTranslator} locales={locales} ctx={ctx} />
      </Canvas>
    )
  }
});
