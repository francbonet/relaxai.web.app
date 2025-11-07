import { Key as BaseKey } from "@lightningjs/ui";
import { Theme } from "../../core/theme";

export class Key extends BaseKey {
  override _firstActive() {
    this.label = { mountY: 0.45, fontSize: 36 };
    this.labelColors = {
      unfocused: Theme.colors.text,
      focused: Theme.colors.bg,
    };
    this.backgroundColors = {
      unfocused: Theme.colors.bg,
      focused: Theme.colors.accent,
    };
    if (this.hasFocus()) this._focus();
  }

  get width() {
    return 50;
  }
  get height() {
    return 50;
  }
}
