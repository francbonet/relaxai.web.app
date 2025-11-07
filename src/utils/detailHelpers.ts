import { Lightning as L, Img, Utils } from "@lightningjs/sdk";
import Header from "../molecules/Header";
import { Theme } from "../core/theme";
import type { TileData } from "../atoms/Tile";

const HERO_H = 650;

export function scrollToSection(ctx: L.Component, section: number) {
  const vp = ctx.tag("Viewport.Content") as L.Component;
  if (section === -1) {
    vp?.setSmooth?.("y", 0);
  } else {
    (ctx as any)["_applyScrollForSection"]?.(section as any);
  }
}

export function forceFocusPlayBtn(ctx: any) {
  ctx._btnIndex = 0;
  ctx._section = 0;
  scrollToSection(ctx, 0);
  ctx._refocus();
}

export function applyHeaderSelected(ctx: any, fromRoute: string | null) {
  if (!fromRoute) return;
  const header = ctx.tag(
    "Viewport.Content.ContentInner.Header",
  ) as unknown as Header;
  header?.setCurrentByRoute?.(fromRoute);
}

export function patchDetailData(ctx: any, v: TileData | null) {
  if (!v) return;
  const src = (v as any).posterSrc || v.imageSrc;
  if (src) {
    ctx.tag("Hero.Poster").patch({
      texture: Img(Utils.asset(src)).cover(Theme.w, HERO_H),
    });
  }
  ctx.tag("Hero.Info.Title").patch({ text: { text: v.title ?? "" } });

  const genres = Array.isArray((v as any).genres)
    ? (v as any).genres.join(", ")
    : (v as any).genres || "";

  const parts = [
    v.year ? `${v.year}` : null,
    v.duration ? `${v.duration} min` : null,
    v.author ? `${v.author}` : null,
    genres ? `${genres}` : null,
  ].filter(Boolean);

  const textParts = parts.join("  •  ");
  ctx.tag("Hero.Info.Meta").patch({ text: { text: textParts } });
  ctx.tag("Hero.Info.DescBox").patch({ text: { text: v.description ?? "" } });
}
