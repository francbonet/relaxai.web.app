import { Lightning as L } from "@lightningjs/sdk";
import { Theme, Typography } from "../core/theme";

const PAD_X = 24;
const RADIUS = 8;

export interface ButtonSpec extends L.Component.TemplateSpec {
  Label: L.Component;
}

export class Button
  extends L.Component<ButtonSpec>
  implements L.Component.ImplementTemplateSpec<ButtonSpec>
{
  private _label = "";

  static override _template(): L.Component.Template<ButtonSpec> {
    return {
      w: 300,
      h: 80,
      rect: true,
      color: Theme.colors.text,
      shader: { type: L.shaders.RoundedRectangle, radius: RADIUS },
      Label: {
        mountY: 0.5,
        x: PAD_X,
        y: (h: number) => h / 2,
        text: {
          text: "",
          fontFace: Typography.button.face,
          fontSize: Typography.button.size,
          textColor: Theme.colors.bg,
        },
      },
    };
  }

  get label() {
    return this._label;
  }
  set label(v: string) {
    this._label = v;
    this.tag("Label")?.patch({ text: { text: v } });
  }

  override _focus() {
    this.color = Theme.colors.accent;
    this.tag("Label")?.patch({ text: { textColor: Theme.colors.bg } });
  }

  override _unfocus() {
    this.color = Theme.colors.text;
    this.tag("Label")?.patch({ text: { textColor: Theme.colors.bg } });
  }
}
