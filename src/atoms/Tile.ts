import { Lightning as L } from '@lightningjs/sdk'
import { Theme } from '../core/theme'

export interface TileSpec extends L.Component.TemplateSpec {
  Poster: L.Component
  Title: L.Component
  FocusRing: L.Component
}

export class Tile
  extends L.Component<TileSpec>
  implements L.Component.ImplementTemplateSpec<TileSpec>
{
  private _title = ''

  get titleElement() {
    return this.tag('Title')
  }

  get title() {
    return this._title
  }

  set title(v: string) {
    this._title = v
    this.titleElement?.patch({ text: { text: v } })
  }

  get poster() {
    return this.tag('Poster')
  }

  static override _template(): L.Component.Template<TileSpec> {
    return {
      w: 300,
      h: 170,
      rect: true,
      Poster: {
        w: (w: number) => w,
        h: (h: number) => h,
        color: Theme.colors.tileunfocus,
        rect: true,
      },
      Title: { y: 176, text: { text: '', fontSize: 22 } },
      FocusRing: {
        x: -6,
        y: -6,
        w: (w: number) => w + 12,
        h: (h: number) => h + 12,
        rect: true,
        color: 0x00ffffff,
      },
    }
  }

  override _focus() {
    // this.scale = 1.0
    // this.poster?.patch({ color: Theme.colors.tilefocus })
    const poster = this.tag('Poster') as L.Element
    poster.patch({
      shader: {
        type: L.shaders.Outline,
        thickness: 4,
        color: 0xffffffff,
      },
    })
  }
  override _unfocus() {
    // this.scale = 1.0
    // this.poster?.patch({ color: Theme.colors.tileunfocus })
    const poster = this.tag('Poster') as L.Element
    poster.patch({ shader: null })
  }
}
