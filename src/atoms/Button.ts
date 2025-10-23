import { Lightning as L } from '@lightningjs/sdk'
import { Theme } from '../core/theme'

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
  private static rr(w = 240, h = 64) {
    const Tools = (L as any).Tools
    return Tools?.getRoundRect(w, h, 8, 2, 0x22ffffff, Theme.colors.accent)
  }

  static override _template(): L.Component.Template<ButtonSpec> {
    return {
      w: 240,
      h: 64,
      texture: Button.rr(240, 64), // 👈 Lightning.Tools.getRoundRect
      Label: { x: 120, y: 34, mount: 0.5, text: { text: '', fontSize: 28 } },
      transitions: { scale: { duration: 0.2 } },
    }
  }

  override _focus() {
    this.scale = 1.05
  }
  override _unfocus() {
    this.scale = 1
  }
}
