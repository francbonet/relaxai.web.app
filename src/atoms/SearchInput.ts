// src/molecules/SearchInput.ts
import { Lightning as L } from "@lightningjs/sdk";

type SearchInputSignals = {
  enter: (value: string) => void;
  changed: (value: string) => void;
};

export class SearchInput extends L.Component<L.Component.TemplateSpecLoose> {
  private _value = "";
  private _placeholder = "Search...";

  static override _template(): L.Component.Template<any> {
    return {
      // El pare controla x, y, w, h (com al teu snippet)
      rect: true,
      color: 0xff131b2a, // background per defecte
      shader: { type: L.shaders.RoundedRectangle, radius: 10 },
      SearchText: {
        x: 40, // GAP_W “suau”
        y: 12,
        w: 1000,
        h: 80,
        color: 0xffe3e5e8,
        text: {
          text: "Search...",
          fontSize: 38,
          // textAlign: "left" as const,
          fontFace: "RelaxAI-SoraMedium",
          // wordWrapWidth: (t: any) => Math.max(0, (t.w || 0) - 160),
          // maxLines: 1,
          // cutEx: 1,
        },
      },

      FocusRing: {
        // subtil resplendor de focus
        mount: 0.5,
        x: (t: any) => (t.w || 0) / 2,
        y: (t: any) => (t.h || 0) / 2,
        w: (t: any) => t.w || 0,
        h: (t: any) => t.h || 0,
        rect: true,
        color: 0x00ffffff,
        alpha: 0,
        shader: {
          type: L.shaders.RoundedRectangle,
          radius: 12,
          stroke: 2,
          strokeColor: 0x66ffffff,
        },
      },
    };
  }

  // ------- API -------
  get value() {
    return this._value;
  }

  set value(v: string) {
    this._value = (v ?? "").trimStart(); // no white leading
    this._renderText();
    this.signal("changed", this._value);
  }

  get placeholder() {
    return this._placeholder;
  }
  set placeholder(v: string) {
    this._placeholder = v ?? "Search...";
    this._renderText();
  }

  clear() {
    this._value = "";
    this._renderText();
  }

  // ------- Focus styles -------
  override _focus() {
    // canvi de to + anell de focus
    this.patch({ color: 0xff1a2436 });
    this.tag("FocusRing").setSmooth("alpha", 1);
    this._renderText();
  }

  override _unfocus() {
    this.patch({ color: 0xff131b2a });
    this.tag("FocusRing").setSmooth("alpha", 0);
    this._renderText();
  }

  // ------- Tecles -------
  override _handleEnter() {
    // notifica el valor actual; el pare pot obrir el Keyboard aquí
    this.signal("enter", this._value);
    return true;
  }

  // Opcional: permet tecleig directe (si tens teclat físic)
  // override _handleKey(code: number) {
  //   // backspace
  //   if (code === 8) {
  //     this.value = this._value.slice(0, -1);
  //     return true;
  //   }
  //   // espai
  //   if (code === 32) {
  //     this.value = `${this._value} `;
  //     return true;
  //   }
  //   // A..Z, 0..9 i símbols bàsics
  //   if (code >= 48 && code <= 90) {
  //     this.value = this._value + String.fromCharCode(code);
  //     return true;
  //   }
  // }

  // ------- Render intern -------
  private _renderText() {
    const empty = this._value.length === 0;
    const text = empty ? this._placeholder : this._value;
    const color = empty ? 0x99e3e5e8 : 0xffe3e5e8;
    this.tag("SearchText").patch({ text: { text }, color });
  }
}

export default SearchInput;
