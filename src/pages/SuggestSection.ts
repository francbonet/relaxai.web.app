import { BasePage } from './base/BasePage'
import { Theme } from '../core/theme'
import Header from '../molecules/Header'
import { getActiveRouteName } from '../utils/routerUtils'

const HEADER_H = 200

export default class SuggestSection extends BasePage {
  protected override get hasHeader() {
    return true
  }
  protected override get enableScrollSnap() {
    return false
  }

  protected override get defaultHeights() {
    return {
      Header: HEADER_H,
    }
  }

  static override _template() {
    return BasePage.chrome({
      Header: {
        type: Header,
        h: HEADER_H,
        signals: { navigate: true, focusNext: true },
      },
      Container: {
        x: Theme.w / 2,
        y: Theme.h / 2,
        mount: 0.5,
        text: { text: 'Suggestions', fontSize: 64 },
      },
    })
  }

  override _focus() {
    const name = getActiveRouteName()
    this.tag('Viewport.Content.ContentInner.Header')?.setCurrentByRoute?.(name)
  }
}
