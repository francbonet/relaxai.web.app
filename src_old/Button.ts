import { Lightning } from '@lightningjs/sdk'

export class Button extends Lightning.Component<Lightning.Component.TemplateSpecLoose> {
  static override _template(): Lightning.Component.Template<Lightning.Component.TemplateSpecLoose> {
    return {
      w: 360,
      h: 96,
      rect: true,
      color: 0xff222222,
      rtt: false,
      Label: {
        mount: 0.5,
        x: (w: number) => w / 2,
        y: (h: number) => h / 2,
        text: { text: 'Hola', fontFace: 'Regular', fontSize: 48, textColor: 0xffffffff },
      },
    }
  }

  set label(v: string) {
    this.tag('Label').patch({ text: { text: v } })
  }

  override _focus() {
    this.patch({ color: 0xff2f80ed })
  }

  override _unfocus() {
    this.patch({ color: 0xff222222 })
  }

  override _handleEnter() {
    this.signal('pressed', { label: this.tag('Label').text?.text })
    return true
  }
}
