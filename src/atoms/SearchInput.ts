// src/molecules/SearchInput.ts
import { Lightning as L } from "@lightningjs/sdk";
import { Theme } from "../core/theme";

type SearchInputSignals = {
  enter: (value: string) => void;
  changed: (value: string) => void;
};

export class SearchInput extends L.Component<L.Component.TemplateSpecLoose> {
  private _value = "";
  private _placeholder = "Search...";

  static override _template(): L.Component.Template<any> {
    return {
      Input: {
        x: 0,
        y: 0,
        w: (w: number) => w,
        h: (h: number) => h,
        Bg: {
          x: 0,
          y: 0,
          w: (w: number) => w,
          h: (h: number) => h,
          rect: true,
          color: 0xff131b2a,
          shader: null,
        },
        SearchText: {
          x: 40,
          y: 12,
          w: (w: number) => w,
          h: (h: number) => h,
          rect: true,
          text: {
            text: "Search...",
            fontSize: 38,
            textColor: 0xffffffff,
            fontFace: "RelaxAI-SoraMedium",
          },
        },
      },
    };
  }

  // ------- API -------
  get value() {
    return this._value;
  }

  set value(v: string) {
    this._value = (v ?? "").trimStart();
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

  setValue(v: string) {
    this._value = v;
    this._renderText();
  }

  // ------- Focus styles -------
  override _focus() {
    (this.tag("Bg") as L.Element).patch({
      shader: {
        type: L.shaders.Outline,
        thickness: 16,
        pixelSize: 16,
        color: Theme.colors.accent,
      },
    });
    this._renderText();
    this.signal("onFocus");
  }

  override _unfocus() {
    (this.tag("Bg") as L.Element).patch({
      shader: null,
    });
    this._renderText();
  }

  // ------- Tecles -------
  override _handleEnter() {
    this.signal("enter", this._value);
    return true;
  }

  // ------- Render intern -------
  private _renderText() {
    const empty = this._value.length === 0;
    const text = empty ? this._placeholder : this._value;
    const color = empty ? Theme.colors.textDim : Theme.colors.text;
    this.tag("SearchText").patch({ text: { text }, color });
  }
}

export default SearchInput;
