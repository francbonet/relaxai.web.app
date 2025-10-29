import { BasePage } from "./base/BasePage";
import Header from "../molecules/Header";
import { Rail } from "../molecules/Rail";
import { Carousell } from "../molecules/Carousell";
import { data } from "../data/data";
import { getActiveRouteName } from "../utils/routerUtils";

const GAP2 = 30;
const GAP = 60;
const HEADER_H = 200;
const CAROUSSEL_H = 600;
const RAIL_H = 230;

export default class HomeSection extends BasePage {
  protected override get hasHeader() {
    return true;
  }
  protected override get sections() {
    return ["Carussel", "TopSearches", "NextWatch", "Retro"];
  }
  protected override get defaultHeights() {
    return {
      Header: HEADER_H,
      Carussel: CAROUSSEL_H,
      TopSearches: RAIL_H,
      NextWatch: RAIL_H,
      Retro: RAIL_H,
    };
  }

  static override _template() {
    return BasePage.chrome({
      Header: {
        type: Header,
        h: HEADER_H,
        signals: { navigate: true, focusNext: true },
      },

      Carussel: {
        y: HEADER_H + GAP2,
        h: CAROUSSEL_H,
        type: Carousell,
        signals: { focusPrev: true, focusNext: true, navigate: true },
      },

      TopSearches: {
        y: HEADER_H + GAP2 + CAROUSSEL_H + GAP2,
        h: RAIL_H,
        type: Rail,
        signals: { focusPrev: true, focusNext: true, navigate: true },
      },

      NextWatch: {
        y: HEADER_H + GAP2 + CAROUSSEL_H + GAP2 + RAIL_H + GAP,
        h: RAIL_H,
        type: Rail,
        signals: { focusPrev: true, focusNext: true, navigate: true },
      },

      Retro: {
        y: HEADER_H + GAP2 + CAROUSSEL_H + GAP2 + RAIL_H + GAP + RAIL_H + GAP,
        h: RAIL_H,
        type: Rail,
        signals: { focusPrev: true, focusNext: true, navigate: true },
      },
    });
  }

  override _focus() {
    const name = getActiveRouteName();
    this.tag("Viewport.Content.ContentInner.Header")?.setCurrentByRoute?.(name);
  }

  // protected get persistHeaderInHistory() { return true } // permetre persistir Header en aquella pàgina

  override _setup() {
    const inner = "Viewport.Content.ContentInner";
    this.tag(`${inner}.TopSearches`)?.patch({
      title: "Top searches",
      items: data.rail1.slice(0, 20),
    });
    this.tag(`${inner}.NextWatch`)?.patch({
      title: "Your next watch",
      items: data.rail2.slice(0, 20),
    });
    this.tag(`${inner}.Retro`)?.patch({
      title: "Retro TV",
      items: data.rail3.slice(0, 20),
    });
    this.computeAfterLayout();
  }
}
