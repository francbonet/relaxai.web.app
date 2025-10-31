import { BasePage } from "./base/BasePage";
import { Theme } from "../core/theme";
import Header from "../molecules/Header";
import { getActiveRouteName } from "../utils/routerUtils";
import SearchInput from "../atoms/SearchInput";

const HEADER_H = 200;
const GAP_H = 40;
const GAP_W = 40;

export default class SearchSection extends BasePage {
  private _keyboardVisible = false;

  protected override get hasHeader() {
    return true;
  }

  protected override get sections() {
    return ["SearchInput"];
  }

  protected override get defaultHeights() {
    return {
      Header: HEADER_H,
      SearchInput: 80,
    };
  }

  static override _template() {
    return BasePage.chrome({
      Header: {
        type: Header,
        h: HEADER_H,
        signals: { navigate: true, focusNext: true },
      },
      SearchInput: {
        x: GAP_W,
        y: HEADER_H + GAP_H,
        w: Theme.w - GAP_W * 2,
        h: 80,
        type: SearchInput,
        signals: {
          enter: "onSearchInputEnter",
          changed: "onSearchInputChanged",
        },
      },
    });
  }

  get _input() {
    return this.tag("SearchInput") as SearchInput;
  }

  override _focus() {
    const name = getActiveRouteName();
    this.tag("Viewport.Content.ContentInner.Header")?.setCurrentByRoute?.(name);

    // Si per qualsevol motiu entres amb _section al Header, baixa a la primera secció
    if (!this.wasRestoredFromHistory && this._section < 0) {
      this._section = 0;
      (this as any)._applyScrollForSection?.(0);
    } else {
      this._refocus();
    }
  }

  // 🔹 No vull scroll quan el focus entra a la primera secció (idx 0)
  protected override get shouldScrollOnSection() {
    return (index: number) => index !== 0;
  }

  onKeyboardClosed() {
    console.log("onKeyboardClosed");
  }

  // handlers…
  onSearchInputEnter(value: string) {
    // Exemple: obrir el teclat amb el seed 'value'
    console.log("onSearchInputEnter", value);
  }

  onSearchInputChanged(value: string) {
    // Si vols auto-cerca amb més de 3 paraules:
    // const wc = value.trim().split(/\s+/).filter(Boolean).length;
    // if (wc > 3) this.signal("search", value);
    console.log("onSearchInputChanged", value);
  }
}
