import { Lightning as L } from "@lightningjs/sdk";
import { Theme, Typography } from "../core/theme";

export interface NavItemSpec extends L.Component.TemplateSpec {
  Label: L.Component;
  Indicator: L.Component;
}

export type NavItemRef = NavItem & L.Component;

export default class NavItem extends L.Component<NavItemSpec> {
  private _routeActive = false;
  private _pendingIndicatorColor: number | null = null;

  static override _template(): L.Component.Template<NavItemSpec> {
    return {
      w: 200,
      h: 60,
      rect: true,
      color: 0x00000000,
      Indicator: {
        x: 0,
        y: 58,
        w: (w: number) => w,
        h: 6,
        rect: true,
        color: 0x00000000,
      },
      Label: {
        y: 0,
        x: 0,
        text: {
          text: "",
          fontFace: Typography.nav.face,
          fontSize: Typography.nav.size,
          textColor: Theme.colors.text,
        },
      },
    };
  }

  set labelText(v: string) {
    this.patch({ Label: { text: { text: v } } });
  }
  get labelText() {
    return (this.tag("Label") as L.Component)?.text?.text || "";
  }

  override _init() {
    if (this._pendingIndicatorColor !== null) {
      const ind = this.tag("Indicator") as L.Component | undefined;
      ind?.patch({ color: this._pendingIndicatorColor });

      this._pendingIndicatorColor = null;
    } else {
      this._renderIndicator();
    }
  }

  set routeActive(v: boolean) {
    this._routeActive = v;
    this._renderIndicator();
  }
  get routeActive() {
    return this._routeActive;
  }

  setSelected(v: boolean) {
    this.routeActive = v;
  }

  override _focus() {
    this._renderIndicator();
    return true;
  }
  override _unfocus() {
    this._renderIndicator();
    return true;
  }

  private _renderIndicator() {
    const ind = this.tag("Indicator") as L.Component | undefined;
    const la = this.tag("Label") as L.Component | undefined;
    const focused = this.hasFocus();
    const SELECTED = Theme.colors.accent ?? 0xffff0000;
    const UNSELECTED = 0xffffffff;
    const UNFOCUS = 0x00000000;

    const color = focused ? SELECTED : this._routeActive ? UNSELECTED : UNFOCUS;
    la?.patch({ text: { textColor: focused ? SELECTED : UNSELECTED } });

    if (ind) {
      ind.patch({ color });
      this._pendingIndicatorColor = null;
    } else {
      this._pendingIndicatorColor = color;
    }
  }
}
