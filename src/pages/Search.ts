import { BasePage } from "./base/BasePage";
import { Theme } from "../core/theme";
import Header from "../molecules/Header";
import { getActiveRouteName } from "../utils/routerUtils";
import SearchInput from "../atoms/SearchInput";
import { Key as BaseKey, Keyboard } from "@lightningjs/ui";
import { Colors, Lightning } from "@lightningjs/sdk";
import { Rail } from "../molecules/Rail";
import DataStore from "../services/DataStore";
import { Grid } from "../molecules/Grid";

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
      Results: {
        y: HEADER_H + GAP_H + 140,
        type: Grid,
        config: { cols: 5, rowsVisible: 3, gapX: 68, gapY: 0, tileH: 230 },
        signals: {
          focusPrev: true,
          focusNext: true,
          navigate: true,
          focusMoved: true,
        },
      },
    });
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
    console.log("****** Do Search ->", v);
    this._onLoadResults = true;
    const inner = "Viewport.Content.ContentInner";
    this.tag(`${inner}.Results`)?.patch({
      title: `Results`,
      items: DataStore.data.rail4?.slice(0, 15),
    });
    this.showResults();
    this.computeAfterLayout();

    // Al cargar resultados, sitúa el viewport al inicio de Results
    // const baseOffset = this._resultsBaseOffset();
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

  /** Offset base de la sección Results */
  private _resultsBaseOffset(): number {
    const secIdx = this.sections.indexOf("Results");
    if (secIdx < 0) return 0;
    const key = (this as any)._nameFor?.(secIdx) ?? "Results";
    return this._offsets?.[key] ?? 0;
  }

  /** Calcula la ancla actual (primera fila visible) según y actual */
  private _currentResultsAnchor(): number {
    const content = this.tag("Viewport.Content") as Lightning.Component;
    const baseOffset = this._resultsBaseOffset();
    const { rowH } = this._gridWindowAndRowH();
    const currentY = (content as any).y ?? 0;
    const extra = (-currentY - baseOffset) / rowH;
    return Math.max(0, Math.round(extra));
  }

  /** Devuelve rowsVisible y rowH desde el Grid (o defaults) */
  private _gridWindowAndRowH() {
    const grid: any = this.tag("Results");
    const rowsVisible = grid?.config?.rowsVisible ?? 3;
    const rowH = (grid?.config?.tileH ?? 230) + (grid?.config?.gapY ?? 0);
    return { rowsVisible, rowH };
  }

  /** Aplica el scroll global de página a una ancla de fila dada */
  private _applyScrollAnchorForResults(
    targetAnchor: number,
    itemsLen: number,
    cols: number
  ) {
    console.log("applyScrollAnchorForResults", {
      targetAnchor,
      itemsLen,
      cols,
    });
    const content = this.tag("Viewport.Content") as Lightning.Component;
    const baseOffset = this._resultsBaseOffset();
    const { rowsVisible, rowH } = this._gridWindowAndRowH();

    const totalRows = Math.max(1, Math.ceil(itemsLen / Math.max(1, cols)));
    const maxAnchor = Math.max(0, totalRows - rowsVisible);
    const clampedAnchor = Math.max(0, Math.min(maxAnchor, targetAnchor));

    const targetY = -(baseOffset + clampedAnchor * rowH);
    content.setSmooth("y", this._clamp(targetY));
    this._refocus();
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
    rowH: number;
    cols: number;
    itemsLen: number;
  }) {
    // Solo actuamos si Results es parte de las secciones actuales
    if (!this._onLoadResults) return;

    // ⬅️ nuevo: no scrollear nunca en la fila 0
    if (payload.row === 0) return;

    const { rowsVisible } = this._gridWindowAndRowH();

    // Ancla actual (primera fila visible) según el y actual:
    const currentAnchor = this._currentResultsAnchor();
    const visibleStart = currentAnchor;
    const visibleEnd = currentAnchor + (rowsVisible - 1);

    // Si ya está visible, no tocamos nada
    if (payload.row > visibleStart && payload.row < visibleEnd) return;

    // Nueva ancla propuesta: al final o al inicio de la ventana
    let targetAnchor =
      payload.row > visibleEnd
        ? payload.row - (rowsVisible - 1) // que quede como última fila visible
        : payload.row; // que quede como primera fila visible

    this._applyScrollAnchorForResults(
      targetAnchor,
      payload.itemsLen,
      payload.cols
    );
  }
}
