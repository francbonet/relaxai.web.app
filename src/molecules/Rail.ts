import { Lightning as L } from "@lightningjs/sdk";
import { Tile, TileData } from "../atoms/Tile";
import { Theme } from "../core/theme";

const STEP = 330; // amplada targeta + gap (300 + 30)
const VIEW_W = 1840; // amplada visible del rail (ajusta-ho al teu layout)
const LEFT_PAD = 40; // padding esquerre (coincideix amb x del Row)

export class Rail extends L.Component {
  private _index = 0;
  private _totalW = 0;

  static override _template() {
    return {
      Title: {
        x: LEFT_PAD,
        y: 0,
        text: {
          text: "",
          fontSize: 32,
          fontFace: "RelaxAI-SoraRegular",
          textColor: Theme.colors.text,
        },
      },
      Viewport: {
        x: 0,
        y: 62,
        w: VIEW_W + LEFT_PAD,
        h: 270,
        clipping: true,
        Row: {
          x: LEFT_PAD,
          y: 0,
          transitions: { x: { duration: 0.25, timingFunction: "ease-out" } },
        },
      },
    };
  }

  public reset() {
    this._index = 0;
    this._scrollToIndex();
  }

  /** <-- NUEVO: API para que el padre (BasePage) pueda leer/poner el foco */
  getFocusIndex(): number {
    return this._index;
  }

  setFocusIndex(i: number) {
    const row = this.tag("Viewport.Row");
    const max = Math.max(0, row.children.length - 1);
    this._index = Math.max(0, Math.min(i ?? 0, max));
    this._scrollToIndex();
    this._refocus();
  }

  set title(v: string) {
    this.tag("Title").text.text = v;
  }

  set items(v: TileData[]) {
    this.tag("Viewport.Row").children = v.map((it, i) => ({
      type: Tile,
      x: i * STEP,
      signals: { navigate: "onChildNavigate" },
      data: it,
    }));

    this._totalW = v.length * STEP;
    const max = Math.max(0, v.length - 1);
    this._index = Math.max(0, Math.min(this._index, max));
    this._scrollToIndex();
  }

  // Bubble cap amunt perquè Home el rebi
  onChildNavigate(path: string, params?: any) {
    this.signal("navigate", path, params);
  }

  override _getFocused() {
    return this.tag("Viewport.Row").children[this._index];
  }

  override _handleLeft() {
    if (this._index > 0) {
      this._index--;
      this._scrollToIndex();
    }
    return true;
  }

  override _handleRight() {
    const max = this.tag("Viewport.Row").children.length - 1;
    if (this._index < max) {
      this._index++;
      this._scrollToIndex();
    }
    return true;
  }

  override _handleUp() {
    this.signal("focusPrev");
    return true;
  }
  override _handleDown() {
    this.signal("focusNext");
    return true;
  }

  private _scrollToIndex() {
    const row = this.tag("Viewport.Row") as L.Element;
    const viewW = VIEW_W;
    const targetItemX = this._index * STEP;
    const desiredCenter = targetItemX + STEP / 2;

    const maxScroll = Math.max(0, this._totalW - viewW);
    const scroll = Math.min(Math.max(desiredCenter - viewW / 2, 0), maxScroll);
    row.setSmooth("x", LEFT_PAD - scroll);
  }
}
