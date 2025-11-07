import { Lightning as L } from "@lightningjs/sdk";
import { Tile, TileData } from "../atoms/Tile";
import { Theme } from "../core/theme";

const TILE_W = 300;
const TILE_H = 250;
const GAP_X = 30;
const GAP_Y = 24;
const STEP_X = TILE_W + GAP_X;
const VIEW_W = 1840;
const VIEW_H = 800;
const LEFT_PAD = 40;

export type GridPublicConfig = {
  cols?: number;
  rowsVisible?: number;
  gapX?: number;
  gapY?: number;
  tileW?: number;
  tileH?: number;
};

export class Grid extends L.Component {
  private _index = 0;
  private _cols = 0;
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
        clipping: false,
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

  reset() {
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
    const colsAuto = Math.max(1, Math.floor(viewW / STEP_X));
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
    this._emitFocusMoved();
  }

  onChildNavigate(path: string, params?: any) {
    this.signal("navigate", path, params);
  }

  override _getFocused() {
    return this.tag("Viewport.Grid").children[this._index];
  }

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

  private _rowOf(i: number) {
    return Math.floor(i / this._cols);
  }
  private _colOf(i: number) {
    return i % this._cols;
  }

  private _emitFocusMoved() {
    const gapY = this.config.gapY ?? GAP_Y;
    const tileH = this.config.tileH ?? TILE_H;
    const row = this._rowOf(this._index);
    const col = this._colOf(this._index);
    const anchorY = row * (tileH + gapY);
    const centerY = anchorY + tileH / 2;
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
      maxScrollX,
    );
    grid.setSmooth("x", LEFT_PAD - scrollX);
  }
}

export default Grid;
