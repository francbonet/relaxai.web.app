import { Lightning as L, Router } from '@lightningjs/sdk'
import Header from '../molecules/Header'
import { Rail } from '../molecules/Rail'
import { Theme } from '../core/theme'
import { Carousell } from '../molecules/Carousell'
import { data } from '../data/data'

type SectionKey = 'Header' | 'Carussel' | 'TopSearches' | 'NextWatch' | 'Retro'

// ★ Estat a persistir al history
type HomeHistoryState = {
  section: number // -1..3
  scrollY: number // Content.y en positiu (0..)
  // Opcional per si vols recordar focus intern dels rails / carrousel
  focus?: {
    car?: number
    top?: number
    next?: number
    retro?: number
  }
}

const GAP2 = 30
const GAP = 60
const HEADER_H = 200
const CAROUSSEL_H = 600
const RAIL_H = 230
const EXTRA_BOTTOM = 120 // margen inferior (respirar al final)

export default class HomeSection extends L.Component {
  // -1 = Header, 0 = Carussel, 1 = TopSearches, 2 = NextWatch, 3 = Retro
  private _section = -1

  // offsets (y absolutos dentro de Viewport.Content)
  private _offsets: Record<SectionKey, number> = {
    Header: 0,
    Carussel: 0,
    TopSearches: 0,
    NextWatch: 0,
    Retro: 0,
  }

  private _minY = 0 // límite inferior para Content.y (negativo)
  private _maxY = 0 // límite superior (0)

  static override _template(): L.Component.Template<any> {
    return {
      w: Theme.w,
      h: Theme.h,
      rect: true,
      color: Theme.colors.bg,

      Viewport: {
        w: Theme.w,
        h: Theme.h,
        clipping: true,

        // desplazamos este nodo
        Content: {
          y: 0,
          transitions: { y: { duration: 0.25, timingFunction: 'ease-out' } },

          // Todo el layout dentro
          ContentInner: {
            y: 0,

            Header: {
              type: Header,
              h: HEADER_H,
              signals: { navigate: true, focusNext: true },
            },

            // Carussel 40px debajo del Header
            Carussel: {
              y: HEADER_H + GAP2, // 200 + 40 = 240
              h: CAROUSSEL_H,
              type: Carousell,
              signals: { focusPrev: true, focusNext: true, navigate: true },
            },

            // TopSearches 40px debajo del Carussel
            TopSearches: {
              y: HEADER_H + GAP2 + CAROUSSEL_H + GAP2, // 200+40+600+40 = 880
              h: RAIL_H,
              type: Rail,
              signals: { focusPrev: true, focusNext: true, navigate: true },
            },

            // NextWatch 40px debajo del TopSearches
            NextWatch: {
              y: HEADER_H + GAP2 + CAROUSSEL_H + GAP2 + RAIL_H + GAP, // 1140
              h: RAIL_H,
              type: Rail,
              signals: { focusPrev: true, focusNext: true, navigate: true },
            },

            // Retro 40px debajo del NextWatch
            Retro: {
              y: HEADER_H + GAP2 + CAROUSSEL_H + GAP2 + RAIL_H + GAP + RAIL_H + GAP, // 1400
              h: RAIL_H,
              type: Rail,
              signals: { focusPrev: true, focusNext: true, navigate: true },
            },
          },
        },
      },
    }
  }

  // ---------- HISTORYSTATE ----------
  // El Router cridarà:
  // - en sortir (PUSH): sense params → retornem l'estat a guardar
  // - en entrar des d'historial (POP): amb params → restaurem
  override historyState(params?: HomeHistoryState) {
    const content = this.tag('Viewport.Content') as L.Component

    if (params) {
      // POP → Restaura
      this._section = params.section ?? -1
      const wantedY = -(params.scrollY ?? 0)
      content.patch({ y: this._clamp(wantedY) })

      // Si tens índexos de focus guardats i els components ho suporten:
      this._setChildFocusIndex('Carussel', params.focus?.car)
      this._setChildFocusIndex('TopSearches', params.focus?.top)
      this._setChildFocusIndex('NextWatch', params.focus?.next)
      this._setChildFocusIndex('Retro', params.focus?.retro)

      // Refocus al target actual
      this._refocus()
      return
    }

    // PUSH → Desa snapshot
    const state: HomeHistoryState = {
      section: this._section,
      scrollY: Math.abs((content.y as number) || 0),
      focus: {
        car: this._getChildFocusIndex('Carussel'),
        top: this._getChildFocusIndex('TopSearches'),
        next: this._getChildFocusIndex('NextWatch'),
        retro: this._getChildFocusIndex('Retro'),
      },
    }
    return state
  }
  // ----------------------------------

  override _active() {
    this.tag('Viewport.Content.ContentInner.Header')?.setCurrentByRoute('home')
  }

  override _setup() {
    const inner = 'Viewport.Content.ContentInner'
    this.tag(`${inner}.TopSearches`)?.patch({ title: 'Top searches', items: data.slice(0, 10) })
    this.tag(`${inner}.NextWatch`)?.patch({ title: 'Your next watch', items: data.slice(0, 10) })
    this.tag(`${inner}.Retro`)?.patch({ title: 'Retro TV', items: data.slice(0, 10) })

    // esperar 1 frame por si cambian alturas internas
    setTimeout(() => this._computeMetrics(), 0)
  }

  override _attach() {
    this._computeMetrics()
  }

  private _computeMetrics() {
    const content = this.tag('Viewport.Content') as L.Component
    const inner = this.tag('Viewport.Content.ContentInner') as L.Component
    const get = (name: SectionKey) => inner?.tag(name) as L.Component | undefined
    this.stage.update()

    const zy = (n?: any) => (n?.y as number) || 0
    const zh = (n?: any, fb = 0) => (n?.h as number) || fb

    const header = get('Header')
    const car = get('Carussel')
    const top = get('TopSearches')
    const next = get('NextWatch')
    const retro = get('Retro')

    const innerY = zy(inner)

    // offsets para alinear top de cada sección con top del viewport
    this._offsets.Header = innerY + zy(header)
    this._offsets.Carussel = innerY + zy(car)
    this._offsets.TopSearches = innerY + zy(top)
    this._offsets.NextWatch = innerY + zy(next)
    this._offsets.Retro = innerY + zy(retro)

    // altura total (bottom más profundo) + EXTRA_BOTTOM para “respirar”
    const bottoms = [
      innerY + zy(header) + zh(header, HEADER_H),
      innerY + zy(car) + zh(car, CAROUSSEL_H),
      innerY + zy(top) + zh(top, RAIL_H),
      innerY + zy(next) + zh(next, RAIL_H),
      innerY + zy(retro) + zh(retro, RAIL_H),
    ]
    const totalH = Math.max(...bottoms) + EXTRA_BOTTOM

    const viewportH = Theme.h
    this._maxY = 0
    this._minY = Math.min(0, viewportH - totalH) // negativo si hay overflow

    // clamp por si ya hay y previa
    content.y = this._clamp(content.y as number)
  }

  override _getFocused() {
    // devolvemos el nodo que debe recibir focus real
    if (this._section === -1) return this.tag('Viewport.Content.ContentInner.Header')
    const name = this._nameFor(this._section)
    return this.tag(`Viewport.Content.ContentInner.${name}`)
  }

  private _nameFor(idx: number): Exclude<SectionKey, 'Header'> {
    // 0..3 → Carussel, TopSearches, NextWatch, Retro
    const arr: Exclude<SectionKey, 'Header'>[] = ['Carussel', 'TopSearches', 'NextWatch', 'Retro']
    const i = Math.max(0, Math.min(idx, arr.length - 1))
    return arr[i]!
  }

  // ↓ pasa a la siguiente sección
  focusNext() {
    const max = 3 // Carussel(0), TopSearches(1), NextWatch(2), Retro(3)
    this._section = Math.min(this._section + 1, max)
    this._applyScrollForSection(this._section)
  }

  // ↑ sube sección (hasta Header)
  focusPrev() {
    this._section = Math.max(this._section - 1, -1)
    this._applyScrollForSection(this._section)
  }

  // REGLA: solo scrollea a partir de TopSearches (>=1).
  // Si vuelves a Carussel (0) o Header (-1) → scroll 0.
  private _applyScrollForSection(index: number) {
    const content = this.tag('Viewport.Content') as L.Component

    if (index <= 0) {
      // Header o Carussel → resetea scroll
      content.setSmooth('y', this._clamp(0))
      this._refocus()
      return
    }

    // A partir de TopSearches → scrollea y alinea la sección al top
    const key = this._nameFor(index)
    const targetY = -(this._offsets[key] || 0)
    content.setSmooth('y', this._clamp(targetY))
    this._refocus()
  }

  private _clamp(y: number) {
    return Math.max(this._minY, Math.min(y, this._maxY))
  }

  navigate(path: string, params?: { id?: string }) {
    const base = path.replace(/^#?\/?/, '').toLowerCase() // "detail"
    const target = params?.id ? `${base}/${encodeURIComponent(params.id)}` : base
    ;(Router as any).navigate(target)
  }

  // Teclas del mando (snap por secciones)
  override _handleDown() {
    this.focusNext()
    return true
  }
  override _handleUp() {
    this.focusPrev()
    return true
  }

  // ---------- Helpers focus intern opcional ----------
  private _getChildFocusIndex(name: Exclude<SectionKey, 'Header'>): number | undefined {
    const node = this.tag(`Viewport.Content.ContentInner.${name}`) as any
    try {
      if (node?.getFocusIndex) return node.getFocusIndex()
      if (node?._focusIndex !== undefined) return node._focusIndex
    } catch {
      /* empty */
    }
    return undefined
  }

  private _setChildFocusIndex(name: Exclude<SectionKey, 'Header'>, idx?: number) {
    if (idx === undefined) return
    const node = this.tag(`Viewport.Content.ContentInner.${name}`) as any
    try {
      if (node?.setFocusIndex) node.setFocusIndex(idx)
      else if (node) node._focusIndex = idx
    } catch {
      /* empty */
    }
  }
  // ---------------------------------------------------

  // Escriu un snapshot “fresc” a l’entrada d’historial (throttle suau)
  private _lastSync = 0
  private _syncHistorySnapshot() {
    const now = Date.now()
    if (now - this._lastSync < 120) return
    this._lastSync = now

    const content = this.tag('Viewport.Content') as L.Component
    const state: HomeHistoryState = {
      section: this._section,
      scrollY: Math.abs((content.y as number) || 0),
      focus: {
        car: this._getChildFocusIndex('Carussel'),
        top: this._getChildFocusIndex('TopSearches'),
        next: this._getChildFocusIndex('NextWatch'),
        retro: this._getChildFocusIndex('Retro'),
      },
    }
    Router.replaceHistoryState?.(state)
  }
}
