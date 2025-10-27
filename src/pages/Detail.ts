// src/pages/Detail.ts
import { Img, Lightning as L, Router, Utils } from '@lightningjs/sdk'
import Header from '../molecules/Header'
import { BasePage } from './base/BasePage'
import { Theme } from '../core/theme'
import type { TileData } from '../atoms/Tile'
import { data } from '../data/data'
import { Button } from '../atoms/Button'

const HEADER_H = 200
const HERO_H = 650
const CONTENT_Y = HEADER_H
const SIDE_MARGIN = 100

export default class Detail extends BasePage {
  private _data: TileData | null = null

  // índex horitzontal de botons dins de Hero
  private _btnIndex = 0
  private _btnOrder: Array<'PlayBtn' | 'AddBtn' | 'LikeBtn'> = ['PlayBtn', 'AddBtn', 'LikeBtn']

  // ===== Config pàgina (BasePage) =====
  protected override get hasHeader() {
    return true
  }
  protected override get enableScrollSnap() {
    return true
  } // Header <-> Hero
  protected override get defaultHeights() {
    return { Header: HEADER_H }
  }
  protected override get sections() {
    return ['Hero']
  } // 0 = Hero ( -1 = Header )

  // ===== Template =====
  static override _template() {
    return BasePage.chrome({
      Header: {
        type: Header,
        h: HEADER_H,
        signals: { navigate: true, focusNext: true },
      },

      Hero: {
        y: CONTENT_Y,
        w: Theme.w,
        h: HERO_H,

        Poster: { w: Theme.w, h: HERO_H, texture: null },

        Overlay: {
          w: Theme.w,
          h: HERO_H,
          rect: true,
          colorTop: 0x00000000,
          colorBottom: 0xe0000000,
        },

        Info: {
          x: SIDE_MARGIN,
          y: HERO_H - 260,

          Title: {
            text: {
              text: '',
              fontSize: 72,
              fontFace: 'RelaxAI-SoraBold',
              textColor: Theme.colors.text,
            },
          },

          Meta: {
            y: 90,
            text: { text: '', fontSize: 30, textColor: Theme.colors.textDim },
          },

          Buttons: {
            y: 150,

            PlayBtn: {
              type: Button,
              x: 0,
              w: 260,
              label: 'WATCH NOW',
            },

            AddBtn: {
              type: Button,
              x: 270,
              w: 80,
              h: 80,
              shader: { type: L.shaders.RoundedRectangle, radius: 40 },
              label: '',
              Icon: {
                mount: 0.5,
                x: 40,
                y: 40,
                text: { text: '+', textColor: Theme.colors.bg, fontSize: 40 },
              },
            },

            LikeBtn: {
              type: Button,
              x: 355,
              w: 80,
              h: 80,
              shader: { type: L.shaders.RoundedRectangle, radius: 40 },
              label: '',
              Icon: {
                mount: 0.5,
                x: 40,
                y: 40,
                text: { text: '👍', textColor: Theme.colors.bg, fontSize: 40 },
              },
            },
          },
        },
      },

      DescBox: {
        y: CONTENT_Y + HERO_H + 40,
        x: SIDE_MARGIN,
        w: Theme.w - SIDE_MARGIN * 2,
        text: {
          text: '',
          wordWrap: true,
          maxLines: 5,
          fontSize: 28,
          lineHeight: 40,
          textColor: Theme.colors.textDim,
        },
      },
    })
  }

  // ===== Hidratació per Router/hash =====
  override _onUrlParams(params: any) {
    this._hydrateFromParams(params)
  }

  private _hydrateFromParams(params: any) {
    const id =
      params?.id ?? (typeof window !== 'undefined' ? window.location.hash.split('/')[1] : null)

    const found = data.find((d) => String(d.id) === String(id)) || params?.item || null
    this.data = found
  }

  set data(v: TileData | null) {
    this._data = v
    if (!v) return

    // Hero image (cover)
    const src = (v as any).posterSrc || v.imageSrc
    if (src) {
      this.tag('Hero.Poster').patch({
        texture: Img(Utils.asset(src)).cover(Theme.w, HERO_H),
      })
    }

    // Title + Meta
    this.tag('Hero.Info.Title').patch({ text: { text: v.title ?? '' } })

    const genres = Array.isArray((v as any).genres)
      ? (v as any).genres.join(', ')
      : (v as any).genres || ''
    const meta = [v.year, genres, v.duration].filter(Boolean).join(' • ')
    this.tag('Hero.Info.Meta').patch({ text: { text: meta } })

    // Description
    this.tag('DescBox').patch({ text: { text: v.description ?? '' } })
  }

  // ===== Focus management =====

  override _setup() {
    ;(this as any)._section = 0
    this['_applyScrollForSection']?.(0)
  }

  getFocusIndex() {
    return this._btnIndex
  }
  setFocusIndex(i: number) {
    this._btnIndex = Math.max(0, Math.min(i, this._btnOrder.length - 1))
  }

  override _getFocused() {
    if (this.hasHeader && (this as any)._section === -1) {
      return this.tag('Viewport.Content.ContentInner.Header')
    }
    const key = this._btnOrder[this._btnIndex]
    return this.tag(`Viewport.Content.ContentInner.Hero.Info.Buttons.${key}`)
  }

  override _handleRight() {
    this.setFocusIndex(this._btnIndex + 1)
    this._refocus()
    return true
  }
  override _handleLeft() {
    this.setFocusIndex(this._btnIndex - 1)
    this._refocus()
    return true
  }

  override _handleDown() {
    this['focusNext']?.()
    return true
  }
  override _handleUp() {
    this['focusPrev']?.()
    return true
  }

  // ===== Acció Enter =====
  override _handleEnter() {
    const key = this._btnOrder[this._btnIndex]
    if (key === 'PlayBtn') {
      this['navigate']?.('player', { id: this._data?.id })
    }
    return true
  }
}
