// src/pages/base/BasePage.ts
import { Lightning as L, Router } from '@lightningjs/sdk'
import { Theme } from '../../core/theme'

// Tipus per clau de secció
export type SectionKey = string

export type HistorySnapshot = {
  section: number
  scrollY: number
  focus?: Record<SectionKey, number>
}

export abstract class BasePage extends L.Component {
  // ======== CONFIGURACIÓ PER PÀGINA (override a la subclasse) ========
  /** Si tens capçalera al top (tag 'Header' a ContentInner). */
  protected get hasHeader(): boolean {
    return true
  }
  /** Ordre de seccions (excloent 'Header'). Ex.: ['Hero','RailX','RailY'] */
  protected get sections(): SectionKey[] {
    return []
  }
  /** Fallback d’alçades si algun node encara no té .h resolt. */
  protected get defaultHeights(): Partial<Record<SectionKey | 'Header', number>> {
    return {}
  }
  /** Marge extra al final per respirar. */
  protected get extraBottom(): number {
    return 120
  }
  /** Activar scroll snap per seccions (si false, no fa scroll i ignora _section). */
  protected get enableScrollSnap(): boolean {
    return true
  }
  /** Persistir/recuperar estat amb Router.historyState. */
  protected get enableHistory(): boolean {
    return true
  }
  /** Path a ContentInner (per si canvies l’estructura). */
  protected get innerPath(): string {
    return 'Viewport.Content.ContentInner'
  }
  /** Si `false`, no persistim mai el Header (-1) a l'history. */
  protected get persistHeaderInHistory(): boolean {
    return false
  }

  // ======== ESTAT COMÚ ========
  protected _section: number = this.hasHeader ? -1 : 0
  protected _restoredFromHistory = false
  protected get wasRestoredFromHistory() {
    return this._restoredFromHistory
  }

  private _offsets: Record<string, number> = {}
  private _minY = 0
  private _maxY = 0
  private _lastSync = 0

  // ======== TEMPLATE COMÚ (Chrome) ========
  static chrome(children: L.Component.Template<any>): L.Component.Template<any> {
    return {
      w: Theme.w,
      h: Theme.h,
      rect: true,
      color: Theme.colors.bg,
      Viewport: {
        w: Theme.w,
        h: Theme.h,
        clipping: true,
        Content: {
          y: 0,
          transitions: { y: { duration: 0.25, timingFunction: 'ease-out' } },
          ContentInner: children,
        },
      },
    }
  }

  // ======== HISTORYSTATE ========
  override historyState(params?: HistorySnapshot) {
    if (!this.enableHistory) return
    const content = this.tag('Viewport.Content') as L.Component

    if (params) {
      // POP → restaura
      this._restoredFromHistory = true
      const restoredSection = params.section ?? (this.hasHeader ? -1 : 0)
      this._section = !this.persistHeaderInHistory && restoredSection < 0 ? 0 : restoredSection

      const wantedY = -(params.scrollY ?? 0)
      content.patch({ y: this._clamp(wantedY) })

      for (const key of this.sections) {
        const idx = params.focus?.[key]
        if (idx !== undefined) this._setChildFocusIndex(key, idx)
      }
      this._refocus()
      return
    }

    // PUSH → desa (si estaves al Header i no el volem persistir, guarda 0)
    const sectionToSave = !this.persistHeaderInHistory && this._section < 0 ? 0 : this._section

    const snap: HistorySnapshot = {
      section: sectionToSave,
      scrollY: Math.abs((content.y as number) || 0),
      focus: {},
    }
    for (const key of this.sections) {
      const idx = this._getChildFocusIndex(key)
      if (idx !== undefined) snap.focus![key] = idx
    }
    return snap
  }

  // ======== LAYOUT ========
  protected computeAfterLayout() {
    setTimeout(() => this._computeMetrics(), 0)
  }

  override _attach() {
    this._computeMetrics()
  }

  protected _computeMetrics() {
    const content = this.tag('Viewport.Content') as L.Component
    const inner = this.tag(this.innerPath) as L.Component
    this.stage.update()

    const zy = (n?: any) => (n?.y as number) || 0
    const zh = (name: string, n?: any) =>
      (n?.h as number) || this.defaultHeights[name as keyof typeof this.defaultHeights] || 0
    const get = (name: string) => inner?.tag(name) as L.Component | undefined

    const innerY = zy(inner)
    this._offsets = {}

    if (this.hasHeader) {
      const header = get('Header')
      this._offsets['Header'] = innerY + zy(header)
    }
    for (const key of this.sections) {
      const node = get(key)
      this._offsets[key] = innerY + zy(node)
    }

    const bottoms: number[] = []
    if (this.hasHeader) {
      const header = get('Header')
      bottoms.push(innerY + zy(header) + zh('Header', header))
    }
    for (const key of this.sections) {
      const node = get(key)
      bottoms.push(innerY + zy(node) + zh(key, node))
    }

    const totalH = Math.max(...bottoms, Theme.h) + this.extraBottom
    const viewportH = Theme.h
    this._maxY = 0
    this._minY = Math.min(0, viewportH - totalH)
    content.y = this._clamp(content.y as number)
  }

  // ======== FOCUS ========
  override _getFocused() {
    if (this.hasHeader && this._section === -1) return this.tag(`${this.innerPath}.Header`)
    const name = this._nameFor(this._section)
    return this.tag(`${this.innerPath}.${name}`)
  }

  protected _nameFor(index: number): string {
    if (this.hasHeader) {
      // -1 = Header, 0..n = sections
      if (index < 0) return 'Header'
      return this.sections[Math.max(0, Math.min(index, this.sections.length - 1))]!
    }
    // 0..n = sections
    return this.sections[Math.max(0, Math.min(index, this.sections.length - 1))]!
  }

  protected focusActiveNode() {
    const f = this._getFocused() as any
    if (f?.focus) f.focus()
  }

  // ======== NAVEGACIÓ PER SECCIONS ========
  protected focusNext() {
    if (!this.enableScrollSnap) return
    const max = this.sections.length - 1
    const next = this.hasHeader
      ? Math.min(this._section + 1, max)
      : Math.min(this._section + 1, max)
    this._section = next
    this._applyScrollForSection(this._section)
    this._syncHistorySnapshot()
  }

  protected focusPrev() {
    if (!this.enableScrollSnap) return
    const min = this.hasHeader ? -1 : 0
    this._section = Math.max(this._section - 1, min)
    this._applyScrollForSection(this._section)
    this._syncHistorySnapshot()
  }

  protected _applyScrollForSection(index: number) {
    const content = this.tag('Viewport.Content') as L.Component
    if (!this.enableScrollSnap) {
      this._refocus()
      return
    }

    if (this.hasHeader && index <= 0) {
      content.setSmooth('y', this._clamp(0))
      this._refocus()
      return
    }

    const key = this._nameFor(index)
    const targetY = -(this._offsets[key] || 0)
    content.setSmooth('y', this._clamp(targetY))
    this._refocus()
  }

  protected _clamp(y: number) {
    return Math.max(this._minY, Math.min(y, this._maxY))
  }

  // ======== HISTORY SNAPSHOT (throttle) ========
  protected _syncHistorySnapshot() {
    if (!this.enableHistory) return
    const now = Date.now()
    if (now - this._lastSync < 120) return
    this._lastSync = now

    const content = this.tag('Viewport.Content') as L.Component

    // no persistim -1 si així ho demanem
    const sectionToSave = !this.persistHeaderInHistory && this._section < 0 ? 0 : this._section

    const state: HistorySnapshot = {
      section: sectionToSave,
      scrollY: Math.abs((content.y as number) || 0),
      focus: {},
    }
    for (const key of this.sections) {
      const idx = this._getChildFocusIndex(key)
      if (idx !== undefined) state.focus![key] = idx
    }
    Router.replaceHistoryState?.(state)
  }

  // ======== HELPERS FOCUS INTERN ========
  protected _getChildFocusIndex(name: SectionKey): number | undefined {
    const node = this.tag(`${this.innerPath}.${name}`) as any
    try {
      if (node?.getFocusIndex) return node.getFocusIndex()
      if (node?._focusIndex !== undefined) return node._focusIndex
    } catch {
      /* empty */
    }
    return undefined
  }

  protected _setChildFocusIndex(name: SectionKey, idx?: number) {
    if (idx === undefined) return
    const node = this.tag(`${this.innerPath}.${name}`) as any
    try {
      if (node?.setFocusIndex) node.setFocusIndex(idx)
      else if (node) node._focusIndex = idx
    } catch {
      /* empty */
    }
  }

  // ======== TECLAT PER DEFECTE (pots override) ========
  override _handleDown() {
    this.focusNext()
    return true
  }
  override _handleUp() {
    this.focusPrev()
    return true
  }

  // ======== NAVEGAR util ========
  protected navigate(path: string, params?: Record<string, any>) {
    const base = path.replace(/^#?\/?/, '').toLowerCase()
    const target = params?.id ? `${base}/${encodeURIComponent(params.id)}` : base
    ;(Router as any).navigate(target)
  }
}
