// src/atoms/HtmlParagraphImage.ts
import { Lightning } from "@lightningjs/sdk";
import { renderParagraphToDataUrl } from "../utils/htmlTextRenderer";

type HtmlContentInput =
  | string
  | {
      text?: string;
      html?: string;
      width?: number;
      fontFamily?: string;
      style?: Partial<CSSStyleDeclaration>;
      containerStyle?: Partial<CSSStyleDeclaration>;
    };

export class HtmlParagraphImage extends Lightning.Component {
  private _width = 800;
  private _lastKey: string | null = null;

  static override _template() {
    return {
      Img: {
        x: 0,
        y: 0,
        texture: {
          type: Lightning.textures.ImageTexture,
          src: null,
        },
      },
    };
  }

  set width(value: number) {
    this._width = value;
  }

  /**
   * Renderitza text/HTML via DOM → canvas → dataURL → ImageTexture.
   *
   * Accepta:
   *  - string simple: setContent("Text pla")
   *  - objecte: setContent({ html, width, fontFamily, style, ... })
   */
  async setContent(content: HtmlContentInput) {
    let opts: {
      text?: string;
      html?: string;
      width: number;
      fontFamily?: string;
      style?: Partial<CSSStyleDeclaration>;
      containerStyle?: Partial<CSSStyleDeclaration>;
    };
    let key: string;

    if (typeof content === "string") {
      const font = "RelaxAI-Sora";

      key = `text:${font}:${this._width}:${content}`;

      opts = {
        text: content,
        width: this._width,
        fontFamily: font,
        style: {
          fontFamily: font,
          fontSize: "32px",
          lineHeight: "1.6",
          letterSpacing: "0.02em",
          color: "#FFFFFF",
          textAlign: "center",
        },
      };
    } else {
      const { text, html, width, fontFamily, style, containerStyle } = content;

      const font = fontFamily ?? "RelaxAI-Sora";
      const finalWidth = width ?? this._width;

      key = JSON.stringify({
        text,
        html,
        width: finalWidth,
        fontFamily: font,
        style,
        containerStyle,
      });

      opts = {
        text,
        html,
        width: finalWidth,
        fontFamily: font,
        style: {
          fontFamily: font,
          fontSize: "32px",
          lineHeight: "1.6",
          letterSpacing: "0.02em",
          color: "#FFFFFF",
          textAlign: "left",
          ...(style ?? {}),
        },
        containerStyle,
      };
    }

    // Evitem recomputar si el contingut no canvia
    if (key === this._lastKey) return;
    this._lastKey = key;

    const src = await renderParagraphToDataUrl(opts);

    const img = this.tag("Img") as any;
    img.texture = {
      type: Lightning.textures.ImageTexture,
      src,
    };

    try {
      await img.texture.load();

      this.w = img.texture.source.w;
      this.h = img.texture.source.h;
    } catch (e) {
      console.warn("[HtmlParagraphImage] Error loading texture", e);
    }
  }
}
