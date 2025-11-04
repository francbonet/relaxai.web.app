import { Lightning as L } from "@lightningjs/sdk";
import { Tile, TileData } from "../atoms/Tile";
import { Theme } from "../core/theme";

/**
 * Grid configurable inspirado en Rail:
 * - Mantiene API: getFocusIndex / setFocusIndex / reset / title / items
 * - Navegación con scroll suave (X/Y)
 * - Soporta márgenes configurables entre items (GAP_X, GAP_Y)
 * - Cálculo automático o forzado de columnas
 */

// === Layout constants ===
const TILE_W = 300;
const TILE_H = 250;
const GAP_X = 30; // margen horizontal entre tiles
const GAP_Y = 24; // margen vertical entre tiles

const STEP_X = TILE_W + GAP_X;
const STEP_Y = TILE_H + GAP_Y;

const VIEW_W = 1840; // ancho visible
const VIEW_H = 800; // alto visible para varias filas
const LEFT_PAD = 40; // padding izquierdo

// === Config ===
type GridPublicConfig = {
  cols?: number; // si no se define, se calcula desde VIEW_W / STEP_X
  rowsVisible?: number; // filas visibles para limitar el alto dinámicamente
  gapX?: number; // opcional, para personalizar márgenes por instancia
  gapY?: number;
};

export class Grid extends L.Component {
  private _index = 0; // índice lineal
  private _cols = 0; // columnas usadas en layout
  private _totalW = 0;
  private _totalH = 0;
  private _itemsLen = 0;

  public config: GridPublicConfig = {};

  static override _template() {
    return {
      Title: {
        x: LEFT_PAD,
        y: 0,
        text: {
          text: "",
          fontSize: 36,
          fontFace: "RelaxAI-SoraRegular",
          textColor: Theme.colors.text,
        },
      },
      Viewport: {
        x: 0,
        y: 100,
        w: VIEW_W + LEFT_PAD,
        h: VIEW_H,
        clipping: true,
        Grid: {
          x: LEFT_PAD,
          y: 0,
          transitions: {
            x: { duration: 0.25, timingFunction: "ease-out" },
            y: { duration: 0.25, timingFunction: "ease-out" },
          },
        },
      },
    };
  }

  // === API pública (compatible con Rail) ===
  public reset() {
    this._index = 0;
    this._scrollToIndex();
  }

  getFocusIndex(): number {
    return this._index;
  }

  setFocusIndex(i: number) {
    const max = Math.max(0, this._itemsLen - 1);
    this._index = Math.max(0, Math.min(i ?? 0, max));
    this._scrollToIndex();
    this._refocus();
  }

  set title(v: string) {
    this.tag("Title").text.text = v;
  }

  set items(v: TileData[]) {
    const viewW = VIEW_W;
    const colsAuto = Math.max(1, Math.floor(viewW / STEP_X));
    this._cols = Math.max(1, this.config.cols ?? colsAuto);

    const gapX = this.config.gapX ?? GAP_X;
    const gapY = this.config.gapY ?? GAP_Y;

    this._itemsLen = v.length;

    this.tag("Viewport.Grid").children = v.map((it, i) => {
      const col = i % this._cols;
      const row = Math.floor(i / this._cols);
      return {
        type: Tile,
        x: col * (TILE_W + gapX),
        y: row * (TILE_H + gapY),
        data: it,
        signals: { navigate: "onChildNavigate" },
      };
    });

    const rows = Math.ceil(v.length / this._cols);
    this._totalW = Math.max(this._cols * (TILE_W + gapX), viewW);
    this._totalH = Math.max(rows * (TILE_H + gapY), VIEW_H);

    const max = Math.max(0, v.length - 1);
    this._index = Math.max(0, Math.min(this._index, max));

    this._scrollToIndex();
  }

  // Burbujeo hacia la página
  onChildNavigate(path: string, params?: any) {
    this.signal("navigate", path, params);
  }

  // === Focus ===
  override _getFocused() {
    return this.tag("Viewport.Grid").children[this._index];
  }

  // === Key handling 2D ===
  override _handleLeft() {
    if (this._itemsLen === 0) return true;
    const col = this._colOf(this._index);
    if (col > 0) {
      this._index--;
      this._scrollToIndex();
    }
    return true;
  }

  override _handleRight() {
    if (this._itemsLen === 0) return true;
    const col = this._colOf(this._index);
    const lastCol = this._cols - 1;
    if (this._index < this._itemsLen - 1 && col < lastCol) {
      this._index++;
      this._scrollToIndex();
    }
    return true;
  }

  override _handleUp() {
    if (this._itemsLen === 0) return true;
    const next = this._index - this._cols;
    if (next >= 0) {
      this._index = next;
      this._scrollToIndex();
    } else {
      this.signal("focusPrev");
    }
    return true;
  }

  override _handleDown() {
    if (this._itemsLen === 0) return true;
    const next = this._index + this._cols;
    if (next <= this._itemsLen - 1) {
      this._index = next;
      this._scrollToIndex();
    } else {
      this.signal("focusNext");
    }
    return true;
  }

  // === Helpers ===
  private _rowOf(i: number) {
    return Math.floor(i / this._cols);
  }
  private _colOf(i: number) {
    return i % this._cols;
  }

  private _scrollToIndex() {
    const grid = this.tag("Viewport.Grid") as L.Element;
    const viewW = VIEW_W;
    const viewH = this.config.rowsVisible
      ? this.config.rowsVisible * STEP_Y
      : VIEW_H;

    const col = this._colOf(this._index);
    const row = this._rowOf(this._index);

    const gapX = this.config.gapX ?? GAP_X;
    const gapY = this.config.gapY ?? GAP_Y;

    const targetCenterX = col * (TILE_W + gapX) + TILE_W / 2;
    const targetCenterY = row * (TILE_H + gapY) + TILE_H / 2;

    const maxScrollX = Math.max(0, this._totalW - viewW);
    const maxScrollY = Math.max(0, this._totalH - viewH);

    const scrollX = Math.min(
      Math.max(targetCenterX - viewW / 2, 0),
      maxScrollX
    );
    const scrollY = Math.min(
      Math.max(targetCenterY - viewH / 2, 0),
      maxScrollY
    );

    grid.setSmooth("x", LEFT_PAD - scrollX);
    grid.setSmooth("y", 0 - scrollY);

    if (this.config.rowsVisible) {
      const vp = this.tag("Viewport") as L.Element;
      vp.h = viewH;
    }
  }
}
