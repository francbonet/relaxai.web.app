import { Lightning as L } from '@lightningjs/sdk'
import { Theme } from '../core/theme'

export interface LogoSpec extends L.Component.TemplateSpec {
  Label?: L.Component
}

export default class Logo
  extends L.Component<LogoSpec>
  implements L.Component.ImplementTemplateSpec<LogoSpec>
{
  private _label = 'Napflix'

  get label(): string {
    return this._label
  }
  set label(v: string) {
    this._label = v
    this.patch({ Label: { text: { text: v } } })
  }

  static override _template(): L.Component.Template<LogoSpec> {
    return {
      w: 260,
      h: 72,
      rect: true,
      color: 0x00000000,
      Label: {
        y: 40,
        mountY: 0.5,
        text: {
          fontSize: Theme.typography.h1,
          fontStyle: 'bold',
          textColor: Theme.colors.accent,
          fontFace: 'sans-serif',
        },
      },
    }
  }
}
