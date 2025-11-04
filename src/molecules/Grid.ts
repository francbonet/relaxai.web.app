// src/molecules/Grid.ts
import { Lightning as L } from "@lightningjs/sdk";
import { Tile, TileData } from "../atoms/Tile";
import { Theme } from "../core/theme";

/**
 * Grid configurable inspirado en Rail:
 * - Mantiene API: getFocusIndex / setFocusIndex / reset / title / items
 * - Navegación con scroll suave en X (el scroll Y lo gestiona la página)
 * - Soporta márgenes configurables entre items (gapX, gapY)
 * - Cálculo automático o forzado de columnas
 * - Emite focusMoved({ index, row, col, anchorY, centerY, rowH, cols, itemsLen })
 */

// === Defaults de layout ===
const TILE_W = 300;
const TILE_H = 250;
const GAP_X = 30;
const GAP_Y = 24;

const STEP_X = TILE_W + GAP_X;
const STEP_Y = TILE_H + GAP_Y;

const VIEW_W = 1840; // ancho visible (para centrado X)
const VIEW_H = 800; // alto visible (no recortamos; solo referencia)
const LEFT_PAD = 40;

// === Config pública ===
export type GridPublicConfig = {
  cols?: number; // si no se define, se calcula desde VIEW_W / STEP_X
  rowsVisible?: number; // Nº de filas visibles (para cálculos en la página)
  gapX?: number;
  gapY?: number;
  tileW?: number; // override del ancho de Tile
  tileH?: number; // override del alto de Tile
};

export class Grid extends L.Component {
  private _index = 0; // índice lineal del foco
  private _cols = 0; // columnas efectivas
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
      // Viewport NO recorta en Y; dejamos que la página haga el scroll global
      Viewport: {
        x: 0,
        y: 100,
        w: VIEW_W + LEFT_PAD,
        h: VIEW_H,
        clipping: false, // 🔴 sin clipping vertical
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
    this._emitFocusMoved();
  }

  getFocusIndex(): number {
    return this._index;
  }

  setFocusIndex(i: number) {
    const max = Math.max(0, this._itemsLen - 1);
    this._index = Math.max(0, Math.min(i ?? 0, max));
    this._scrollToIndex();
    this._emitFocusMoved();
    this._refocus();
  }

  set title(v: string) {
    this.tag("Title").text.text = v;
  }

  set items(v: TileData[]) {
    const viewW = VIEW_W;

    const gapX = this.config.gapX ?? GAP_X;
    const gapY = this.config.gapY ?? GAP_Y;
    const tileW = this.config.tileW ?? TILE_W;
    const tileH = this.config.tileH ?? TILE_H;

    const stepX = tileW + gapX;
    const stepY = tileH + gapY;

    const colsAuto = Math.max(1, Math.floor(viewW / STEP_X)); // heurística
    this._cols = Math.max(1, this.config.cols ?? colsAuto);

    this._itemsLen = v.length;

    this.tag("Viewport.Grid").children = v.map((it, i) => {
      const col = i % this._cols;
      const row = Math.floor(i / this._cols);
      return {
        type: Tile,
        x: col * stepX,
        y: row * stepY,
        data: it,
        signals: { navigate: "onChildNavigate" },
      };
    });

    const rows = Math.ceil(v.length / this._cols);
    this._totalW = Math.max(this._cols * stepX, viewW);
    this._totalH = Math.max(rows * stepY, VIEW_H);

    const max = Math.max(0, v.length - 1);
    this._index = Math.max(0, Math.min(this._index, max));

    this._scrollToIndex();
    this._emitFocusMoved(); // emite posición inicial
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
      this._emitFocusMoved();
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
      this._emitFocusMoved();
    }
    return true;
  }

  override _handleUp() {
    if (this._itemsLen === 0) return true;
    const next = this._index - this._cols;
    if (next >= 0) {
      this._index = next;
      this._scrollToIndex();
      this._emitFocusMoved();
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
      this._emitFocusMoved();
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

  /** Emite un payload rico con la posición vertical del foco (para que la página haga el scroll Y). */
  private _emitFocusMoved() {
    const gapX = this.config.gapX ?? GAP_X;
    const gapY = this.config.gapY ?? GAP_Y;
    const tileW = this.config.tileW ?? TILE_W;
    const tileH = this.config.tileH ?? TILE_H;

    const row = this._rowOf(this._index);
    const col = this._colOf(this._index);

    const anchorY = row * (tileH + gapY); // top Y de la fila enfocada
    const centerY = anchorY + tileH / 2; // centro del tile enfocado
    const rowH = tileH + gapY;

    this.signal("focusMoved", {
      index: this._index,
      row,
      col,
      anchorY,
      centerY,
      rowH,
      cols: this._cols,
      itemsLen: this._itemsLen,
    });
  }

  /**
   * Solo scroll en X para centrar el elemento en la ventana horizontal.
   * El scroll vertical (Y) lo controla la página usando focusMoved().
   */
  private _scrollToIndex() {
    const grid = this.tag("Viewport.Grid") as L.Element;

    const gapX = this.config.gapX ?? GAP_X;
    const tileW = this.config.tileW ?? TILE_W;

    const viewW = VIEW_W;

    const col = this._colOf(this._index);
    const targetCenterX = col * (tileW + gapX) + tileW / 2;

    const maxScrollX = Math.max(0, this._totalW - viewW);
    const scrollX = Math.min(
      Math.max(targetCenterX - viewW / 2, 0),
      maxScrollX
    );

    grid.setSmooth("x", LEFT_PAD - scrollX);

    // 🔕 No tocamos grid.y. La página ajustará Viewport.Content.y globalmente.
  }
}

export default Grid;
