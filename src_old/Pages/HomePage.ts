import { Lightning } from '@lightningjs/sdk'
export class HomePage extends Lightning.Component {
  private _id: string | null = null
  static override _template() {
    return {
      Background: {
        rect: true,
        w: 1920,
        h: 1080,
        color: 0xff0000ff,
      },
      Label: { x: 120, y: 120, text: { text: 'HOME', fontSize: 64 } },
      Sub: { text: '' },
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
