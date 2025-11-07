import { Lightning as L, Router } from "@lightningjs/sdk";
import DataStore from "../services/DataStore";
import { Theme } from "../core/theme";

const W = 1920;
const H = 1080;

export default class Boot extends L.Component {
  private _spinTimer?: ReturnType<typeof setInterval>;

  static override _template(): L.Component.Template {
    return {
      w: W,
      h: H,
      rect: true,
      color: Theme.colors.bg,
      Wrapper: {
        mount: 0.5,
        x: W / 2,
        y: H / 2,
        Spinner: { w: 100, h: 100, mount: 0.5, x: 0, y: -20 },
        Label: {
          mount: 0.5,
          x: 0,
          y: 90,
          text: {
            text: "Loading…",
            fontSize: 38,
            textColor: Theme.colors.textDim,
            fontFace: "RelaxAI-SoraMedium",
          },
        },
      },
    };
  }

  override _init(): void {
    this._buildSpinner();
    this._startSpinner();
    this._loadData();
  }

  override _inactive(): void {
    this._stopSpinner();
  }

  override _detach(): void {
    this._stopSpinner();
  }

  private _startSpinner(): void {
    const spinner = this.tag("Spinner") as L.Component;
    let angle = 0;
    this._spinTimer = setInterval(() => {
      angle = (angle + 6) % 360;
      spinner.rotation = (angle * Math.PI) / 180;
    }, 16);
  }

  private _stopSpinner(): void {
    if (this._spinTimer) {
      clearInterval(this._spinTimer);
      this._spinTimer = undefined;
    }
  }

  private _buildSpinner(): void {
    const spinner = this.tag("Spinner") as L.Component;
    const TICKS = 12;
    const R = 40;
    const BAR_W = 8;
    const BAR_H = 20;
    const cx = (spinner.w as number) / 2;
    const cy = (spinner.h as number) / 2;

    //@ts-ignore
    const ticks: L.Component.Children[] = [];
    for (let i = 0; i < TICKS; i++) {
      const ang = (i / TICKS) * Math.PI * 2;
      ticks.push({
        type: L.Component,
        x: cx,
        y: cy,
        rotation: ang,
        Bar: {
          mountX: 0.5,
          mountY: 1,
          x: 0,
          y: -R,
          w: BAR_W,
          h: BAR_H,
          rect: true,
          color: Theme.colors.accent,
          alpha: 0.25 + (i / TICKS) * 0.75,
        },
      });
    }
    spinner.children = ticks;
  }

  private async _loadData(): Promise<void> {
    try {
      await DataStore.init("local");
      await new Promise((r) => setTimeout(r, 2000));
      Router.resume();
    } catch (e) {
      console.error("[Boot] Error cargando datos:", e);
      this.tag("Label").text = { text: "Error cargando datos" };
    }
  }
}
