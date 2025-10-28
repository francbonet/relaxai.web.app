// molecules/Header.ts
import { Lightning as L } from "@lightningjs/sdk";
import Logo from "../atoms/Logo";
import NavItem, { NavItemRef } from "../atoms/NavItem";
import { Theme } from "../core/theme";

export const _val = 230;

export default class Header extends L.Component {
  private _focusIdx = 0;
  private _currentIdx = 0;
  private _routes = [
    "home",
    "suggest",
    "breathe",
    "longform",
    "search",
    "watchlist",
  ];

  // Referència al listener per poder-lo treure
  private _onHashChange = () => this._syncSelectedFromLocation();

  static override _template(): L.Component.Template<any> {
    return {
      w: 1920,
      h: 100,
      Logo: { x: 40, y: 90, mountY: 1, type: Logo },
      Nav: {
        x: 40,
        y: 120,
        mountY: 1,
        Home: { type: NavItem, labelText: "Home" },
        New: { x: _val, type: NavItem, labelText: "Suggest" },
        Movies: { x: _val * 2, type: NavItem, labelText: "Breathe" },
        Series: { x: _val * 3, type: NavItem, labelText: "Longform" },
        Search: { x: _val * 4, type: NavItem, labelText: "Search" },
        Watchlist: { x: _val * 5, type: NavItem, labelText: "Watchlist" },
      },
    };
  }

  override _setup() {
    // Inicialitza el "selected" segons la URL present
    this._syncSelectedFromLocation();
    // Registra listener de canvis de hash (si som en entorn browser)
    if (typeof window !== "undefined") {
      window.addEventListener("hashchange", this._onHashChange);
    }
    this._refocus();
  }

  override _firstActive() {
    // Assegura coherència visual en la primera activació
    this._applyCurrentByIndex(this._currentIdx);
    this._setFocusIndex(this._currentIdx);
  }

  // Bona pràctica: neteja el listener quan el component es descarrega
  override _detach() {
    if (typeof window !== "undefined") {
      window.removeEventListener("hashchange", this._onHashChange);
    }
  }

  override _focus() {
    // Quan el Header rep focus, posiciona el focus al NavItem seleccionat
    this._setFocusIndex(this._currentIdx);
    return true;
  }

  // Focus path → torna sempre el NavItem amb focusIdx
  override _getFocused() {
    return (this.tag("Nav") as L.Component).children[
      this._focusIdx
    ] as L.Component;
  }

  // ←/→ NOMÉS canvien el focus, NO el selected/route
  override _handleLeft() {
    if (this._focusIdx > 0) this._setFocusIndex(this._focusIdx - 1);
    return true;
  }
  override _handleRight() {
    const max = (this.tag("Nav") as L.Component).children.length - 1;
    if (this._focusIdx < max) this._setFocusIndex(this._focusIdx + 1);
    return true;
  }

  // Enter: fem “select” → la ruta activa passa a ser el focus actual
  override _handleEnter() {
    this._applyCurrentByIndex(this._focusIdx);
    const path = this._routes[this._currentIdx];
    // Exemple: navegar a '#/home' o '#/suggest'
    this.signal("navigate", path);
    return true;
  }

  override _handleDown() {
    this.signal("focusNext");
    return true;
  }

  // API per sincronitzar des de fora (router/hash)
  setCurrentByRoute(route: string) {
    const i = this._routes.indexOf((route || "").toLowerCase());
    if (i >= 0) this._applyCurrentByIndex(i);
  }

  /** Llegeix la secció del hash i marca el NavItem com a selected (no toca el focus). */
  private _syncSelectedFromLocation() {
    const route = this._detectRouteFromHash();
    const idx = this._routes.indexOf(route);
    if (idx >= 0) {
      this._applyCurrentByIndex(idx);
      // no cridem _setFocusIndex aquí: no volem robar focus al PlayBtn de Detail, etc.
    }
  }

  /** Extreu la primera part del hash: #/home/..., #/suggest/..., etc. */
  private _detectRouteFromHash(): string {
    if (typeof window === "undefined") return "home";
    const raw = window.location.hash || "";
    const seg = raw.replace(/^#\/?/, "").split("/")[0] || "home";
    return seg.toLowerCase();
  }

  /** Canvia únicament el focus (no el selected) */
  private _setFocusIndex(i: number) {
    this._focusIdx = i;
    this._refocus();
    // Els NavItem saben si tenen focus via hasFocus()
  }

  /** Canvia el selected/route activa i notifica els NavItem */
  private _applyCurrentByIndex(i: number) {
    this._currentIdx = i;
    const items = (this.tag("Nav") as L.Component).children as (NavItemRef &
      L.Component)[];
    items.forEach((c, idx) => (c.routeActive = idx === i));
  }
}
