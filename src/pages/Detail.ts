// src/pages/Detail.ts
import { Router } from "@lightningjs/sdk";
import Header from "../molecules/Header";
import { BasePage } from "./base/BasePage";
import { Theme } from "../core/theme";
import type { TileData } from "../atoms/Tile";
import { Rail } from "../molecules/Rail";

// Helpers (sense dependència de `data`)
import {
  scrollToSection,
  applyHeaderSelected,
  patchDetailData,
} from "../utils/detailHelpers";
import {
  SectionRoute,
  sanitizeSection,
  extractIdFromHash,
  resolveById,
} from "../utils/routerUtils";
import { Hero } from "../molecules/Hero";
import DataStore from "../services/DataStore";

const HEADER_H = 200;
const HERO_H = 650;
const CONTENT_Y = HEADER_H;
const RAIL_H = 230;

export default class Detail extends BasePage {
  private _data: TileData | null = null;

  // índex horitzontal de botons dins de Hero
  private _btnIndex = 0;
  private _btnOrder: Array<"PlayBtn" | "AddBtn" | "LikeBtn"> = [
    "PlayBtn",
    "AddBtn",
    "LikeBtn",
  ];

  // secció d’origen (ve de params.section)
  private _fromRoute: SectionRoute | null = null;

  // id anterior per detectar re-entrades amb altre ítem
  private _lastId: string | null = null;

  // ===== Config pàgina (BasePage) =====
  protected override get hasHeader() {
    return true;
  }

  protected override get enableHistory() {
    return false;
  }

  protected override get enableScrollSnap() {
    return true;
  } // Header <-> Hero
  protected override get defaultHeights() {
    // Nota: TopSearches només per info (scroll-snap)
    return { Header: HEADER_H, Hero: HERO_H, TopSearches: RAIL_H };
  }
  protected override get sections() {
    // -1 (Header) és virtual; 0 = Hero; 1 = TopSearches
    return ["Hero", "TopSearches"];
  }
  /** No volem persistir el Header a l’històric. */
  protected override get persistHeaderInHistory() {
    return false;
  }

  protected override get enableFocusRecovery(): boolean {
    // ✅ Desactivem la recuperació de focus des de l’historial
    return false;
  }

  // ===== Template =====
  static override _template() {
    return BasePage.chrome({
      Header: {
        type: Header,
        h: HEADER_H,
        signals: { navigate: true, focusNext: true },
      },

      Hero: {
        type: Hero,
        y: CONTENT_Y,
        w: Theme.w,
        h: HERO_H,
        signals: { navigate: "_handleEnter", focusPrev: true, focusNext: true },
      },

      TopSearches: {
        y: CONTENT_Y + HERO_H + 40,
        h: RAIL_H,
        type: Rail,
        signals: { focusPrev: true, focusNext: true, navigate: true },
      },
    });
  }

  // ===== Hidratació per Router (params: { section, id }) =====
  override _onUrlParams(params: any) {
    this._fromRoute = sanitizeSection(params?.section);

    const newId = params?.id ? String(params.id) : extractIdFromHash();

    if (newId && newId !== this._lastId) {
      this._lastId = newId;
      // Evitem qualsevol intent de “restore” intern
      (this as any)._restoredFromHistory = false;
    }

    applyHeaderSelected(this, this._fromRoute);
    // this.computeAfterLayout();

    // Hidratació sense que els helpers coneguin `data`
    this.data = resolveById<TileData>(
      newId,
      DataStore.data,
      (d) => (d as any).id
    );

    // ✅ SIEMPRE forcem Hero → PlayBtn
    console.log("[FORCE FOCUS] Detail -> Hero PlayBtn");
    this.focusHeroBtn("PlayBtn");
  }

  // ===== HistoryState: inclou/recupera fromRoute i respecta POP =====
  override historyState(params?: any) {
    if (params) {
      // POP: restaura fromRoute i deixa BasePage restaurar scroll/section/focus
      this._fromRoute = sanitizeSection(params.fromRoute) ?? this._fromRoute;
      applyHeaderSelected(this, this._fromRoute);
      return super.historyState(params);
    }
    const snap = super.historyState() as any;
    if (snap) snap.fromRoute = this._fromRoute || undefined;
    return snap;
  }

  // ===== Data setter =====
  set data(v: TileData | null) {
    this._data = v;
    patchDetailData(this, v);
  }

  override _active(): void {
    super._active();

    // ♻️ Refuerç per si el layout/rehidratació altera el focus
    this.focusHeroBtn("PlayBtn");

    const inner = "Viewport.Content.ContentInner";
    this.tag(`${inner}.TopSearches`)?.patch({
      title: "Related",
      items: DataStore.data.rail4?.slice(0, 10),
    });
  }

  /** Força el focus a un botó de l'Hero i situa la secció a Hero. */
  public focusHeroBtn(key: "PlayBtn" | "AddBtn" | "LikeBtn" = "PlayBtn") {
    const idx = this._btnOrder.indexOf(key);
    if (idx < 0) return;
    this._btnIndex = idx;
    (this as any)._section = 0; // Hero
    scrollToSection(this, 0);
    this._refocus();
  }

  getFocusIndex() {
    return this._btnIndex;
  }

  setFocusIndex(i: number) {
    this._btnIndex = Math.max(0, Math.min(i, this._btnOrder.length - 1));
  }

  override _getFocused() {
    if (this.hasHeader && (this as any)._section === -1) {
      return this.tag("Viewport.Content.ContentInner.Header");
    }
    if ((this as any)._section === 0) {
      return this.tag("Viewport.Content.ContentInner.Hero");
    }
    // secció 1: TopSearches
    return this.tag("Viewport.Content.ContentInner.TopSearches");
  }

  override _handleRight() {
    this.setFocusIndex(this._btnIndex + 1);
    this._refocus();
    return true;
  }

  override _handleLeft() {
    this.setFocusIndex(this._btnIndex - 1);
    this._refocus();
    return true;
  }

  override _handleDown() {
    // Si som al Header (-1), baixa al Hero (0) directament
    if ((this as any)._section === -1) {
      (this as any)._section = 0;
      scrollToSection(this, 0);
      this._refocus();
      return true;
    }
    (this as any)["focusNext"]?.();
    return true;
  }

  override _handleUp() {
    // Si estàs al Hero (0), puja al Header (-1)
    if ((this as any)._section === 0) {
      (this as any)._section = -1;
      scrollToSection(this, -1);
      this._refocus();
      return true;
    }
    (this as any)["focusPrev"]?.();
    return true;
  }

  public override focusNext() {
    const max = 1; // Hero(0), TopSearches(1)
    (this as any)._section = Math.min(max, ((this as any)._section ?? 0) + 1);
    scrollToSection(this, (this as any)._section);
    this._syncHistorySnapshot();
    this._refocus();
  }

  public override focusPrev() {
    const cur = (this as any)._section ?? 0;
    (this as any)._section = Math.max(-1, cur - 1); // permet -1 (Header)
    scrollToSection(this, (this as any)._section);
    this._syncHistorySnapshot();
    this._refocus();
  }

  // ===== Acció Enter =====
  override _handleEnter() {
    const key = this._btnOrder[this._btnIndex];
    if (key === "PlayBtn") {
      // si vols propagar la secció fins al player per coherència visual
      this._syncHistorySnapshot();
      (this as any).navigate(
        "player",
        {
          id: this._data?.id,
          section: this._fromRoute || "home",
        },
        true
      );
    }
    return true;
  }
}
