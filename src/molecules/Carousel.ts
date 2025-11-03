// src/molecules/MyCarousel.ts
import { Lightning as L } from "@lightningjs/sdk";
import { Carousel } from "@lightningjs/ui";
import { CarouselItem } from "../atoms/CarouselItem";

export class CarouselComp extends L.Component {
  private _timer?: ReturnType<typeof setInterval>; // autoplay
  private _resumeTmr?: ReturnType<typeof setTimeout>; // reactivació diferida
  private _interval = 6_000; // 6 segons
  private _isFocused = false;

  // 🔹 refs privades per listeners (nou)
  private _onHidden?: () => void;
  private _onVisible?: () => void;
  private _onVisChange?: () => void;

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

  // ===== API per BasePage (persistència de focus) =====
  getFocusIndex(): number {
    const rail = this.tag("Rail") as any;
    return Number(rail?.index ?? 0);
  }

  setFocusIndex(i: number) {
    const rail = this.tag("Rail") as any;
    const max = Math.max(0, (rail?.children?.length || 1) - 1);
    rail.index = Math.max(0, Math.min(i ?? 0, max));
    this._refocus();
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

    const max = Math.max(0, (rail?.children?.length || 1) - 1);
    rail.index = Math.max(0, Math.min(Number(rail?.index ?? 0), max));

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

  // ==== 🔹 Nou: wiring de visibilitat OS/pestanya ====

  // Preparem callbacks UNA sola vegada
  override _setup() {
    this._onHidden = () => {
      console.log("Carousel: pàgina oculta, aturant autoplay");
      this._stopAutoplay();
      this._clearResume();
    };

    this._onVisible = () => {
      console.log("Carousel: pàgina visible, reiniciant autoplay");
      // Només reprenem si el component té focus (com feies fins ara)
      if (this._isFocused) this._startAutoplay();
    };

    this._onVisChange = () => {
      if (document.visibilityState === "hidden") this._onHidden?.();
      else this._onVisible?.();
    };
  }

  // Afegim/quitem listeners quan el component és visible/invisible a escena
  override _active() {
    if (this._onVisChange && this._onHidden && this._onVisible) {
      document.addEventListener("visibilitychange", this._onVisChange);
      window.addEventListener("blur", this._onHidden);
      window.addEventListener("focus", this._onVisible);
    }
    // Sincronitza estat actual
    if (document.visibilityState === "hidden") this._onHidden?.();
    else if (this._isFocused) this._startAutoplay();
  }

  override _inactive() {
    if (this._onVisChange && this._onHidden && this._onVisible) {
      document.removeEventListener("visibilitychange", this._onVisChange);
      window.removeEventListener("blur", this._onHidden);
      window.removeEventListener("focus", this._onVisible);
    }
    this._stopAutoplay();
    this._clearResume();
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
      if (this._isFocused && document.visibilityState !== "hidden") {
        this._startAutoplay();
      }
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
