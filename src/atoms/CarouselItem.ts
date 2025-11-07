import { Lightning as L, Utils } from "@lightningjs/sdk";
import { Theme } from "../core/theme";
import { TileData } from "./Tile";

const HERO_H = 650;
const SIDE_MARGIN = 100;

export class CarouselItem extends L.Component {
  static width = 1920;
  static height = 600;

  private _data!: TileData;

  static override _template() {
    return {
      Poster: {
        PosterImg: {
          w: (w: number) => w,
          h: (h: number) => h,
          src: null as any,
        },
        Overlay: {
          w: (w: number) => w,
          h: (h: number) => h,
          rect: true,
          colorTop: 0x00000000,
          colorBottom: 0xc0000000,
        },
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
      },
    };
  }

  set item(v: TileData) {
    this._data = v;
    this.patch({
      Poster: v.posterSrc
        ? { src: Utils.asset(v.posterSrc) }
        : { color: 0xff333333 },
    });
    this.tag("Info.Title").patch({ text: { text: v.title ?? "" } });

    const genres = Array.isArray((v as any).genres)
      ? (v as any).genres.join(", ")
      : (v as any).genres || "";

    const parts = [
      v.year ? `${v.year}` : null,
      v.duration ? `${v.duration} min` : null,
      v.author ? `${v.author}` : null,
      genres ? `${genres}` : null,
    ].filter(Boolean);

    const textParts = parts.join("  •  ");

    this.tag("Info.Meta").patch({ text: { text: textParts } });

    this.tag("DescBox").patch({ text: { text: v.description } });
  }

  override _focus() {
    (this.tag("Poster") as L.Element).patch({
      shader: {
        type: L.shaders.Outline,
        thickness: 8,
        color: Theme.colors.accent,
      },
    });
  }
  override _unfocus() {
    (this.tag("Poster") as L.Element).patch({ shader: null });
  }

  private _getCurrentSection(): string {
    if (typeof window === "undefined") return "home";
    const seg =
      (window.location.hash || "").replace(/^#\/?/, "").split("/")[0] || "home";
    return seg.toLowerCase();
  }

  override _handleEnter() {
    if (!this._data) return true;
    const section = this._getCurrentSection().toLowerCase() || "home";
    this.fireAncestors("$onChildNavigate" as any, `${section}/detail`, {
      id: this._data?.id,
    });
    return true;
  }
}
