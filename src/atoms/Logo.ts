import { Lightning as L } from "@lightningjs/sdk";
import { Theme, Typography } from "../core/theme";

interface LogoSpec extends L.Component.TemplateSpec {
  Wordmark?: {
    LabelRelax?: L.Component;
    LabelAI?: L.Component;
  };
}

export default class Logo
  extends L.Component<LogoSpec>
  implements L.Component.ImplementTemplateSpec<LogoSpec>
{
  private _left = "Relax";
  private _right = "AI";
  private _spacing = 6;

  set label(v: string) {
    const parts = v.split(/\s+/);
    this._left = parts[0] ?? "Relax";
    this._right = parts[1] ?? "AI";
    this._updateWordmark();
  }
  get label() {
    return `${this._left} ${this._right}`;
  }

  get Wordmark() {
    return this.tag("Wordmark");
  }

  get LabelRelax() {
    return (this.tag("Wordmark") as any).tag("LabelRelax") as L.Component;
  }

  get LabelAI() {
    return (this.tag("Wordmark") as any).tag("LabelAI") as L.Component;
  }

  static override _template(): L.Component.Template<LogoSpec> {
    return {
      w: 260,
      h: 72,
      rect: true,
      color: 0x00000000,
      Wordmark: {
        x: 0,
        mountY: 0.5,
        LabelRelax: {
          text: {
            text: "Relax",
            fontFace: Typography.heading.face,
            fontSize: Typography.heading.size,
            textColor: Theme.colors.text,
          },
        },
        LabelAI: {
          x: 135,
          text: {
            text: "AI",
            fontFace: Typography.heading.face,
            fontSize: Typography.heading.size,
            textColor: Theme.colors.accent,
          },
        },
      },
    };
  }

  override _init() {
    this._updateWordmark();
  }

  private _updateWordmark() {
    this.patch({
      Wordmark: {
        LabelRelax: { text: { text: this._left } },
        LabelAI: { text: { text: this._right } },
      },
    });
  }
}
