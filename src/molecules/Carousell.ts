import { Img, Lightning as L, Utils } from '@lightningjs/sdk'
import { Theme, Typography } from '../core/theme'
import { Button } from '../atoms/Button'

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
        alpha: 0.7,
        texture: Img(Utils.asset('videos/posters/AB-007.jpg')).cover(1920 - 80, 600),
      },
      TitleMetadata: {
        mount: 0,
        y: 300,
        x: 60,
        text: {
          text: 'Lorem ipsum',
          fontFace: Typography.heading.face,
          fontSize: Typography.heading.size,
          textColor: Theme.colors.text,
        },
      },
      SubTitleMetadata: {
        mount: 0,
        y: 360,
        x: 60,
        text: {
          text: 'Lorem ipsum',
          fontFace: Typography.body.face,
          fontSize: Typography.body.size,
          textColor: Theme.colors.text,
        },
      },
      CTA: {
        y: 440,
        x: 60,
        w: 260,
        type: Button,
        label: 'WATCH NOW',
      },
      padding: 8,
    }
  }

  override _focus() {
    const poster = this.tag('Poster') as L.Element
    poster.patch({
      shader: {
        type: L.shaders.Outline,
        thickness: 8,
        color: Theme.colors.accent,
      },
      alpha: 1,
    })
  }

  override _unfocus() {
    const poster = this.tag('Poster') as L.Element
    poster.patch({ shader: null, alpha: 0.7 })
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
