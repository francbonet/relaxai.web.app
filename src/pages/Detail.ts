import { Lightning as L, Router } from '@lightningjs/sdk'
import Header from '../molecules/Header'
import { Theme } from '../core/theme'

type SectionKey = 'Header'

const HEADER_H = 200
const RAIL_H = 230
const EXTRA_BOTTOM = 120 // margen inferior (respirar al final)

export default class Detail extends L.Component {
  // -1 = Header, 0 = Carussel, 1 = TopSearches, 2 = NextWatch, 3 = Retro
  private _section = -1

  // offsets (y absolutos dentro de Viewport.Content)
  private _offsets: Record<SectionKey, number> = {
    Header: 0,
  }

  private _minY = 0
  private _maxY = 0

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

            Text: {
              x: 100,
              y: 400,
              text: { text: 'Detail' },
            },
          },
        },
      },
    }
  }

  override _active() {
    // NOTE mantiene la ruta ultima.
    // this.tag('Viewport.Content.ContentInner.Header')?.setCurrentByRoute('breathe')
    this.$onRoute()
  }

  // Quan la ruta canvia a #detail/2 el Router crida aquest hook
  $onRoute() {
    const id =
      (this as any).params?.id ||
      (this as any).location?.params?.id ||
      (this as any).query?.id ||
      (this as any).location?.query?.id

    // 👉 parcheja el node correcte: ContentInner.Text
    const textNode = this.tag('Viewport.Content.ContentInner.Text') as L.Component
    textNode?.patch({ text: { text: `Detail -> ${id ?? '—'}` } })
  }

  override _setup() {
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

    const innerY = zy(inner)

    // offsets para alinear top de cada sección con top del viewport
    this._offsets.Header = innerY + zy(header)

    // altura total (bottom más profundo) + EXTRA_BOTTOM para “respirar”
    const bottoms = [innerY + zy(header) + zh(header, HEADER_H), innerY + zy(top) + zh(top, RAIL_H)]
    const totalH = Math.max(...bottoms) + EXTRA_BOTTOM

    const viewportH = Theme.h
    this._maxY = 0
    this._minY = Math.min(0, viewportH - totalH) // negativo si hay overflow

    // clamp por si ya hay y previa
    content.y = this._clamp(content.y as number)
  }

  override _getFocused() {
    // devolvemos el nodo que debe recibir focus real
    return this.tag('Viewport.Content.ContentInner.Header')
  }

  private _nameFor(idx: number): Exclude<SectionKey, 'Header'> {
    // 0..3 → Carussel, TopSearches, NextWatch, Retro
    const arr: Exclude<SectionKey, 'Header'>[] = []
    const i = Math.max(0, Math.min(idx, arr.length - 1))
    return arr[i]!
  }

  // ↓ pasa a la siguiente sección
  focusNext() {
    const max = 0 // Carussel(0), TopSearches(1), NextWatch(2), Retro(3)
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
