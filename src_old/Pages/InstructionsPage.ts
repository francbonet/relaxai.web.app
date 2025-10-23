import { Lightning } from '@lightningjs/sdk'
export class InstructionsPage extends Lightning.Component {
  private _id: string | null = null
  static override _template() {
    return {
      Background: {
        rect: true,
        w: 1920,
        h: 1080,
        color: 0xff0000aa,
      },
      Label: { x: 120, y: 120, text: { text: 'INSTRUCTIONS', fontSize: 64 } },
      Sub: { text: '' },
      Container: {
        rect: true,
        w: 1300,
        h: 700,
        x: 1920 - 100, // marge dret de 100 px
        y: 1080 - 80, // marge inferior de 50 px
        mountX: 1,
        mountY: 1,
        color: 0xffff0000,
      },
    }
  }

  onParams(params?: Record<string, any>) {
    this._id = params?.id ?? null
    this.tag('Sub').patch({ text: { text: `id: ${this._id}` } })
  }

  onAppear() {
    this.patch({ alpha: 1 })
  }
  onDisappear() {
    this.patch({ alpha: 0.6 })
  }
}
