// src/atoms/Tile.ts
import { Lightning as L, Utils } from "@lightningjs/sdk";
import { Theme } from "../core/theme";

export interface TileSpec extends L.Component.TemplateSpec {
  PosterParent: L.Component;
  Poster: { PosterBg: L.Component; PosterImg: L.Component };
  Title: L.Component;
  FocusRing: L.Component;
}

export interface TileData {
  id: string;
  title: string;
  text: string;
  description: string;
  duration: string;
  year: number;
  author: string;
  imageSrc: string;
  posterSrc?: string;
  videoSrc: string;
  genres?: string[];
  maturity?: string;
}

export class Tile
  extends L.Component<TileSpec>
  implements L.Component.ImplementTemplateSpec<TileSpec>
{
  private _title = "";
  private _videoSrc = "";
  private _imageSrc = "";
  private _data?: TileData;

  get titleElement() {
    return this.tag("Title");
  }
  get poster() {
    return this.tag("Poster");
  }
  get posterImg() {
    return this.poster?.tag("PosterImg") as L.Element;
  }

  set title(v: string) {
    this._title = v;
    this.titleElement?.patch({ text: { text: v } });
  }

  set imageSrc(v: string) {
    this._imageSrc = v;
    this.posterImg.patch({
      src: Utils.asset(v || "/assets/images/placeholder.png"),
    });
  }

  get imageSrc() {
    return this._imageSrc;
  }

  set videoSrc(v: string) {
    this._videoSrc = v;
  }
  get videoSrc() {
    return this._videoSrc;
  }

  // 🔹 setter per injectar totes les dades d’un cop
  set data(d: TileData) {
    this._data = d;
    this.title = d.title;
    this.imageSrc = d.imageSrc;
    this.videoSrc = d.videoSrc;
  }

  get data(): TileData | undefined {
    return this._data;
  }

  static override _template(): L.Component.Template<TileSpec> {
    return {
      w: 300,
      h: 170,
      rect: true,
      Poster: {
        w: (w: number) => w,
        h: (h: number) => h,
        PosterBg: {
          rect: true,
          w: (w: number) => w,
          h: (h: number) => h,
          color: Theme.colors.tileunfocus,
        },
        PosterImg: { w: (w: number) => w, h: (h: number) => h },
      },
      Title: {
        y: 176,
        text: {
          text: "",
          fontSize: 22,
          fontFace: "RelaxAI-SoraRegular",
          textColor: Theme.colors.textDim,
        },
      },
    };
  }

  override _focus() {
    (this.tag("Poster") as L.Element).patch({
      shader: {
        type: L.shaders.Outline,
        thickness: 16,
        pixelSize: 16,
        color: Theme.colors.accent,
      },
    });
  }

  override _unfocus() {
    (this.tag("Poster") as L.Element).patch({ shader: null });
  }

  /** Extreu la secció actual del hash: #/home/..., #/suggest/..., etc. */
  private _getCurrentSection(): string {
    if (typeof window === "undefined") return "home";
    const seg =
      (window.location.hash || "").replace(/^#\/?/, "").split("/")[0] || "home";
    return seg.toLowerCase();
  }

  override _handleEnter() {
    if (!this._data) return true;
    const section = this._getCurrentSection().toLowerCase() || "home";
    this.signal("navigate", `${section}/detail`, { id: this._data?.id });
    return true;
  }
}
