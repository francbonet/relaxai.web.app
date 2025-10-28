import { Lightning as L, Img, Utils } from "@lightningjs/sdk";
import { Theme } from "../core/theme";

export interface ControlButtonSpec extends L.Component.TemplateSpec {
  Bg: L.Component;
  Icon: L.Component;
}

type ControlButtonTemplate = L.Component.Template<ControlButtonSpec>;

// Props configurables
type ControlButtonOpts = {
  src?: string; // ruta del icono
  size?: number; // tamaño (w=h)
  radius?: number; // radio esquinas
  iconScale?: number; // porcentaje del tamaño para el icono (0..1)
};

export class ControlButton
  extends L.Component<ControlButtonSpec>
  implements L.Component.ImplementTemplateSpec<ControlButtonSpec>
{
  private _src: string | null = null;
  private _size = 80;
  private _radius = 8;
  private _iconScale = 0.5; // 50% del tamaño

  // ===== API pública =====
  // set src(v: string | null) {
  //   this._src = v;
  //   this._applyIcon();
  // }

  set size(v: number) {
    if (!Number.isFinite(v) || v <= 0) return;
    this._size = v;
    this._applySizing();
  }

  set radius(v: number) {
    if (!Number.isFinite(v) || v < 0) return;
    this._radius = v;
    this._applyRadius();
  }

  set iconScale(v: number) {
    if (!Number.isFinite(v) || v <= 0 || v > 1) return;
    this._iconScale = v;
    this._applyIcon();
  }

  get Bg() {
    return this.tag("Bg");
  }
  get Icon() {
    return this.tag("Icon");
  }

  // ===== Template =====
  static override _template(): ControlButtonTemplate {
    // valores por defecto (se recalculan en _init)
    return {
      w: 80,
      h: 80,
      Bg: {
        w: 80,
        h: 80,
        rect: true,
        color: Theme.colors.accent, // unfocus
        shader: { type: L.shaders.RoundedRectangle, radius: 8 },
      },
      Icon: {
        mount: 0.5,
        x: 40,
        y: 40,
        color: 0xff000000,
        texture: undefined,
      },
    };
  }

  // ===== Ciclo de vida =====
  override _init() {
    // Asegura coherencia inicial
    this._applySizing();
    this._applyRadius();
    this._applyIcon();
  }

  // ===== Focus / Unfocus (cambia color de fondo) =====
  override _focus() {
    this.Bg?.patch({ color: Theme.colors.text }); // foco
    // pequeño feedback
    this.setSmooth("scale", 1.04, { duration: 0.12 });
  }

  override _unfocus() {
    this.Bg?.patch({ color: Theme.colors.accent }); // sin foco
    this.setSmooth("scale", 1.0, { duration: 0.12 });
  }

  // ===== Interacción (Enter dispara signal) =====
  override _handleEnter() {
    // envía señal hacia el padre; payload útil (src)
    this.signal("select", { src: this._src });
    return true;
  }

  // ===== Helpers internos =====
  private _applySizing() {
    this.w = this._size;
    this.h = this._size;
    this.Bg?.patch({ w: this._size, h: this._size });
    this.Icon?.patch({
      x: this._size / 2,
      y: this._size / 2,
    });
    this._applyIcon(); // re-calcula contain con nuevo size
  }

  private _applyRadius() {
    this.Bg?.patch({
      shader: { type: L.shaders.RoundedRectangle, radius: this._radius },
    });
  }

  private _applyIcon() {
    const iconSide = Math.round(this._size * this._iconScale);
    if (this._src) {
      this.Icon?.patch({
        texture: Img(Utils.asset(this._src)).contain(iconSide, iconSide),
      });
    } else {
      this.Icon?.patch({ texture: null });
    }
  }
}

export default ControlButton;
