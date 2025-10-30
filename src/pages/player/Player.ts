import {
  Lightning,
  Router,
  Settings,
  Utils,
  VideoPlayer,
} from "@lightningjs/sdk";
import { TileData } from "../../atoms/Tile";
import { extractIdFromHash, resolveById } from "../../utils/routerUtils";
import ControlButton from "../../atoms/ControlButton";
import DataStore from "../../services/DataStore";

type Ms = number;
type FocusKey = "BackBtn" | "PlayPause" | "Back30" | "Fwd30" | "Progress";
const FOCUS_ORDER: FocusKey[] = [
  "BackBtn",
  "PlayPause",
  "Back30",
  "Fwd30",
  "Progress",
];
const SKIP_SECONDS = 30;

export class Player extends Lightning.Component {
  private _data: TileData | null = null;
  private _hideTimer?: number;
  private _tickTimer?: number;
  private _isTexture = false;

  // focus intern
  private _controlsVisible = false;
  private _focusIndex = 1; // Play/Pause por defecto

  // Scrub mode
  private _scrubbing = false;
  private _scrubPct = 0; // 0..1
  private _wasPlayingBeforeScrub = false;

  static override _template() {
    const SIDE_PAD = 60;
    const BTN_W = 80;
    const BTN_H = 80;
    const BTN_GAP = 30;

    return {
      Poster: {
        w: 1920,
        h: 1080,
        src: Utils.asset("images/background.png"),
        visible: true,
      },

      Controls: {
        alpha: 0,
        OverlayBg: {
          rect: true,
          w: 1920,
          h: 1080,
          alpha: 0.45,
          color: 0xff000000,
        },

        // ── Header (Back + Título + Metadata)
        BackBtn: {
          type: ControlButton,
          x: SIDE_PAD,
          y: 50,
          w: 140,
          h: BTN_H,
          label: "Back",
        },

        Title: {
          x: SIDE_PAD,
          y: 150,
          text: { text: "", fontSize: 56, wordWrap: true, wordWrapWidth: 1800 },
        },

        Metadata: {
          x: SIDE_PAD,
          y: 230,
          text: { text: "", fontSize: 28, textColor: 0xffd0d0d0 },
        },

        // ── Controles inferiores
        PlayPause: {
          type: ControlButton,
          x: SIDE_PAD,
          y: 920,
          w: BTN_W,
          h: BTN_H,
          label: "Play",
        },

        Back30: {
          type: ControlButton,
          x: SIDE_PAD + BTN_W + BTN_GAP,
          y: 920,
          w: BTN_W,
          h: BTN_H,
          label: "-30s",
        },

        Fwd30: {
          type: ControlButton,
          x: SIDE_PAD + (BTN_W + BTN_GAP) * 2,
          y: 920,
          w: BTN_W,
          h: BTN_H,
          label: "+30s",
        },

        // ── Barra de progreso (debajo de los botones)
        Progress: {
          x: SIDE_PAD + 350,
          y: 950,
          Track: {
            rect: true,
            w: 1520 - SIDE_PAD * 2,
            h: 8,
            color: 0x44ffffff,
          },
          Fill: { rect: true, w: 0, h: 8, color: 0xffffffff },
          Times: { x: 0, y: 14, text: { text: "00:00 / 00:00", fontSize: 28 } },
          Glow: {
            rect: true,
            x: -6,
            y: -6,
            w: (w: number) => w - 0 + 12,
            h: 20 + 12,
            alpha: 0,
            color: 0x22ffffff,
          },
          Thumb: {
            rect: true,
            w: 6,
            h: 18,
            y: -5,
            x: 0,
            color: 0xffffffff,
            alpha: 0,
          },
        },
      },
    };
  }

  override _onUrlParams(params: any) {
    const itemId = params?.id ? String(params.id) : extractIdFromHash();
    this.data = resolveById<TileData>(
      itemId,
      DataStore.data,
      (d) => (d as any).id
    );
  }

  set data(v: TileData | null) {
    this._data = v;
  }

  // getters
  get Poster() {
    return this.tag("Poster");
  }
  get Controls() {
    return this.tag("Controls");
  }
  get BackBtn() {
    return this.tag("Controls.BackBtn");
  }
  get PlayPause() {
    return this.tag("Controls.PlayPause");
  }
  get Back30() {
    return this.tag("Controls.Back30");
  }
  get Fwd30() {
    return this.tag("Controls.Fwd30");
  }
  get Progress() {
    return this.tag("Controls.Progress");
  }
  get ProgressTrack() {
    return this.tag("Controls.Progress.Track");
  }
  get ProgressFill() {
    return this.tag("Controls.Progress.Fill");
  }
  get ProgressTimes() {
    return this.tag("Controls.Progress.Times") as Lightning.Element;
  }
  get ProgressGlow() {
    return this.tag("Controls.Progress.Glow");
  }
  get ProgressThumb() {
    return this.tag("Controls.Progress.Thumb");
  }

  override _init() {
    this._isTexture = !!Settings.get("platform", "textureMode", false);
    VideoPlayer.consumer(this);
    if (!this._isTexture) {
      VideoPlayer.position(0, 0);
      VideoPlayer.size(1920, 1080);
      VideoPlayer.show();
    }
  }

  override _active() {
    // Control Buttons
    (this.PlayPause as any).setVariant("play");
    (this.Back30 as any).setVariant("rew");
    (this.Fwd30 as any).setVariant("fwd");
    (this.BackBtn as any).setVariant("back");

    // Título + metadata
    const title = this._data?.title || "Now Playing";
    this.tag("Controls.Title").text = { text: title };

    const md = this._buildMetadata(this._data);
    this.tag("Controls.Metadata").text = { text: md };

    // Abre y reproduce
    this.play(
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    );
  }

  // focus de página
  override _getFocused() {
    const key = FOCUS_ORDER[this._focusIndex];
    if (key === "BackBtn") return this.BackBtn;
    if (key === "PlayPause") return this.PlayPause;
    if (key === "Back30") return this.Back30;
    if (key === "Fwd30") return this.Fwd30;
    // Progress no es Button; lo gestiona este Player
    return this;
  }
  override _focus() {
    this._applyPageFocus();
  }
  override _unfocus() {
    this._applyPageFocus();
  }

  private _applyPageFocus() {
    this._applyItemFocus();
  }

  // ── Reproductor ──────────────────────────────────────────────────────────
  play(url: string) {
    setTimeout(() => {
      VideoPlayer.open(url);
      VideoPlayer.play();
      setTimeout(() => {
        if (!(VideoPlayer as any).playing) VideoPlayer.play();
      }, 1000);
    }, 0);

    this._startTick();
    this._showControls(true);
  }

  pause() {
    VideoPlayer.pause();
  }

  private _exitPlayer() {
    console.log("[Player] Exiting player...");
    this._clearTimers();
    try {
      (VideoPlayer as any).stop?.();
    } catch {}
    try {
      VideoPlayer.close();
    } catch {}

    const history = Router.getHistory?.() || [];
    if (history.length > 1) {
      Router.back();
    } else {
      const current = (Router.getActiveRoute && Router.getActiveRoute()) || "";
      if (current !== "home") Router.navigate("home");
    }
    this.signal("onBackFromPlayer");
  }

  stop() {
    this._exitPlayer();
  }

  override _disable() {
    this._clearTimers();
    try {
      (VideoPlayer as any).stop?.();
    } catch {}
    try {
      VideoPlayer.close();
    } catch {}
  }

  // ── Events player ────────────────────────────────────────────────────────
  $videoPlayerPlaying() {
    (this.PlayPause as any).setVariant("pause");
    this.Poster.visible = false;
    this._autoHideSoon();
  }
  $videoPlayerPause() {
    (this.PlayPause as any).setVariant("play");
    this._showControls();
  }
  $videoPlayerWaiting() {
    this._showControls();
  }
  $videoPlayerStop() {
    (this.PlayPause as any).setVariant("play");
    this.Poster.visible = true;
    this._showControls();
  }
  $videoPlayerEnded() {
    this.Poster.visible = true;
    this._showControls();
    this._exitPlayer();
  }
  $videoPlayerError() {
    this.Poster.visible = true;
    this._showControls();
  }

  // ── Teclas ───────────────────────────────────────────────────────────────
  private _ensureControlsShown(): boolean {
    if (!this._controlsVisible) {
      this._showControls();
      return true;
    }
    return false;
  }

  override _handleEnter() {
    if (this._ensureControlsShown()) return true;
    const key = FOCUS_ORDER[this._focusIndex];

    if (key === "BackBtn") {
      this._exitPlayer();
      return true;
    }

    if (key === "PlayPause") {
      const playing = !!(VideoPlayer as any).playing;
      playing ? VideoPlayer.pause() : VideoPlayer.play();
      this._autoHideSoon();
      return true;
    }

    if (key === "Back30") {
      this._skip(-SKIP_SECONDS);
      this._autoHideSoon();
      return true;
    }
    if (key === "Fwd30") {
      this._skip(+SKIP_SECONDS);
      this._autoHideSoon();
      return true;
    }

    if (key === "Progress") {
      if (!this._scrubbing) this._enterScrubMode();
      else this._commitScrub();
      return true;
    }

    return false;
  }

  override _handleBack() {
    if (this._scrubbing) {
      this._cancelScrub();
      return true;
    }
    this._exitPlayer();
    return true;
  }

  override _handleLeft() {
    if (this._ensureControlsShown()) return true;

    if (this._scrubbing && FOCUS_ORDER[this._focusIndex] === "Progress") {
      this._nudgeScrub(-1);
      return true;
    }

    if (this._focusIndex > 0) {
      this._focusIndex--;
      this._applyItemFocus();
    }
    this._autoHideSoon();
    return true;
  }

  override _handleRight() {
    if (this._ensureControlsShown()) return true;

    if (this._scrubbing && FOCUS_ORDER[this._focusIndex] === "Progress") {
      this._nudgeScrub(+1);
      return true;
    }

    if (this._focusIndex < FOCUS_ORDER.length - 1) {
      this._focusIndex++;
      this._applyItemFocus();
    }
    this._autoHideSoon();
    return true;
  }

  override _handleUp() {
    if (this._ensureControlsShown()) {
      this._focusIndex = 0;
      this._applyItemFocus();
      return true;
    }
    if (!this._scrubbing) {
      this._focusIndex = 0;
      this._applyItemFocus();
      this._autoHideSoon();
    }
    return true;
  }

  override _handleDown() {
    if (this._ensureControlsShown()) {
      this._focusIndex = 1;
      this._applyItemFocus();
      return true;
    }
    if (this._scrubbing) {
      this._cancelScrub();
      return true;
    }
    if (this._focusIndex < FOCUS_ORDER.length - 1) this._focusIndex++;
    this._applyItemFocus();
    this._autoHideSoon();
    return true;
  }

  // ── Focus visual ─────────────────────────────────────────────────────────
  private _applyItemFocus() {
    this._styleProgress(false);
    const key = FOCUS_ORDER[this._focusIndex];
    if (key === "Progress") this._styleProgress(true);
  }

  private _styleProgress(on: boolean) {
    this.ProgressTrack.setSmooth("h", on ? 10 : 8, { duration: 0.12 });
    this.ProgressFill.setSmooth("h", on ? 10 : 8, { duration: 0.12 });
    this.ProgressTrack.color = on ? 0x66ffffff : 0x44ffffff;
    this.ProgressFill.color = on ? 0xffffffff : 0xccffffff;
    this.ProgressTimes.patch({
      text: { textColor: on ? 0xffffffff : 0xffd0d0d0 },
    });
    this.ProgressTimes.setSmooth("alpha", on ? 1 : 0.85, { duration: 0.12 });
    this.ProgressGlow.setSmooth("alpha", on ? 0.2 : 0, { duration: 0.12 });
    if (!this._scrubbing)
      this.ProgressThumb.setSmooth("alpha", 0, { duration: 0.12 });
  }

  // ── Skip +-30s ───────────────────────────────────────────────────────────
  private _skip(delta: number) {
    const dur = Math.max(0, this._vpGet<number>("duration", 0));
    const cur = Math.max(0, this._vpGet<number>("currentTime", 0));
    const target = Math.max(0, Math.min(dur, cur + delta));
    VideoPlayer.seek(target);
  }

  // ── Scrub mode ───────────────────────────────────────────────────────────
  private _enterScrubMode() {
    this._scrubbing = true;
    this._wasPlayingBeforeScrub = !!(VideoPlayer as any).playing;
    if (this._wasPlayingBeforeScrub) VideoPlayer.pause();

    const dur = Math.max(0, this._vpGet<number>("duration", 0));
    const cur = Math.max(0, this._vpGet<number>("currentTime", 0));
    this._scrubPct = dur > 0 ? cur / dur : 0;
    this._updateThumbFromPct();
    this.ProgressThumb.setSmooth("alpha", 1, { duration: 0.12 });
    this._clearAutohide();
  }

  private _commitScrub() {
    const dur = Math.max(0, this._vpGet<number>("duration", 0));
    const target = Math.max(0, Math.min(dur, Math.round(dur * this._scrubPct)));
    VideoPlayer.seek(target);
    if (this._wasPlayingBeforeScrub) VideoPlayer.play();
    this._scrubbing = false;
    this.ProgressThumb.setSmooth("alpha", 0, { duration: 0.12 });
    this._autoHideSoon();
    VideoPlayer.play();
  }

  private _cancelScrub() {
    this._scrubbing = false;
    this.ProgressThumb.setSmooth("alpha", 0, { duration: 0.12 });
    if (this._wasPlayingBeforeScrub) VideoPlayer.play();
    this._autoHideSoon();
  }

  private _nudgeScrub(dir: -1 | 1) {
    const stepPct = 0.02;
    this._scrubPct = Math.max(0, Math.min(1, this._scrubPct + dir * stepPct));
    this._updateThumbFromPct();

    const dur = Math.max(0, this._vpGet<number>("duration", 0)) || 0;
    const preview = Math.round(dur * this._scrubPct);
    const cur = Math.max(0, this._vpGet<number>("currentTime", 0));
    this.ProgressTimes.text = {
      text: `${this._fmt(cur)}  ⟶  ${this._fmt(preview)} / ${this._fmt(dur)}`,
    };
  }

  private _updateThumbFromPct() {
    const trackW = this.ProgressTrack.w as number;
    const x = Math.round(trackW * this._scrubPct);
    this.ProgressThumb.x = x - Math.floor((this.ProgressThumb.w as number) / 2);
  }

  // ── Autohide ─────────────────────────────────────────────────────────────
  private _showControls(init = false) {
    this._controlsVisible = true;
    this.Controls.setSmooth("alpha", 1, { duration: 0.2 });
    if (init) this._focusIndex = 1; // Play/Pause al arrancar
    this._applyItemFocus();
    this._refocus();
    this._autoHideSoon();
  }

  private _hideControls() {
    this._controlsVisible = false;
    this.Controls.setSmooth("alpha", 0, { duration: 0.2 });
    this._clearAutohide();
  }

  private _autoHideSoon(delay: Ms = 3000) {
    this._clearAutohide();
    if (!this._scrubbing) {
      this._hideTimer = setTimeout(
        () => this._hideControls(),
        delay
      ) as unknown as number;
    }
  }

  private _clearAutohide() {
    if (this._hideTimer) {
      clearTimeout(this._hideTimer);
      this._hideTimer = undefined;
    }
  }

  // ── Progress polling ─────────────────────────────────────────────────────
  private _startTick() {
    this._clearTick();
    this._tickTimer = setInterval(
      () => this._updateProgressUI(),
      250
    ) as unknown as number;
  }

  private _clearTick() {
    if (this._tickTimer) {
      clearInterval(this._tickTimer);
      this._tickTimer = undefined;
    }
  }

  private _clearTimers() {
    this._clearAutohide();
    this._clearTick();
  }

  // private _updateProgressUI() {
  //   const dur = Math.max(0, this._vpGet<number>("duration", 0));
  //   const cur = Math.max(0, this._vpGet<number>("currentTime", 0));
  //   const pct = dur > 0 ? cur / dur : 0;
  //   const trackW = this.ProgressTrack.w as number;

  //   if (!this._scrubbing) {
  //     this.ProgressFill.w = Math.max(
  //       0,
  //       Math.min(trackW, Math.round(trackW * pct))
  //     );
  //     this.ProgressTimes.text = {
  //       text: `${this._fmt(cur)} / ${this._fmt(dur)}`,
  //     };
  //     this.ProgressThumb.x =
  //       Math.round(trackW * pct) -
  //       Math.floor((this.ProgressThumb.w as number) / 2);
  //   } else {
  //     this.ProgressFill.w = Math.round(trackW * this._scrubPct);
  //   }

  //   const playing = !!(VideoPlayer as any).playing;
  //   (this.PlayPause as any).setVariant(playing ? "pause" : "play");
  // }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private _updateProgressUI() {
    // Helpers locales para blindar números
    const safeNum = (v: any, fb = 0) => {
      const n = Number(v);
      return Number.isFinite(n) && n >= 0 ? n : fb;
    };
    const fmtSafe = (v: any, placeholder = "00:00") =>
      Number.isFinite(Number(v)) && Number(v) >= 0 ? this._fmt(v) : placeholder;

    // Lecturas del player y ancho del track, todo saneado
    const dur = safeNum(this._vpGet<number>("duration", 0), 0);
    const cur = safeNum(this._vpGet<number>("currentTime", 0), 0);
    const trackW = safeNum((this.ProgressTrack as any)?.w, 0);
    const thumbW = safeNum((this.ProgressThumb as any)?.w, 6);

    // Evita division by zero y clamp del pct
    const pct = dur > 0 ? Math.min(1, Math.max(0, cur / dur)) : 0;

    if (!this._scrubbing) {
      const fillW = Math.round(trackW * pct);
      this.ProgressFill.w = Math.max(0, Math.min(trackW, fillW));

      this.ProgressTimes.text = {
        text: `${fmtSafe(cur)} / ${fmtSafe(dur)}`,
      };

      // Thumb centrado y dentro de [0, trackW]
      const thumbX = Math.round(trackW * pct) - Math.floor(thumbW / 2);
      this.ProgressThumb.x = Math.max(0, Math.min(trackW - thumbW, thumbX));
    } else {
      this.ProgressFill.w = Math.round(
        trackW * Math.min(1, Math.max(0, this._scrubPct))
      );
    }

    const playing = !!(VideoPlayer as any).playing;
    (this.PlayPause as any).setVariant(playing ? "pause" : "play");
  }

  private _fmt(sec: number) {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  private _vpGet<T = any>(key: keyof any, fallback: T): T {
    const v: any = (VideoPlayer as any)[key];
    if (typeof v === "function") return v.call(VideoPlayer) as T;
    if (v === undefined || v === null) return fallback;
    return v as T;
  }

  private _buildMetadata(d: TileData | null): string {
    if (!d) return "";
    // Inferimos campos comunes con fallback
    const year = (d as any).year ?? (d as any).releaseYear ?? "";
    const duration = d.duration;
    const author =
      (d as any).author ?? (d as any).director ?? (d as any).creator ?? "";
    const genre =
      (d as any).genre ??
      (Array.isArray((d as any).genres)
        ? (d as any).genres.join(", ")
        : (d as any).genres) ??
      "";

    const parts = [
      year ? `Año: ${year}` : null,
      duration ? `Duración: ${duration}` : null,
      author ? `Autor: ${author}` : null,
      genre ? `Género: ${genre}` : null,
    ].filter(Boolean);

    return parts.join("  •  ");
  }

  onParams(params?: Record<string, any>) {
    const title = params?.title ?? "Now Playing";
    this.tag("Controls.Title").text = { text: title };
  }
}
