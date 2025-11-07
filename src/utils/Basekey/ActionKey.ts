import { Key as BaseKey } from "@lightningjs/ui";
import { Theme } from "../../core/theme";

export class ActionKey extends BaseKey {
  override _active() {
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
    return 160;
  }
  get height() {
    return 50;
  }
}
