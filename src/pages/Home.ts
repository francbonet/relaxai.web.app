import { Lightning as L, Router } from '@lightningjs/sdk'
import Header from '../molecules/Header'
import { Rail } from '../molecules/Rail'
import { Theme } from '../core/theme'
import { Carousell } from '../molecules/Carousell'

type SectionKey = 'Header' | 'Carussel' | 'TopSearches' | 'NextWatch' | 'Retro'
const SECTIONS: SectionKey[] = ['Header', 'Carussel', 'TopSearches', 'NextWatch', 'Retro']

const GAP2 = 30
const GAP = 60
const HEADER_H = 200
const CAROUSSEL_H = 600
const RAIL_H = 230
const EXTRA_BOTTOM = 120 // margen inferior (respirar al final)

export default class Home extends L.Component {
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
              signals: { focusPrev: true, focusNext: true },
            },

            // TopSearches 40px debajo del Carussel
            TopSearches: {
              y: HEADER_H + GAP2 + CAROUSSEL_H + GAP2, // 200+40+600+40 = 880
              h: RAIL_H,
              type: Rail,
              signals: { focusPrev: true, focusNext: true },
            },

            // NextWatch 40px debajo del TopSearches
            NextWatch: {
              y: HEADER_H + GAP2 + CAROUSSEL_H + GAP2 + RAIL_H + GAP, // 1140
              h: RAIL_H,
              type: Rail,
              signals: { focusPrev: true, focusNext: true },
            },

            // Retro 40px debajo del NextWatch
            Retro: {
              y: HEADER_H + GAP2 + CAROUSSEL_H + GAP2 + RAIL_H + GAP + RAIL_H + GAP, // 1400
              h: RAIL_H,
              type: Rail,
              signals: { focusPrev: true, focusNext: true },
            },
          },
        },
      },
    }
  }

  override _active() {
    this.tag('Viewport.Content.ContentInner.Header')?.setCurrentByRoute('home')
  }

  override _setup() {
    const inner = 'Viewport.Content.ContentInner'
    this.tag(`${inner}.TopSearches`)?.patch({ title: 'Top searches', items: dummy(10) })
    this.tag(`${inner}.NextWatch`)?.patch({ title: 'Your next watch', items: dummy(10) })
    this.tag(`${inner}.Retro`)?.patch({ title: 'Retro TV', items: dummy(10) })

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

  navigate(path: string) {
    ;(Router as any).navigate(path)
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
}

function dummy(n: number) {
  return Array.from({ length: n }, (_, i) => ({ id: String(i), title: `Item ${i + 1}` }))
}
