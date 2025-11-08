import { BasePage } from "./base/BasePage";
import Header from "../molecules/Header";
import { getActiveRouteName } from "../utils/routerUtils";
import Grid from "../molecules/Grid";
import { watchlistStore } from "../state/watchlist.store";
import Lightning from "@lightningjs/core";

const HEADER_H = 200;

export default class WatchListSection extends BasePage {
  protected override get hasHeader() {
    return true;
  }

  protected override get sections() {
    const items = watchlistStore.current;
    const sections = [];
    if (items.length > 0) {
      sections.push("WatchList");
    }
    return sections;
  }

  protected override get enableScrollSnap() {
    return false;
  }

  protected override get defaultHeights() {
    return {
      Header: HEADER_H,
    };
  }

  static override _template() {
    return BasePage.chrome({
      Header: {
        type: Header,
        h: HEADER_H,
        signals: { navigate: true, focusNext: true },
      },
      WatchList: {
        y: HEADER_H + 40,
        type: Grid,
        title: "List",
        config: { cols: 5, rowsVisible: 1, gapX: 68, gapY: 0, tileH: 230 },
        signals: {
          focusPrev: true,
          focusNext: true,
          navigate: true,
          focusMoved: true,
        },
      },
    });
  }

  override _focus() {
    const name = getActiveRouteName();
    this.tag("Viewport.Content.ContentInner.Header")?.setCurrentByRoute?.(name);
  }

  public override focusNext() {
    if (watchlistStore.current.length === 0) {
      return;
    }
    const cur = (this as any)._section ?? 0;
    const max = 0;
    (this as any)._section = Math.min(max, cur + 1);
    this._syncHistorySnapshot();
    this._refocus();
  }

  override focusPrev() {
    console.log("[focusPrev]");
    const min = this.hasHeader ? -1 : 0;
    this._section = Math.max(this._section - 1, min);
    this._applyScrollForSection(this._section);
    this._syncHistorySnapshot();
    this._refocus();
  }

  override async _active() {
    super._active();
    const items = watchlistStore.current;
    const inner = "Viewport.Content.ContentInner";
    const grid = this.tag(`${inner}.WatchList`);
    const title =
      items.length === 0 ? "Your watchlist is empty 😢" : "Your watchlist";

    grid?.patch({ title: title, items });
    this.computeAfterLayout();
  }

  focusMoved(payload: {
    row: number;
    rowH: number;
    cols: number;
    itemsLen: number;
  }) {
    const content = this.tag("Viewport.Content") as Lightning.Component;
    const viewport = this.tag("Viewport") as any;
    const grid = this.tag("WatchList") as any;

    const HEADER_OFFSET = HEADER_H + 40;
    const EXTRA_BOTTOM = -100;

    const row = payload.row ?? 0;
    const tileH = payload.rowH ?? 230;
    const gapY = grid?.gapY ?? 10;
    const rowPitch = tileH + gapY;
    const totalRows = Math.ceil(payload.itemsLen / payload.cols);

    if (row < 2) {
      content.setSmooth("y", 0);
      return;
    }

    let anchorPx = row * rowPitch;
    const viewportH = viewport?.h ?? 1080;
    const maxScroll =
      totalRows * rowPitch - viewportH + HEADER_OFFSET + EXTRA_BOTTOM;
    if (anchorPx > maxScroll) anchorPx = maxScroll;
    const targetY = -(HEADER_OFFSET + anchorPx);

    const neededH = HEADER_OFFSET + totalRows * rowPitch + EXTRA_BOTTOM;
    if ((content as any).h < neededH) (content as any).h = neededH;

    console.log(
      "[focusMoved] row",
      row,
      "targetY",
      targetY,
      "totalRows",
      totalRows,
    );

    content.setSmooth("y", targetY);
  }
}
