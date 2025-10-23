// molecules/Header.ts
import { Lightning as L } from '@lightningjs/sdk'
import Logo from '../atoms/Logo'
import NavItem, { NavItemRef } from '../atoms/NavItem'

export default class Header extends L.Component {
  private _focusIdx = 0
  private _currentIdx = 0
  private _routes = ['home', 'new']

  static override _template(): L.Component.Template<any> {
    return {
      w: 1920,
      h: 100,
      Logo: { x: 40, y: 90, mountY: 1, type: Logo, label: 'Napflix' },
      Nav: {
        x: 40,
        y: 120,
        mountY: 1,
        Home: { type: NavItem, Label: { text: { text: 'Home' } } },
        New: { x: 220, type: NavItem, Label: { text: { text: 'New' } } },
      },
    }
  }

  override _setup() {
    this._refocus()
  }

  override _firstActive() {
    this._applyCurrentByIndex(this._currentIdx)
    this._setFocusIndex(this._currentIdx)
  }

  override _focus() {
    this._setFocusIndex(this._currentIdx)
    return true
  }

  // Focus path → torna sempre el NavItem amb focusIdx
  override _getFocused() {
    return this.tag('Nav').children[this._focusIdx]
  }

  // ←/→ NOMÉS canvien el focus, NO el selected/route
  override _handleLeft() {
    if (this._focusIdx > 0) this._setFocusIndex(this._focusIdx - 1)
    return true
  }
  override _handleRight() {
    const max = this.tag('Nav').children.length - 1
    if (this._focusIdx < max) this._setFocusIndex(this._focusIdx + 1)
    return true
  }

  // Enter: fem “select” → la ruta activa passa a ser el focus actual
  override _handleEnter() {
    this._applyCurrentByIndex(this._focusIdx)
    const path = this._routes[this._currentIdx]
    this.signal('navigate', path)
    return true
  }

  override _handleDown() {
    this.signal('focusNext')
    return true
  }

  // API per sincronitzar des de fora (router/hash)
  setCurrentByRoute(route: string) {
    const i = this._routes.indexOf(route)
    if (i >= 0) this._applyCurrentByIndex(i)
  }

  /** Canvia únicament el focus (no el selected) */
  private _setFocusIndex(i: number) {
    this._focusIdx = i
    this._refocus()
    // No cal tocar NavItem aquí: ells saben si tenen focus amb hasFocus()
  }

  /** Canvia el selected/route activa i notifica els NavItem */
  private _applyCurrentByIndex(i: number) {
    this._currentIdx = i
    const items = this.tag('Nav').children as (NavItemRef & L.Component)[]
    items.forEach((c, idx) => (c.routeActive = idx === i))
  }
}
