import { BasePage } from "./base/BasePage";
import { Theme } from "../core/theme";
import Header from "../molecules/Header";
import { getActiveRouteName } from "../utils/routerUtils";
import DataStore from "../services/DataStore";
import { CarouselComp } from "../molecules/Carousel";
import { Rail } from "../molecules/Rail";

const GAP2 = 30;
const GAP = 60;
const HEADER_H = 200;
const CAROUSSEL_H = 600;
const RAIL_H = 230;

export default class SuggestSection extends BasePage {
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
        x: 40,
        type: CarouselComp,
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

  override _init() {}

  override async _active() {
    super._active();
    const dataCarousel = DataStore.data.rail1?.slice(0, 15)!;
    (this.tag("Viewport.Content.ContentInner.Carussel") as CarouselComp).items =
      dataCarousel;

    const inner = "Viewport.Content.ContentInner";
    this.tag(`${inner}.TopSearches`)?.patch({
      title: "Top searches",
      items: DataStore.data.rail2?.slice(0, 15),
    });
    this.tag(`${inner}.NextWatch`)?.patch({
      title: "Your next watch",
      items: DataStore.data.rail4?.slice(0, 15),
    });
    this.tag(`${inner}.Retro`)?.patch({
      title: "Retro TV",
      items: DataStore.data.rail5?.slice(0, 15),
    });
    this.computeAfterLayout();
  }
}
