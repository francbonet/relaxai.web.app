import { BasePage } from "./base/BasePage";
import Header from "../molecules/Header";
import { getActiveRouteName } from "../utils/routerUtils";
import Grid from "../molecules/Grid";
import { watchlistStore } from "../state/watchlist.store";
import Lightning from "@lightningjs/core";
import { HtmlParagraphImage } from "@francbonet/lightningjs-html-paragraph-image";

const HEADER_H = 200;

export default class WatchListSection extends BasePage {
  protected override get hasHeader() {
    return true;
  }

  protected override get sections() {
    const items = watchlistStore.current;
    const sections: string[] = [];
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
      EmptyMessage: {
        x: 40,
        y: HEADER_H + 40,
        w: 1840,
        type: HtmlParagraphImage,
        visible: false,
      },
    });
  }

  override _focus() {
    const name = getActiveRouteName();
    this.tag("Viewport.Content.ContentInner.Header")?.setCurrentByRoute?.(name);
  }

  public override focusNext() {
    if (watchlistStore.current.length === 0) {
      // Si no hi ha items, no té sentit baixar cap al grid
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
    const grid = this.tag(`${inner}.WatchList`) as any;
    const emptyMsg = this.tag(`${inner}.EmptyMessage`) as any;

    if (items.length === 0) {
      // Amaguem grid i mostrem missatge buit
      grid?.patch({ title: "", items: [], visible: false });

      if (emptyMsg) {
        emptyMsg.visible = true;

        await emptyMsg.setContent?.({
          html: `
            <div style="
              width: 1920px;
              padding:48px;
              background:linear-gradient(145deg, #001219, #005f73);
              border-radius:24px;
              box-sizing:border-box;
            ">

              <p style="
                font-family:'RelaxAI-SoraBold';
                font-size:48px;
                margin-bottom:32px;
                color:white;
              ">
                Your watchlist is empty 😢
              </p>

              <ul style="list-style:none; padding:0; margin:0;">

                <li style="
                  display:flex;
                  align-items:flex-start;
                  margin-bottom:20px;
                  font-family:'RelaxAI-SoraRegular';
                  font-size:30px;
                  color:#e5e5e5;
                ">
                  <span style="
                    display:inline-block;
                    margin-right:16px;
                    color:#00d4ff;
                    font-size:36px;
                  ">✔</span>
                  Add series and films you want to watch
                </li>

                <li style="display:flex; align-items:flex-start; margin-bottom:20px; font-family:'RelaxAI-SoraRegular'; font-size:30px; color:#e5e5e5;">
                  <span style="display:inline-block; margin-right:16px; color:#00d4ff; font-size:36px;">✔</span>
                  They will appear here to continue later
                </li>

                <li style="display:flex; align-items:flex-start; margin-bottom:20px; font-family:'RelaxAI-SoraRegular'; font-size:30px; color:#e5e5e5;">
                  <span style="display:inline-block; margin-right:16px; color:#00d4ff; font-size:36px;">✔</span>
                  Keep track of your favorites easily
                </li>

                <li style="display:flex; align-items:flex-start; margin-bottom:20px; font-family:'RelaxAI-SoraRegular'; font-size:30px; color:#e5e5e5;">
                  <span style="display:inline-block; margin-right:16px; color:#00d4ff; font-size:36px;">✔</span>
                  Start building your personalized list today
                </li>

                <li style="display:flex; align-items:flex-start; margin-bottom:20px; font-family:'RelaxAI-SoraRegular'; font-size:30px; color:#e5e5e5;">
                  <span style="display:inline-block; margin-right:16px; color:#00d4ff; font-size:36px;">✔</span>
                  Your next watch is just one click away
                </li>

              </ul>
            </div>
          `,
          width: 1920,
          fontFamily: "RelaxAI-SoraMedium",
          style: {
            fontSize: "40px",
            lineHeight: "1.6",
            letterSpacing: "0.02em",
            color: "#FFFFFF",
            textAlign: "left",
          },
        });
      }
    } else {
      const title = "Your watchlist";
      grid?.patch({ title, items, visible: true });
      if (emptyMsg) emptyMsg.visible = false;
    }

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

    if (row < 6) {
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
