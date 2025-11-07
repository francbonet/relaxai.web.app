import { Lightning as L } from "@lightningjs/sdk";
import Logo from "../atoms/Logo";
import NavItem, { NavItemRef } from "../atoms/NavItem";

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
    this._syncSelectedFromLocation();
    if (typeof window !== "undefined")
      window.addEventListener("hashchange", this._onHashChange);
    this._refocus();
  }

  override _firstActive() {
    this._applyCurrentByIndex(this._currentIdx);
    this._setFocusIndex(this._currentIdx);
  }

  override _detach() {
    if (typeof window !== "undefined")
      window.removeEventListener("hashchange", this._onHashChange);
  }

  override _focus() {
    this._setFocusIndex(this._currentIdx);
    return true;
  }

  override _getFocused() {
    return (this.tag("Nav") as L.Component).children[
      this._focusIdx
    ] as L.Component;
  }

  override _handleLeft() {
    if (this._focusIdx > 0) this._setFocusIndex(this._focusIdx - 1);
    return true;
  }
  override _handleRight() {
    const max = (this.tag("Nav") as L.Component).children.length - 1;
    if (this._focusIdx < max) this._setFocusIndex(this._focusIdx + 1);
    return true;
  }
  override _handleEnter() {
    this._applyCurrentByIndex(this._focusIdx);
    this.signal("navigate", this._routes[this._currentIdx], { from: "header" });
    return true;
  }
  override _handleDown() {
    this.signal("focusNext");
    return true;
  }

  setCurrentByRoute(route: string) {
    const i = this._routes.indexOf((route || "").toLowerCase());
    if (i >= 0) this._applyCurrentByIndex(i);
  }

  private _syncSelectedFromLocation() {
    const route = this._detectRouteFromHash();
    const idx = this._routes.indexOf(route);
    if (idx >= 0) this._applyCurrentByIndex(idx);
  }
  private _detectRouteFromHash(): string {
    if (typeof window === "undefined") return "home";
    const raw = window.location.hash || "";
    return (raw.replace(/^#\/?/, "").split("/")[0] || "home").toLowerCase();
  }
  private _setFocusIndex(i: number) {
    this._focusIdx = i;
    this._refocus();
  }
  private _applyCurrentByIndex(i: number) {
    this._currentIdx = i;
    (this.tag("Nav") as L.Component).children.forEach(
      (c, idx) => ((c as NavItemRef & L.Component).routeActive = idx === i),
    );
  }
}
