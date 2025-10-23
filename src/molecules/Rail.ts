import { Lightning as L } from '@lightningjs/sdk'
import { Tile } from '../atoms/Tile'

export class Rail extends L.Component {
  private _index = 0

  static override _template() {
    return {
      Title: { x: 32, y: 0, text: { text: '', fontSize: 32 } },
      Row: { x: 32, y: 62 },
    }
  }

  set title(v: string) {
    this.tag('Title').text.text = v
  }

  set items(v: Array<{ title: string }>) {
    this.tag('Row').children = v.map((it, i) => ({ type: Tile, title: it.title, x: i * 330 }))
  }

  override _init() {
    this._index = 0
  }
  override _getFocused() {
    return this.tag('Row').children[this._index]
  }
  override _handleLeft() {
    if (this._index > 0) this._index--
    return true
  }
  override _handleRight() {
    const max = this.tag('Row').children.length - 1
    if (this._index < max) this._index++
    return true
  }

  override _handleUp() {
    this.signal('focusPrev')
    return true
  }

  override _handleDown() {
    this.signal('focusNext')
    return true
  }
}
