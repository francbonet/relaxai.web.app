import { Lightning as L } from '@lightningjs/sdk'
import { Theme, Typography } from '../core/theme'

export interface ButtonSpec extends L.Component.TemplateSpec {
  Label: L.Component
}

export class Button
  extends L.Component<ButtonSpec>
  implements L.Component.ImplementTemplateSpec<ButtonSpec>
{
  private _label = ''

  get label() {
    return this._label
  }
  set label(v: string) {
    this.tag('Label')?.patch({ text: { text: v } })
  }

  // helper per evitar que TS es queixi si 'Tools' no està tipat
  private static rr(w = 300, h = 80) {
    const Tools = (L as any).Tools
    return Tools?.getRoundRect(w, h, 8, 2, 0xffffff, 0xffffff)
  }

  static override _template(): L.Component.Template<ButtonSpec> {
    return {
      mount: 0,
      w: 300,
      h: 80,
      texture: Button.rr(300, 80),
      color: Theme.colors.text,
      Label: {
        x: 25,
        y: 15,
        mountX: 0,
        mountY: 0,
        text: {
          text: '',
          fontFace: Typography.button.face,
          fontSize: Typography.button.size,
          textColor: Theme.colors.bg,
        },
      },
    }
  }

  override _focus() {
    this.scale = 1
  }
  override _unfocus() {
    this.scale = 1
  }
}
