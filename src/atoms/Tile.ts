import { Lightning as L } from '@lightningjs/sdk'
import { Theme } from '../core/theme'

export interface TileSpec extends L.Component.TemplateSpec {
  Poster: {
    PosterBg: L.Component
    PosterImg: L.Component
  }
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

  get posterImg() {
    return this.poster?.tag('PosterImg') as L.Element
  }

  setRandomPoster() {
    const bust = Math.random().toString(36).slice(2)
    this.posterImg.patch({
      src: `https://picsum.photos/300/170?random=${bust}`,
    })
  }

  static override _template(): L.Component.Template<TileSpec> {
    return {
      w: 300,
      h: 170,
      rect: true,
      Poster: {
        w: (w: number) => w,
        h: (h: number) => h,
        // Capa 1: fondo “skeleton” (siempre visible)
        PosterBg: {
          rect: true,
          w: (w: number) => w,
          h: (h: number) => h,
          color: Theme.colors.tileunfocus,
        },
        // Capa 2: imagen por encima
        PosterImg: {
          w: (w: number) => w,
          h: (h: number) => h,
          // src lo pones en _init o cuando toque
          // resizeMode opcional
        },
      },
      Title: { y: 176, text: { text: '', fontSize: 22 } },
      FocusRing: {
        x: -8,
        y: -8,
        w: (w: number) => w + 16,
        h: (h: number) => h + 16,
        rect: true,
        color: 0x00ffffff,
      },
    }
  }

  override _init() {
    this.setRandomPoster()
  }

  override _focus() {
    // this.scale = 1.0
    // this.poster?.patch({ color: Theme.colors.tilefocus })
    const poster = this.tag('Poster') as L.Element
    poster.patch({
      shader: {
        type: L.shaders.Outline,
        thickness: 8,
        color: Theme.colors.accent,
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
