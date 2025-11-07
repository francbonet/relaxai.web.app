import { BasePage } from "./base/BasePage";
import Header from "../molecules/Header";
import { CarouselComp } from "../molecules/Carousel";
import { Rail } from "../molecules/Rail";
import { getActiveRouteName } from "../utils/routerUtils";
import DataStore from "../services/DataStore";

const HEADER_H = 200;
const CAROUSSEL_H = 600;
const RAIL_H = 230;
const GAP2 = 30;
const GAP = 60;

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
        type: CarouselComp,
        x: 40,
        y: HEADER_H + GAP2,
        h: CAROUSSEL_H,
        signals: { focusPrev: true, focusNext: true, navigate: true },
      },

      TopSearches: {
        type: Rail,
        y: HEADER_H + GAP2 + CAROUSSEL_H + GAP2,
        h: RAIL_H,
        signals: { focusPrev: true, focusNext: true, navigate: true },
      },

      NextWatch: {
        type: Rail,
        y: HEADER_H + GAP2 + CAROUSSEL_H + GAP2 + RAIL_H + GAP,
        h: RAIL_H,
        signals: { focusPrev: true, focusNext: true, navigate: true },
      },

      Retro: {
        type: Rail,
        y: HEADER_H + GAP2 + CAROUSSEL_H + GAP2 + RAIL_H + GAP + RAIL_H + GAP,
        h: RAIL_H,
        signals: { focusPrev: true, focusNext: true, navigate: true },
      },
    });
  }

  override _focus() {
    const name = getActiveRouteName();
    this.tag("Viewport.Content.ContentInner.Header")?.setCurrentByRoute?.(name);
  }

  override async _active() {
    super._active();

    const inner = "Viewport.Content.ContentInner";

    const dataCarousel = DataStore.data.rail1?.slice(0, 15) ?? [];
    (this.tag(`${inner}.Carussel`) as CarouselComp).items = dataCarousel;

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
