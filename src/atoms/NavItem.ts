// atoms/NavItem.ts
import { Lightning as L } from '@lightningjs/sdk'
import { Theme } from '../core/theme'

export interface NavItemSpec extends L.Component.TemplateSpec {
  Label: L.Component
  Indicator: L.Component
}

export type NavItemRef = NavItem & L.Component

// NavItem.ts
export default class NavItem extends L.Component<NavItemSpec> {
  private _routeActive = false
  private _pendingIndicatorColor: number | null = null

  static override _template(): L.Component.Template<NavItemSpec> {
    return {
      w: 200,
      h: 60,
      rect: true,
      color: 0x00000000,
      Indicator: { x: 0, y: 58, w: (w: number) => w, h: 8, rect: true, color: 0x00000000 },
      Label: { y: 34, x: 6, text: { text: '', fontSize: 26 } },
    }
  }

  override _init() {
    // si hi havia un color pendent d'abans que existís l'Indicator, l'apliquem
    if (this._pendingIndicatorColor !== null) {
      const ind = this.tag('Indicator') as L.Component | undefined
      ind?.patch({ color: this._pendingIndicatorColor })
      this._pendingIndicatorColor = null
    } else {
      this._renderIndicator()
    }
  }

  set routeActive(v: boolean) {
    this._routeActive = v
    this._renderIndicator()
  }
  get routeActive() {
    return this._routeActive
  }

  setSelected(v: boolean) {
    this.routeActive = v
  }

  override _focus() {
    this._renderIndicator()
    return true
  }
  override _unfocus() {
    this._renderIndicator()
    return true
  }

  private _renderIndicator() {
    const ind = this.tag('Indicator') as L.Component | undefined

    const focused = this.hasFocus()
    const RED = Theme.colors.accent ?? 0xffff0000
    const WHITE = 0xffffffff
    const TRANSPARENT = 0x00000000

    const color = focused ? RED : this._routeActive ? WHITE : TRANSPARENT

    if (ind) {
      ind.patch({ color })
      this._pendingIndicatorColor = null
    } else {
      // l'Indicator pot no estar creat encara (ordre d'inicialització)
      this._pendingIndicatorColor = color
    }
  }
}
