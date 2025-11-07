import { Lightning as L } from "@lightningjs/sdk";
import { Theme } from "../core/theme";
import { Button } from "../atoms/Button";
import type { TileData } from "../atoms/Tile";
import { watchlistStore } from "../state/watchlist.store";

const HERO_H = 650;
const SIDE_MARGIN = 100;
const WIDTH = Theme.w - 80;

export class Hero extends L.Component<L.Component.TemplateSpecLoose> {
  private _btnIndex = 0;
  private _btnOrder: Array<"PlayBtn" | "AddBtn"> = ["PlayBtn", "AddBtn"];
  private _data: TileData | null = null;

  static override _template(): L.Component.Template<any> {
    return {
      x: 40,
      w: WIDTH,
      h: HERO_H,
      Poster: { w: WIDTH, h: HERO_H, texture: null },
      Overlay: {
        w: WIDTH,
        h: HERO_H,
        rect: true,
        colorTop: 0x00000000,
        colorBottom: 0xe0000000,
      },
      Info: {
        x: SIDE_MARGIN,
        y: HERO_H - 450,
        Title: {
          text: {
            text: "",
            fontSize: 72,
            fontFace: "RelaxAI-SoraBold",
            textColor: Theme.colors.text,
          },
        },
        Meta: {
          y: 90,
          text: { text: "", fontSize: 30, textColor: Theme.colors.textDim },
        },
        DescBox: {
          y: 140,
          x: 0,
          w: Theme.w - SIDE_MARGIN * 2,
          text: {
            text: "",
            wordWrap: true,
            maxLines: 5,
            fontSize: 36,
            lineHeight: 40,
            textColor: Theme.colors.textDim,
          },
        },
        Buttons: {
          y: 250,
          PlayBtn: { type: Button, x: 0, w: 260, label: "WATCH NOW" },
          AddBtn: {
            type: Button,
            x: 275,
            w: 80,
            h: 80,
            shader: { type: L.shaders.RoundedRectangle, radius: 40 },
            label: "",
            Icon: {
              mount: 0.5,
              x: 40,
              y: 40,
              text: { text: "+", textColor: Theme.colors.bg, fontSize: 40 },
            },
          },
        },
      },
      signals: { navigate: true, focusPrev: true, focusNext: true },
    };
  }

  set data(v: TileData) {
    this._data = v;
  }

  override _active(): void {
    if (this._data) this.refreshAddButton(this._data.id);
  }

  refreshAddButton(id: string) {
    const hasStore = watchlistStore.has(id);
    this.tag("AddBtn.Icon").patch({
      text: { text: `${hasStore ? "-" : "+"}` },
    });
  }

  getFocusIndex() {
    return this._btnIndex;
  }
  setFocusIndex(i: number) {
    this._btnIndex = Math.max(0, Math.min(i, this._btnOrder.length - 1));
  }

  override _getFocused() {
    const key = this._btnOrder[this._btnIndex];
    return this.tag(`Info.Buttons.${key}`);
  }
  public setIndex(i: number) {
    this._btnIndex = Math.max(0, Math.min(i, this._btnOrder.length - 1));
    this._refocus();
  }
  public step(dir: -1 | 1) {
    this.setIndex(this._btnIndex + dir);
  }

  override _handleRight() {
    this.setFocusIndex(this._btnIndex + 1);
    this._refocus();
    return true;
  }
  override _handleLeft() {
    this.setFocusIndex(this._btnIndex - 1);
    this._refocus();
    return true;
  }
  override _handleDown() {
    this.signal("focusNext");
    return true;
  }
  override _handleUp() {
    this.signal("focusPrev");
    return true;
  }
  override _handleEnter() {
    if (this._btnOrder[this._btnIndex] === "PlayBtn") {
      this.signal("navigate", "player", { id: this._data?.id });
      return true;
    }
    if (this._btnOrder[this._btnIndex] === "AddBtn") {
      if (this._data) {
        watchlistStore.toggle(this._data);
        this.refreshAddButton(this._data.id);
      }
      return true;
    }
  }
}
