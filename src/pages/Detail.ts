import { Router } from "@lightningjs/sdk";
import { BasePage } from "./base/BasePage";
import { Theme } from "../core/theme";
import DataStore from "../services/DataStore";
import Header from "../molecules/Header";
import { Rail } from "../molecules/Rail";
import { Hero } from "../molecules/Hero";
import type { TileData } from "../atoms/Tile";
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

const HEADER_H = 200;
const HERO_H = 650;
const CONTENT_Y = HEADER_H;
const RAIL_H = 230;

export default class Detail extends BasePage {
  private _data: TileData | null = null;
  private _btnIndex = 0;
  private _btnOrder: Array<"PlayBtn" | "AddBtn" | "LikeBtn"> = [
    "PlayBtn",
    "AddBtn",
    "LikeBtn",
  ];
  private _fromRoute: SectionRoute | null = null;
  private _lastId: string | null = null;

  protected override get hasHeader() {
    return true;
  }
  protected override get enableHistory() {
    return false;
  }
  protected override get enableScrollSnap() {
    return true;
  }
  protected override get defaultHeights() {
    return { Header: HEADER_H, Hero: HERO_H, TopSearches: RAIL_H };
  }
  protected override get sections() {
    return ["Hero", "TopSearches"];
  }
  protected override get persistHeaderInHistory() {
    return false;
  }
  protected override get enableFocusRecovery(): boolean {
    return false;
  }

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

  override _onUrlParams(params: any) {
    this._fromRoute = sanitizeSection(params?.section);
    const newId = params?.id ? String(params.id) : extractIdFromHash();
    if (newId && newId !== this._lastId) {
      this._lastId = newId;
      (this as any)._restoredFromHistory = false;
    }

    applyHeaderSelected(this, this._fromRoute);

    this.data = resolveById<TileData>(
      newId,
      DataStore.data,
      (d: TileData) => d?.id,
    );

    const active = Router.getActiveHash?.();
    const state = Router.getHistoryState?.(active);
    state ? this._refocus() : this.focusHeroBtn("PlayBtn");
  }

  set data(v: TileData | null) {
    this._data = v;
    patchDetailData(this, v);
  }

  override _active(): void {
    super._active();
    this.focusHeroBtn("PlayBtn");

    const inner = "Viewport.Content.ContentInner";
    this.tag(`${inner}.TopSearches`)?.patch({
      title: "Related",
      items: DataStore.data.rail4?.slice(0, 10) ?? [],
    });
    this.tag(`${inner}.Hero`)?.patch({ data: this._data });
  }

  public focusHeroBtn(key: "PlayBtn" | "AddBtn" | "LikeBtn" = "PlayBtn") {
    const idx = this._btnOrder.indexOf(key);
    if (idx < 0) return;
    this._btnIndex = idx;
    (this as any)._section = 0;
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
    const section = (this as any)._section ?? 0;
    if (this.hasHeader && section === -1)
      return this.tag("Viewport.Content.ContentInner.Header");
    if (section === 0) return this.tag("Viewport.Content.ContentInner.Hero");
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
    const section = (this as any)._section ?? 0;
    if (section === -1) {
      (this as any)._section = 0;
      scrollToSection(this, 0);
      this._refocus();
      return true;
    }
    (this as any)["focusNext"]?.();
    return true;
  }

  override _handleUp() {
    const section = (this as any)._section ?? 0;
    if (section === 0) {
      (this as any)._section = -1;
      scrollToSection(this, -1);
      this._refocus();
      return true;
    }
    (this as any)["focusPrev"]?.();
    return true;
  }

  public override focusNext() {
    const cur = (this as any)._section ?? 0;
    const max = 1;
    (this as any)._section = Math.min(max, cur + 1);
    scrollToSection(this, (this as any)._section);
    this._syncHistorySnapshot();
    this._refocus();
  }

  public override focusPrev() {
    const cur = (this as any)._section ?? 0;
    (this as any)._section = Math.max(-1, cur - 1);
    scrollToSection(this, (this as any)._section);
    this._syncHistorySnapshot();
    this._refocus();
  }

  override _handleEnter() {
    const key = this._btnOrder[this._btnIndex];
    if (key === "PlayBtn") {
      this._syncHistorySnapshot();
      (this as any).navigate(
        "player",
        { id: this._data?.id, section: this._fromRoute ?? "home" },
        true,
      );
    }
    return true;
  }
}
