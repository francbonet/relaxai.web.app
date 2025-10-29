// src/molecules/MyCarousel.ts
import { Lightning as L } from "@lightningjs/sdk";
import { Carousel } from "@lightningjs/ui";
import { CarouselItem } from "../atoms/CarouselItem";

export class CarouselComp extends L.Component {
  private _timer?: ReturnType<typeof setInterval>; // autoplay
  private _resumeTmr?: ReturnType<typeof setTimeout>; // reactivació diferida
  private _interval = 6_000; // 6 segons
  private _isFocused = false;

  static override _template(): L.Component.Template {
    return {
      Rail: {
        type: Carousel,
        direction: "row",
        spacing: 24,
        scroll: 0.5,
        autoResize: false,
      } as any,
    };
  }

  set items(data: Array<{ title: string; src?: string }>) {
    const rail = this.tag("Rail") as any;

    rail.reload(
      data.map((d) => ({
        type: CarouselItem,
        w: 1920,
        h: 600,
        item: d,
      }))
    );

    rail.items.forEach((cmp: any, i: number) => {
      if (cmp) cmp.item = data[i];
    });

    // Si ja té focus i no hi ha autoplay actiu, arrenca
    if (this._isFocused && !this._timer) this._startAutoplay();
  }

  // ---- Bubble cap amunt
  $onChildNavigate(path: string, params?: any) {
    this.signal("navigate", path, params);
  }

  // ---- Focus lifecycle
  override _focus() {
    this._isFocused = true;
    this._clearResume(); // per si veníem d'una suspensió
    this._startAutoplay();
  }

  override _unfocus() {
    this._isFocused = false;
    this._stopAutoplay();
    this._clearResume();
  }

  // ---- Interacció humana: pausa i programa reactivació al cap de 6s
  override _captureLeft() {
    this._pauseAndScheduleResume();
    return false; // deixa que el Rail gestioni el moviment
  }
  override _captureRight() {
    this._pauseAndScheduleResume();
    return false;
  }
  // (opc.) si vols que PageUp/PageDown també pausin:
  _handlePageDown() {
    (this.tag("Rail") as any).index += 4;
    this._pauseAndScheduleResume();
  }
  _handlePageUp() {
    (this.tag("Rail") as any).index -= 4;
    this._pauseAndScheduleResume();
  }

  // ---- Helpers autoplay
  private _startAutoplay() {
    this._stopAutoplay();
    const rail = this.tag("Rail") as any;
    this._timer = setInterval(() => {
      try {
        rail._handleRight?.(); // equivalent a prémer RIGHT
      } catch (e) {
        // ignorar errors (p.e. si no hi ha items)
      }
    }, this._interval);
  }

  private _stopAutoplay() {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = undefined;
    }
  }

  private _pauseAndScheduleResume() {
    this._stopAutoplay();
    this._clearResume();
    this._resumeTmr = setTimeout(() => {
      if (this._isFocused) this._startAutoplay();
    }, this._interval); // reprèn després de 6s sense interacció
  }

  private _clearResume() {
    if (this._resumeTmr) {
      clearTimeout(this._resumeTmr);
      this._resumeTmr = undefined;
    }
  }

  // ---- Delegació de focus
  override _getFocused() {
    return this.tag("Rail");
  }

  // ---- Neteja defensiva
  override _detach() {
    this._stopAutoplay();
    this._clearResume();
  }
}
