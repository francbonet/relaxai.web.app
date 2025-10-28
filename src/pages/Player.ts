import { BasePage } from './base/BasePage'

export default class Player extends BasePage {
  protected override get hasHeader() {
    return false
  }
  protected override get enableScrollSnap() {
    return false
  }
  protected override get enableHistory() {
    return false
  } // normalment al player no cal

  static override _template() {
    return BasePage.chrome({
      VideoLayer: { w: 1920, h: 1080, rect: true, color: 0xff000000 },
      // Afegir Controls / HUD / etc.
    })
  }

  // ===== Hidratació per Router (params: { section, id }) =====
  override _onUrlParams(params: any) {
    // this._fromRoute = sanitizeSection(params?.section)
    // const id = params?.id ? String(params.id) : extractIdFromHash()
    // console.log('[Player] onUrlParams id ->', id)
  }

  // Exemples de tecles específiques
  _handlePlay() {
    /* play */ return true
  }

  _handlePause() {
    /* pause */ return true
  }

  override _handleBack() {
    /* tancar player o Router.back() */ return false
  }
}
