import { BasePage } from "./base/BasePage";
import { Theme } from "../core/theme";
import Header from "../molecules/Header";
import SearchInput from "../atoms/SearchInput";
import { Keyboard } from "@lightningjs/ui";
import { Lightning, Router } from "@lightningjs/sdk";
import DataStore from "../services/DataStore";
import { Grid } from "../molecules/Grid";
import { getActiveRouteName } from "../utils/routerUtils";
import { searchItems } from "../utils/searchUtils";
import { keyboardConfig } from "../utils/keyboardConfig";

const HEADER_H = 200;
const GAP_H = 40;
const GAP_W = 40;

export default class SearchSection extends BasePage {
  private _keyboardVisible = true;
  private _value = "";
  private _onLoadResults = false;

  protected override get hasHeader() {
    return true;
  }

  protected override get sections() {
    const s = ["SearchInput"];
    if (this._keyboardVisible) s.push("KeyboardWrap.Keyboard");
    if (this._onLoadResults) s.push("Results");
    return s;
  }

  protected override get defaultHeights() {
    return { Header: HEADER_H, SearchInput: 80 };
  }

  get Keyboard() {
    return this.tag("KeyboardWrap.Keyboard");
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
        signals: { enter: "onSearchInputEnter", onFocus: "onFocusInput" },
      },
      KeyboardWrap: {
        y: HEADER_H + GAP_H + 120,
        x: GAP_W,
        Keyboard: {
          type: Keyboard,
          currentLayout: "abc",
          config: keyboardConfig,
          signals: { onInputChanged: true, onSubmit: true, onClear: true },
        },
      },
      NotFound: {
        y: HEADER_H + GAP_H + 140,
        x: GAP_W,
        alpha: 0,
        visible: false,
        text: {
          text: "No results found",
          fontSize: 36,
          fontFace: "RelaxAI-SoraRegular",
          textColor: Theme.colors.text,
        },
      },
      Results: {
        y: HEADER_H + GAP_H + 140,
        type: Grid,
        config: { cols: 5, rowsVisible: 1, gapX: 68, gapY: 0, tileH: 230 },
        signals: {
          focusPrev: true,
          focusNext: true,
          navigate: true,
          focusMoved: true,
        },
      },
    });
  }

  _resetView() {
    this._onLoadResults = false;
    this.value = "";
    this._value = "";
    this._section = 1;
    this.hideResults();
    (this.tag("Viewport.Content") as Lightning.Component).y = this._clamp(0);
    this._showKeyboard();
    this.Keyboard.clear();
    this.Keyboard.resetFocus();
  }

  override _active() {
    if ((Router as any)._resetNextPage) this._resetView();
    this._section = 1;
    super._active();
  }

  onFocusInput() {
    (this.tag("Viewport.Content") as Lightning.Component).setSmooth(
      "y",
      this._clamp(0),
    );
  }

  set value(v: string) {
    this._value = v;
    this.tag("SearchInput")?.setValue?.(v);
  }
  get value() {
    return this._value;
  }

  _showKeyboard() {
    const wrap = this.tag("KeyboardWrap");
    wrap.visible = true;
    wrap.patch({ smooth: { alpha: 1 } });
    this._keyboardVisible = true;
    this.tag("NotFound").patch({ alpha: 0, visible: false });
    this._section = 1;
    this.Keyboard.resetFocus();
    this._refocus();
  }

  _hideKeyboard() {
    const wrap = this.tag("KeyboardWrap");
    wrap.patch({ smooth: { alpha: 0 } });
    wrap.visible = false;
    this._keyboardVisible = false;
    this._section = 0;
    this._refocus();
  }

  override focusPrev() {
    if (!this.enableScrollSnap) return;
    const min = this.hasHeader ? -1 : 0;
    this._section = Math.max(this._section - 1, min);
    this._applyScrollForSection(this._section);
    this._syncHistorySnapshot();
  }

  override _focus() {
    const routeName = getActiveRouteName();
    this.tag("Viewport.Content.ContentInner.Header")?.setCurrentByRoute?.(
      routeName,
    );

    if (!this.wasRestoredFromHistory && this._section < 0) {
      this._section = 0;
      (this as any)._applyScrollForSection?.(0);
    } else this._refocus();
  }

  protected override get shouldScrollOnSection() {
    return (index: number) => index >= 2;
  }

  showResults() {
    this.tag("Viewport.Content.ContentInner.Results")?.patch({
      visible: true,
      alpha: 1,
    });
  }

  hideResults() {
    this.tag("Viewport.Content.ContentInner.Results")?.patch({
      visible: false,
      alpha: 0,
    });
  }

  onSearchInputEnter(value: string) {
    if (!this._keyboardVisible) {
      this._onLoadResults = false;
      this._showKeyboard();
      this.hideResults();
    } else {
      if (value) {
        this.search(value);
        this._hideKeyboard();
      }
    }
  }

  search(v: string) {
    this._onLoadResults = true;
    const items = searchItems(DataStore.data, v);
    const inner = "Viewport.Content.ContentInner";
    const grid = this.tag(`${inner}.Results`);

    if (items.length > 0) {
      this.tag("NotFound").patch({ alpha: 0, visible: false });
      grid?.patch({ title: `Search results for ${v}`, items });
      grid?.reset();
      this.showResults();
      this.computeAfterLayout();
    } else {
      this.tag("NotFound").patch({ alpha: 1, visible: true });
      this._onLoadResults = false;
    }

    (this.tag("Viewport.Content") as Lightning.Component).setSmooth(
      "y",
      this._clamp(0),
    );
  }

  onInputChanged(data: { input: string; previousInput: string }) {
    this.value = data.input;
  }

  onSubmit(data: { input: string }) {
    this.value = data.input;
    this._hideKeyboard();
    this.search(data.input);
  }

  onClear() {
    this._value = "";
    this.tag("SearchInput")?.setValue?.("");
  }

  focusMoved(payload: {
    index: number;
    row: number;
    col: number;
    anchorY: number;
    centerY: number;
    rowH: number;
    cols: number;
    itemsLen: number;
  }) {
    if (!this._onLoadResults) return;

    const content = this.tag("Viewport.Content") as Lightning.Component;
    const viewport = this.tag("Viewport") as any;
    const grid = this.tag("ResultsGrid") as any;

    const baseOffset = HEADER_H + GAP_H + 140;
    const EXTRA_BOTTOM = -100;
    const CENTER_BIAS = 0;

    const cols = Math.max(1, payload.cols | 0);
    const row = Math.max(0, payload.row | 0);
    const tileH = Math.max(1, payload.rowH | 0);
    const gapY = Number(
      grid?.gapY ?? grid?.spacingY ?? grid?.itemSpacingY ?? 0,
    );
    const rowPitch = tileH + gapY;

    const totalRows = Math.max(1, Math.ceil(payload.itemsLen / cols));
    const lastRowBottom = totalRows * rowPitch - gapY;
    const viewportH = Number(viewport?.h ?? 1080);
    const availableH = Math.max(1, viewportH - baseOffset - EXTRA_BOTTOM);

    let anchorPx = row * rowPitch + tileH / 2 - availableH / 2;
    anchorPx = Math.max(0, Math.min(anchorPx, lastRowBottom - availableH));

    const targetY = -(baseOffset + anchorPx) + CENTER_BIAS;

    const neededH = baseOffset + lastRowBottom + EXTRA_BOTTOM;
    if ((content as any).h < neededH) (content as any).h = neededH;

    content.setSmooth("y", targetY);
  }
}
