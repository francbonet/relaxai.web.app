import { Lightning as L } from "@lightningjs/sdk";
import { Carousel } from "@lightningjs/ui";
import { CarouselItem } from "../atoms/CarouselItem";

export class CarouselComp extends L.Component {
  private _timer?: ReturnType<typeof setInterval>;
  private _resumeTmr?: ReturnType<typeof setTimeout>;
  private _interval = 6_000;
  private _isFocused = false;
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
      data.map((d) => ({ type: CarouselItem, w: 1920, h: 600, item: d })),
    );
    rail.items.forEach((cmp: any, i: number) => {
      if (cmp) cmp.item = data[i];
    });
    const max = Math.max(0, (rail?.children?.length || 1) - 1);
    rail.index = Math.max(0, Math.min(Number(rail?.index ?? 0), max));
    if (this._isFocused && !this._timer) this._startAutoplay();
  }

  $onChildNavigate(path: string, params?: any) {
    this.signal("navigate", path, params);
  }

  override _focus() {
    this._isFocused = true;
    this._clearResume();
    this._startAutoplay();
  }
  override _unfocus() {
    this._isFocused = false;
    this._stopAutoplay();
    this._clearResume();
  }

  override _captureLeft() {
    this._pauseAndScheduleResume();
    return false;
  }
  override _captureRight() {
    this._pauseAndScheduleResume();
    return false;
  }
  _handlePageDown() {
    (this.tag("Rail") as any).index += 4;
    this._pauseAndScheduleResume();
  }
  _handlePageUp() {
    (this.tag("Rail") as any).index -= 4;
    this._pauseAndScheduleResume();
  }

  override _setup() {
    this._onHidden = () => {
      this._stopAutoplay();
      this._clearResume();
    };
    this._onVisible = () => {
      if (this._isFocused) this._startAutoplay();
    };
    this._onVisChange = () => {
      document.visibilityState === "hidden"
        ? this._onHidden?.()
        : this._onVisible?.();
    };
  }

  override _active() {
    if (this._onVisChange && this._onHidden && this._onVisible) {
      document.addEventListener("visibilitychange", this._onVisChange);
      window.addEventListener("blur", this._onHidden);
      window.addEventListener("focus", this._onVisible);
    }
    document.visibilityState === "hidden"
      ? this._onHidden?.()
      : this._isFocused && this._startAutoplay();
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

  private _startAutoplay() {
    this._stopAutoplay();
    const rail = this.tag("Rail") as any;
    this._timer = setInterval(() => {
      try {
        rail._handleRight?.();
      } catch {
        /* empty */
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
      if (this._isFocused && document.visibilityState !== "hidden")
        this._startAutoplay();
    }, this._interval);
  }

  private _clearResume() {
    if (this._resumeTmr) {
      clearTimeout(this._resumeTmr);
      this._resumeTmr = undefined;
    }
  }

  override _getFocused() {
    return this.tag("Rail");
  }

  override _detach() {
    this._stopAutoplay();
    this._clearResume();
  }
}
