// atoms/ControlButton.ts
import { Lightning as L, Img, Utils } from "@lightningjs/sdk";
import { Theme } from "../core/theme";

export interface ControlButtonSpec extends L.Component.TemplateSpec {
  Bg: L.Component;
  Icon: L.Component;
}

type ControlButtonTemplate = L.Component.Template<ControlButtonSpec>;

export class ControlButton
  extends L.Component<ControlButtonSpec>
  implements L.Component.ImplementTemplateSpec<ControlButtonSpec>
{
  private _iconSrc: string | undefined;
  private _size = 80;
  private _radius = 8;
  private _iconScale = 0.5; // 50%

  // Getters curts
  get Bg() {
    return this.tag("Bg");
  }
  get Icon() {
    return this.tag("Icon");
  }

  static override _template(): ControlButtonTemplate {
    return {
      w: 80,
      h: 80,
      Bg: {
        w: 80,
        h: 80,
        rect: true,
        color: Theme.colors.text,
        shader: { type: L.shaders.RoundedRectangle, radius: 8 },
      },
      Icon: {
        mount: 0.5,
        x: 40,
        y: 40,
        w: 80,
        h: 80,
        color: 0xff000000,
        texture: undefined,
      },
    };
  }

  // ===== API pública (sense col·lidir amb Component.src) =====
  set iconSrc(v: string | undefined) {
    this._iconSrc = v;
    this._applyIcon();
  }
  set size(v: number) {
    if (Number.isFinite(v) && v > 0) {
      this._size = v;
      this._applySizing();
    }
  }
  set radius(v: number) {
    if (Number.isFinite(v) && v >= 0) {
      this._radius = v;
      this._applyRadius();
    }
  }
  set iconScale(v: number) {
    if (Number.isFinite(v) && v > 0 && v <= 1) {
      this._iconScale = v;
      this._applyIcon();
    }
  }

  // Helper semàntic (opcional)
  setVariant(v: "play" | "pause" | "rew" | "fwd" | "back") {
    const map: Record<string, string> = {
      play: "videos/controls/play.png",
      pause: "videos/controls/pause.png",
      rew: "videos/controls/rewind.png",
      fwd: "videos/controls/forward.png",
      back: "videos/controls/back.png",
    };
    this.iconSrc = map[v];
    this._applyIcon();
  }

  override _init() {
    this._applySizing();
    this._applyRadius();
    this._applyIcon();
  }

  override _focus() {
    this.Bg?.patch({ color: Theme.colors.accent });
    this.setSmooth("scale", 1.04, { duration: 0.12 });
  }
  override _unfocus() {
    this.Bg?.patch({ color: Theme.colors.text });
    this.setSmooth("scale", 1.0, { duration: 0.12 });
  }

  // Deixem que ENTER bublegi fins al pare (Player)
  override _handleEnter() {
    this.signal("select", { iconSrc: this._iconSrc });
    return false;
  }

  // ===== Interns =====
  private _applySizing() {
    this.w = this._size;
    this.h = this._size;
    this.Bg?.patch({ w: this._size, h: this._size });
    this.Icon?.patch({ x: this._size / 2, y: this._size / 2 });
    this._applyIcon();
  }

  private _applyRadius() {
    this.Bg?.patch({
      shader: { type: L.shaders.RoundedRectangle, radius: this._radius },
    });
  }

  private _applyIcon() {
    const iconSide = Math.round(this._size * this._iconScale);
    if (this._iconSrc) {
      this.Icon?.patch({
        texture: Img(Utils.asset(this._iconSrc)).contain(iconSide, iconSide),
      });
    } else {
      this.Icon?.patch({ texture: null });
    }
  }
}

export default ControlButton;
