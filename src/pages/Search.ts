import { BasePage } from "./base/BasePage";
import { Theme } from "../core/theme";
import Header from "../molecules/Header";
import { getActiveRouteName } from "../utils/routerUtils";
import SearchInput from "../atoms/SearchInput";
import { Key as BaseKey, Keyboard } from "@lightningjs/ui";
import { Colors, Lightning, Router } from "@lightningjs/sdk";
import { Rail } from "../molecules/Rail";
import DataStore from "../services/DataStore";
import { Grid } from "../molecules/Grid";
import { searchItems } from "../utils/searchUtils";

const HEADER_H = 200;
const RAIL_H = 230;
const GAP_H = 40;
const GAP_W = 40;

class Key extends BaseKey {
  override _firstActive() {
    this.label = {
      mountY: 0.45,
      fontSize: 36,
    };
    this.labelColors = {
      unfocused: Theme.colors.text,
      focused: Theme.colors.bg,
    };
    this.backgroundColors = {
      unfocused: Theme.colors.bg,
      focused: Theme.colors.accent,
    };
    if (this.hasFocus()) {
      this._focus();
    }
  }

  get width() {
    return 50;
  }
  get height() {
    return 50;
  }
}

class ActionKey extends BaseKey {
  override _active() {
    this.label = {
      mountY: 0.45,
      fontSize: 36,
    };
    this.labelColors = {
      unfocused: Theme.colors.text,
      focused: Theme.colors.bg,
    };
    this.backgroundColors = {
      unfocused: Theme.colors.bg,
      focused: Theme.colors.accent,
    };
    if (this.hasFocus()) {
      this._focus();
    }
  }

  get height() {
    return 50;
  }

  get width() {
    return 160;
  }
}

export const keyboardConfig = {
  layout: "grid-en",

  layouts: {
    // ───────── lower (qwerty-ish but packed in grid) ─────────
    abc: [
      ["q", "w", "e", "r", "t", "y", "u", "i"],
      ["o", "p", "a", "s", "d", "f", "g", "h"],
      ["j", "k", "l", "z", "x", "c", "v", "b"],
      ["n", "m", ",", ".", "'", "-", "/", "="],
      [
        "Layout:ABC",
        "Layout:@#&",
        "Space:space",
        "Backspace:←",
        "Clear:clear",
        "Submit:search",
      ],
    ],

    // ───────── UPPER (Caps) ─────────
    ABC: [
      ["Q", "W", "E", "R", "T", "Y", "U", "I"],
      ["O", "P", "A", "S", "D", "F", "G", "H"],
      ["J", "K", "L", "Z", "X", "C", "V", "B"],
      ["N", "M", "<", ">", '"', "_", "?", ":"],
      [
        "Layout:abc",
        "Layout:@#&",
        "Space:space",
        "Backspace:←",
        "Clear:clear",
        "Submit:search",
      ],
    ],

    // ───────── symbols / numbers ─────────
    "@#&": [
      ["1", "2", "3", "4", "5", "6", "7", "8"],
      ["9", "0", "!", "@", "#", "$", "%", "^"],
      ["&", "*", "(", ")", "-", "_", "+", "="],
      ["/", "\\", ":", ";", '"', "'", ".", "?"],
      [
        "Layout:abc",
        "Layout:ABC",
        "Space:space",
        "Backspace:←",
        "Clear:clear",
        "Submit:search",
      ],
    ],
  },

  // Graella: sense offsets ni spacers
  styling: {
    align: "center",
    horizontalSpacing: 8,
    verticalSpacing: 24,
  },

  // TOTES les tecles amb la mateixa mida per mantenir la graella perfecta
  buttonTypes: {
    default: { type: Key, w: 120, h: 64 },
    Layout: { type: ActionKey, w: 120, h: 64 },
    Space: { type: ActionKey, w: 130, h: 64 },
    Backspace: { type: ActionKey, w: 100, h: 64 },
    Clear: { type: ActionKey, w: 120, h: 64 },
    Submit: { type: ActionKey, w: 150, h: 64 },
  },
};

export default class SearchSection extends BasePage {
  private _keyboardVisible = true;
  private _value: string = "";
  private _onLoadResults: boolean = false;

  protected override get hasHeader() {
    return true;
  }

  protected override get sections() {
    const sections = ["SearchInput"];
    if (this._keyboardVisible) sections.push("KeyboardWrap.Keyboard");
    if (this._onLoadResults) sections.push("Results");
    return sections;
  }

  protected override get defaultHeights() {
    return {
      Header: HEADER_H,
      SearchInput: 80,
    };
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
        signals: {
          enter: "onSearchInputEnter",
          onFocus: "onFocusInput",
        },
      },
      KeyboardWrap: {
        y: HEADER_H + GAP_H + 120,
        x: GAP_W,
        Keyboard: {
          type: Keyboard,
          currentLayout: "abc",
          config: keyboardConfig,
          signals: {
            onInputChanged: true,
            onSubmit: true,
            onClear: true,
          },
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
    this._section = 0;
    this.hideResults();
    const content = this.tag("Viewport.Content") as Lightning.Component;
    content.y = this._clamp(0);
    this._showKeyboard();
    this.Keyboard.clear();
    this.Keyboard.resetFocus();
  }

  override _active() {
    if ((Router as any)._resetNextPage) {
      console.log("Reset Search!!");
      this._resetView();
    } else {
      this.onFocusInput();
    }
    super._active();
  }

  onFocusInput() {
    const content = this.tag("Viewport.Content") as Lightning.Component;
    content.setSmooth("y", this._clamp(0));
  }

  set value(v: string) {
    console.log("set value ->", v);
    this._value = v;
    this.tag("SearchInput")?.setValue?.(v);
  }

  get value() {
    return this._value;
  }

  // mostrar
  _showKeyboard() {
    const wrap = this.tag("KeyboardWrap");
    wrap.visible = true;
    wrap.patch({ smooth: { alpha: 1 } });
    this._keyboardVisible = true;
    this.tag("NotFound").patch({
      alpha: 0,
      visible: false,
    });
    this._refocus();
  }

  // ocultar
  _hideKeyboard() {
    const wrap = this.tag("KeyboardWrap");
    wrap.patch({ smooth: { alpha: 0 } });
    wrap.visible = false;
    this._keyboardVisible = false;
    this._refocus();
  }

  override focusPrev() {
    if (!this.enableScrollSnap) return;
    const min = this.hasHeader ? -1 : 0;
    this._section = Math.max(this._section - 1, min);
    console.log(this._section);
    this._applyScrollForSection(this._section);
    this._syncHistorySnapshot();
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

  protected override get shouldScrollOnSection() {
    return (index: number) => index >= 2;
  }

  showResults() {
    const inner = "Viewport.Content.ContentInner";
    this.tag(`${inner}.Results`)?.patch({
      visible: true,
      alpha: 1,
    });
  }

  hideResults() {
    const inner = "Viewport.Content.ContentInner";
    this.tag(`${inner}.Results`)?.patch({
      visible: false,
      alpha: 0,
    });
  }

  // handlers…
  onSearchInputEnter(value: string) {
    console.log("onSearchInputEnter ->", value);
    if (!this._keyboardVisible) {
      this._onLoadResults = false;
      this._showKeyboard();
      this.hideResults();
    } else {
      if (value !== "") {
        this.search(value);
        this._hideKeyboard();
      }
    }
  }

  search(v: string) {
    this._onLoadResults = true;
    const inner = "Viewport.Content.ContentInner";
    const grid = this.tag(`${inner}.Results`);
    const items = searchItems(DataStore.data, v);
    if (items.length > 0) {
      this.tag("NotFound").patch({
        alpha: 0,
        visible: false,
      });
      grid?.patch({
        title: `Search results for ${v}`,
        items,
      });
      grid?.reset();
      this.showResults();
      this.computeAfterLayout();
    } else {
      this.tag("NotFound").patch({
        alpha: 1,
        visible: true,
      });
      this._onLoadResults = false;
    }

    const content = this.tag("Viewport.Content") as Lightning.Component;
    content.setSmooth("y", this._clamp(0));
  }

  onInputChanged(data: { input: string; previousInput: string }) {
    this.value = data.input;
    this.tag("SearchInput")?.setValue?.(this.value); // o patch visual de tu input
  }

  onSubmit(data: { input: string; previousInput: string }) {
    console.log("onSubmit ->", data.input);
    this.value = data.input;
    this._hideKeyboard();
    this.search(data.input);
  }

  onClear() {
    this._value = "";
    this.tag("SearchInput")?.setValue?.("");
  }

  /**
   * Integración del evento del Grid:
   * Mantiene la fila enfocada dentro de la "ventana" (rowsVisible).
   * Si la fila sale por abajo -> ancla fila al final; si sale por arriba -> ancla al inicio.
   * (Opcional) activar modo centrado marcando la línea indicada.
   */
  focusMoved(payload: {
    index: number;
    row: number;
    col: number;
    anchorY: number;
    centerY: number;
    rowH: number; // alçada visual del tile (incloent text si cal)
    cols: number;
    itemsLen: number;
  }) {
    if (!this._onLoadResults) return;

    const content = this.tag("Viewport.Content") as Lightning.Component;
    const viewport = this.tag("Viewport") as any;
    const grid = this.tag("ResultsGrid") as any; // opcional, només per llegir gap si existeix

    // ---- constants bàsiques ----
    const baseOffset =
      (this as any)._resultsBaseOffset?.() ??
      ((this as any).HEADER_H ?? 0) + ((this as any).GAP_H ?? 0) + 140;

    const EXTRA_BOTTOM = Number((this as any).extraBottom ?? 0);
    const CENTER_BIAS = -140; // 👈 el teu tweak que et deixa “perfecte” el final

    // ---- mesures essencials ----
    const cols = Math.max(1, payload.cols | 0);
    const row = Math.max(0, payload.row | 0);
    const tileH = Math.max(1, payload.rowH | 0);
    const gapY = Number(
      grid?.gapY ?? grid?.spacingY ?? grid?.itemSpacingY ?? 0
    );
    const rowPitch = tileH + gapY;

    const totalRows = Math.max(1, Math.ceil(payload.itemsLen / cols));
    const lastRowBottom = totalRows * rowPitch - gapY; // (rows-1)*rowPitch + tileH

    const viewportH = Number(viewport?.h ?? 1080);
    const availableH = Math.max(1, viewportH - baseOffset - EXTRA_BOTTOM);

    // ---- centrat continu amb clamp “flush” al final ----
    const rowCenterPx = row * rowPitch + tileH / 2;
    let anchorPx = rowCenterPx - availableH / 2;

    // topall perquè la darrera fila no quedi tallada ni sobri espai
    const maxAnchorPx = Math.max(0, lastRowBottom - availableH);

    if (anchorPx < 0) anchorPx = 0;
    if (anchorPx > maxAnchorPx) anchorPx = maxAnchorPx;

    // Y global (negatiu = cap avall) + el teu ajust fi
    let targetY = -(baseOffset + anchorPx) + CENTER_BIAS;

    // assegura alçada del contenidor scrollable
    const neededH = baseOffset + lastRowBottom + EXTRA_BOTTOM;
    const currentH = Number((content as any).h ?? 0);
    if (currentH < neededH) (content as any).h = neededH;

    content.setSmooth("y", targetY);
  }
}
