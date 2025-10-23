import { Img, Lightning as L, Utils } from '@lightningjs/sdk'
import { Theme } from '../core/theme'

export class Carousell extends L.Component {
  static override _template() {
    return {
      x: 40,
      w: 1920 - 80,
      h: 600,
      Poster: {
        x: 0,
        y: 0,
        w: 1920 - 80,
        h: 600,
        texture: Img(Utils.asset('videos/posters/AB-007.jpg')).cover(1920 - 80, 600),
      },
      TitleMetadata: {
        mount: 0,
        y: 600 - 200,
        x: 80,
        text: { text: 'Lorem ipsum', fontSize: Theme.typography.h1 },
      },
      SubTitleMetadata: {
        mount: 0,
        y: 600 - 120,
        x: 80,
        text: { text: 'Lorem ipsum', fontSize: Theme.typography.body },
      },
      padding: 4,
    }
  }

  override _firstActive(): void {
    // const imageSrc = Utils.asset('videos/posters/AB-007.jpg')
    // if (imageSrc) {
    //   this.tag('Poster').patch({
    //     texture: Img(imageSrc).cover(500, 300),
    //   })
    // }
  }

  override _focus() {
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
    const poster = this.tag('Poster') as L.Element
    poster.patch({ shader: null })
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
