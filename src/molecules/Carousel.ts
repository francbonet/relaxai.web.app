// src/molecules/MyCarousel.ts
import { Lightning as L } from "@lightningjs/sdk";
import { Carousel } from "@lightningjs/ui";
import { CarouselItem } from "../atoms/CarouselItem";

export class CarouselComp extends L.Component {
  static override _template() {
    return {
      Rail: {
        type: Carousel,
        direction: "row",
        spacing: 24, // separació entre items
        scroll: 0.5, // àncora de scroll al centre
        autoResize: false, // manté mida constant
      } as any,
    };
  }

  set items(data: Array<{ title: string; src?: string }>) {
    // afegim instàncies del nostre Item
    this.tag("Rail").reload(
      data.map((d) => ({
        type: CarouselItem,
        w: 1920,
        h: 600,
        item: d,
      }))
    );
    // assignem el payload a cada wrapper actiu (quan es carregui)
    this.tag("Rail").items.forEach((cmp: any, i: number) => {
      if (cmp) cmp.item = data[i];
    });
  }

  // Bubble cap amunt perquè Home el rebi
  $onChildNavigate(path: string, params?: any) {
    console.log("[CarouselItem] _handleEnter:", { path, params });
    this.signal("navigate", path, params);
  }

  // delega focus al Carousel intern
  override _getFocused() {
    return this.tag("Rail");
  }

  // tecles extra (si vols saltar per pàgines)
  _handlePageDown() {
    this.tag("Rail").index += 4;
  }
  _handlePageUp() {
    this.tag("Rail").index -= 4;
  }
}
