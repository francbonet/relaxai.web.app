// src/pages/Detail.ts
import { Img, Lightning as L, Utils } from '@lightningjs/sdk'
import Header from '../molecules/Header'
import { BasePage } from './base/BasePage'
import { Theme } from '../core/theme'
import type { TileData } from '../atoms/Tile'
import { data } from '../data/data'
import { Button } from '../atoms/Button'
import { Rail } from '../molecules/Rail'

const HEADER_H = 200
const HERO_H = 650
const CONTENT_Y = HEADER_H
const SIDE_MARGIN = 100
const RAIL_H = 230

type SectionRoute = 'home' | 'suggest' | 'breathe' | 'longform' | 'search'

export default class Detail extends BasePage {
  private _data: TileData | null = null

  // índex horitzontal de botons dins de Hero
  private _btnIndex = 0
  private _btnOrder: Array<'PlayBtn' | 'AddBtn' | 'LikeBtn'> = ['PlayBtn', 'AddBtn', 'LikeBtn']

  // secció d’origen (ve de params.section)
  private _fromRoute: SectionRoute | null = null

  // id anterior per detectar re-entrades amb altre ítem
  private _lastId: string | null = null

  // ===== Config pàgina (BasePage) =====
  protected override get hasHeader() {
    return true
  }
  protected override get enableScrollSnap() {
    return true
  } // Header <-> Hero
  protected override get defaultHeights() {
    // Nota: TopSearches només per info (scroll-snap)
    return { Header: HEADER_H, Hero: HERO_H, TopSearches: RAIL_H }
  }
  protected override get sections() {
    // -1 (Header) és virtual; 0 = Hero; 1 = TopSearches
    return ['Hero', 'TopSearches']
  }
  /** No volem persistir el Header a l’històric. */
  protected override get persistHeaderInHistory() {
    return false
  }

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

      TopSearches: {
        y: CONTENT_Y + HERO_H + 130,
        h: RAIL_H,
        type: Rail,
        signals: { focusPrev: true, focusNext: true, navigate: true },
      },
    })
  }

  // ===== Hidratació per Router (params: { section, id }) =====
  override _onUrlParams(params: any) {
    this._fromRoute = this._sanitizeSection(params?.section)

    const newId = params?.id ? String(params.id) : this._extractIdFromHash()
    const cameFromRail = params?.focus === 'rail' || params?.section === 'search' // <-- ajusta-ho si envies aquesta info

    if (newId && newId !== this._lastId) {
      this._lastId = newId
      ;(this as any)._restoredFromHistory = false

      if (cameFromRail) {
        this._focusRailOnEnter() // 👉 si véns d’un rail, prepara secció 1
      } else {
        this._forceFocusPlayBtn() // default: Hero
      }
    }

    this._hydrateFromId(newId)

    if (!this.wasRestoredFromHistory) {
      if (cameFromRail) this._focusRailOnEnter()
      else this._forceFocusPlayBtn()
    }

    this._applyHeaderSelected()
  }

  // ===== HistoryState: inclou/recupera fromRoute i respecta POP =====
  override historyState(params?: any) {
    if (params) {
      // POP: restaura fromRoute i deixa BasePage restaurar scroll/section/focus
      this._fromRoute = this._sanitizeSection(params.fromRoute) ?? this._fromRoute
      this._applyHeaderSelected()
      return super.historyState(params)
    }
    const snap = super.historyState() as any
    if (snap) snap.fromRoute = this._fromRoute || undefined
    return snap
  }

  // ===== Helpers =====
  private _sanitizeSection(v: any): SectionRoute | null {
    const s = String(v || '').toLowerCase()
    const allowed: SectionRoute[] = ['home', 'suggest', 'breathe', 'longform', 'search']
    return allowed.includes(s as SectionRoute) ? (s as SectionRoute) : null
  }

  private _extractIdFromHash(): string | null {
    if (typeof window === 'undefined') return null
    // hash format: #/<section>/detail/<id>
    const segs = window.location.hash.replace(/^#\/?/, '').split('/')
    return segs[3] ? decodeURIComponent(segs[3]) : segs[1] || null
  }

  private _hydrateFromId(id: string | null) {
    const found = id ? data.find((d) => String(d.id) === id) || null : null
    this.data = found
  }

  /** Helper: scroll a la secció (accepta -1 = Header) amb fallback. */
  private _scrollToSection(s: number) {
    if (this['_applyScrollForSection']) {
      // Si BasePage entén -1, fantàstic
      try {
        this['_applyScrollForSection'](s as any)
        return
      } catch (_) {
        // si no entén -1, fem fallback
      }
    }
    // Fallback: Header = y 0; resta → delega a applyScroll si existeix
    const vp = this.tag('Viewport.Content') as L.Component
    if (s === -1) {
      vp?.setSmooth?.('y', 0)
    } else {
      this['_applyScrollForSection']?.(s as any)
    }
  }

  private _forceFocusPlayBtn() {
    this._btnIndex = 0
    ;(this as any)._section = 0 // Hero
    this._scrollToSection(0)
    this._refocus()
  }

  private _applyHeaderSelected() {
    if (!this._fromRoute) return
    const header = this.tag('Viewport.Content.ContentInner.Header') as unknown as Header
    header?.setCurrentByRoute?.(this._fromRoute)
  }

  // ===== Data setter =====
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
    if (!this.wasRestoredFromHistory) {
      // Pot ser que _onUrlParams hagi posat secció=1 (rail) o 0 (hero)
      // No fem res aquí; ho fixem després de layout
    }
    this._applyHeaderSelected()

    const inner = 'Viewport.Content.ContentInner'
    this.tag(`${inner}.TopSearches`)?.patch({ title: 'Related', items: data.slice(0, 10) })
    this.computeAfterLayout()
  }

  /** Força el focus a un botó de l'Hero i situa la secció a Hero. */
  public focusHeroBtn(key: 'PlayBtn' | 'AddBtn' | 'LikeBtn' = 'PlayBtn') {
    const idx = this._btnOrder.indexOf(key)
    if (idx < 0) return
    this._btnIndex = idx
    ;(this as any)._section = 0 // Hero
    this._scrollToSection(0)
    this._refocus()
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
    if ((this as any)._section === 0) {
      const key = this._btnOrder[this._btnIndex]
      return this.tag(`Viewport.Content.ContentInner.Hero.Info.Buttons.${key}`)
    }
    // secció 1: TopSearches
    return this.tag('Viewport.Content.ContentInner.TopSearches')
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
    // Si som al Header (-1), baixa al Hero (0) directament
    if ((this as any)._section === -1) {
      ;(this as any)._section = 0
      this._scrollToSection(0)
      this._refocus()
      return true
    }
    this['focusNext']?.()
    return true
  }

  override _handleUp() {
    // Si estàs al Hero (0), puja al Header (-1)
    if ((this as any)._section === 0) {
      ;(this as any)._section = -1
      this._scrollToSection(-1)
      this._refocus()
      return true
    }
    this['focusPrev']?.()
    return true
  }

  public override focusNext() {
    const max = 1 // Hero(0), TopSearches(1)
    ;(this as any)._section = Math.min(max, ((this as any)._section ?? 0) + 1)
    this._scrollToSection((this as any)._section)
    this._refocus()
  }

  public override focusPrev() {
    const cur = (this as any)._section ?? 0
    ;(this as any)._section = Math.max(-1, cur - 1) // permet -1 (Header)
    this._scrollToSection((this as any)._section)
    this._refocus()
  }

  private _focusRailOnEnter = () => {
    ;(this as any)._section = 1
    this._scrollToSection(1)
    this._refocus()
  }

  // ===== Acció Enter =====
  override _handleEnter() {
    const key = this._btnOrder[this._btnIndex]
    if (key === 'PlayBtn') {
      // si vols propagar la secció fins al player per coherència visual
      this['navigate']?.('player', { id: this._data?.id, section: this._fromRoute || 'home' })
    }
    return true
  }
}
