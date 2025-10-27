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
