import { Lightning as L, Img, Utils } from '@lightningjs/sdk'
import Header from '../molecules/Header'
import { Theme } from '../core/theme'
import type { TileData } from '../atoms/Tile'

const HERO_H = 650

/** Scroll a secció (-1 = Header) */
export function scrollToSection(ctx: L.Component, section: number) {
  const vp = ctx.tag('Viewport.Content') as L.Component
  if (section === -1) {
    vp?.setSmooth?.('y', 0)
  } else {
    ;(ctx as any)['_applyScrollForSection']?.(section as any)
  }
}

/** Focus al Play del Hero */
export function forceFocusPlayBtn(ctx: any) {
  ctx._btnIndex = 0
  ctx._section = 0
  scrollToSection(ctx, 0)
  ctx._refocus()
}

/** Sincronitza el Header amb la ruta */
export function applyHeaderSelected(ctx: any, fromRoute: string | null) {
  if (!fromRoute) return
  const header = ctx.tag('Viewport.Content.ContentInner.Header') as unknown as Header
  header?.setCurrentByRoute?.(fromRoute)
}

/** Pinta dades al Hero i descripció (no llegeix cap `data` global) */
export function patchDetailData(ctx: any, v: TileData | null) {
  if (!v) return
  const src = (v as any).posterSrc || v.imageSrc
  if (src) {
    ctx.tag('Hero.Poster').patch({
      texture: Img(Utils.asset(src)).cover(Theme.w, HERO_H),
    })
  }
  ctx.tag('Hero.Info.Title').patch({ text: { text: v.title ?? '' } })

  const genres = Array.isArray((v as any).genres)
    ? (v as any).genres.join(', ')
    : (v as any).genres || ''
  const meta = [v.year, genres, v.duration].filter(Boolean).join(' • ')
  ctx.tag('Hero.Info.Meta').patch({ text: { text: meta } })
  ctx.tag('DescBox').patch({ text: { text: v.description ?? '' } })
}
