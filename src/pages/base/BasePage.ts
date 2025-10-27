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
  // dins class BasePage
  private _pendingRestoreY: number | null = null
  private _restoreTries = 0
  private _restoreMaxTries = 6 // 6 frames (~100ms) acostuma a sobrar
  private _pendingEpsilon = 1 // tolerància de 1px

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
  /** Si `true`, s’aplica focus inicial intel·ligent en entrada “nova”. */
  protected get autoInitialFocus(): boolean {
    return true
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
      // POP → restaura (però aplicarem el y després de layout)
      this._restoredFromHistory = true
      const restoredSection = params.section ?? (this.hasHeader ? -1 : 0)
      this._section = !this.persistHeaderInHistory && restoredSection < 0 ? 0 : restoredSection

      // 👇 No toquem encara content.y; només guardem el valor
      this._pendingRestoreY = params.scrollY ?? 0

      // 🔍 Log de diagnosi
      console.log('%c[BasePage] RESTORE (historyState)', 'color: #ff9800; font-weight: bold;', {
        restoredSection,
        pendingRestoreY: this._pendingRestoreY,
        focus: params.focus,
      })

      const test = this._pendingRestoreY
      setTimeout(() => {
        const content = this.tag('Viewport.Content') as L.Component
        content.setSmooth('y', -test)
      }, 100)

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
    setTimeout(() => {
      this._computeMetrics()

      // 👇 Si venim de POP, apliquem ara el scroll exacte amb els límits ja calculats
      if (this._pendingRestoreY !== null) {
        const content = this.tag('Viewport.Content') as L.Component
        const wantedY = -this._pendingRestoreY
        content.patch({ y: this._clamp(wantedY) })
        this._pendingRestoreY = null
        this._refocus()
      } else {
        this._maybeInitFocus()
      }
    }, 0)
  }

  override _attach() {
    this._computeMetrics()
    this._maybeInitFocus()
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
  protected _syncHistorySnapshot(force = false) {
    if (!this.enableHistory) return
    const now = Date.now()
    if (!force && now - this._lastSync < 120) return
    this._lastSync = now

    const content = this.tag('Viewport.Content') as L.Component

    const sectionToSave = !this.persistHeaderInHistory && this._section < 0 ? 0 : this._section
    const scrollY = Math.abs((content.y as number) || 0)

    console.log('%c[BasePage] SAVE', 'color: #00bfa5', { section: sectionToSave, scrollY })

    const state: HistorySnapshot = {
      section: sectionToSave,
      scrollY,
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
    this._syncHistorySnapshot?.(true) // 💾
    const base = path.replace(/^#?\/?/, '').toLowerCase()
    const target = params?.id ? `${base}/${encodeURIComponent(params.id)}` : base
    ;(Router as any).navigate(target)
  }

  // ======== FOCUS INICIAL INTEL·LIGENT ========
  /** Decideix i aplica la secció inicial quan no venim d’history POP. */
  private _maybeInitFocus() {
    if (!this.autoInitialFocus) return
    if (this.wasRestoredFromHistory) return
    if (!this.sections.length) return

    const desired = this._determineInitialSectionIndex()

    // Evita deixar el Header (-1) com a focus inicial per defecte
    const safeIndex = Math.max(0, desired)

    if (safeIndex !== this._section) {
      this._section = safeIndex
      this._applyScrollForSection(this._section)
    } else {
      this._refocus()
    }
  }

  /**
   * Troba la millor secció inicial segons:
   * prev focus > Carussel > Hero > primera.
   * Nota: comprovem que el tag existeix i que el nom és a `sections`.
   */
  private _determineInitialSectionIndex(): number {
    // 1) si algun fill té focus previ (getFocusIndex/_focusIndex)
    const withPrev = this.sections.findIndex((name) => {
      const idx = this._getChildFocusIndex(name)
      return idx !== undefined && idx !== null
    })
    if (withPrev >= 0) return withPrev

    // 2) Carussel explícit
    const carusselIdx = this._hasInnerTag('Carussel') ? this.sections.indexOf('Carussel') : -1
    if (carusselIdx >= 0) return carusselIdx

    // 3) Hero
    const heroIdx = this._hasInnerTag('Hero') ? this.sections.indexOf('Hero') : -1
    if (heroIdx >= 0) return heroIdx

    // 4) fallback: primera secció
    return 0
  }

  /** Comprova si existeix un tag sota ContentInner amb aquest nom. */
  private _hasInnerTag(name: string): boolean {
    try {
      const node = this.tag(`${this.innerPath}.${name}`) as L.Component | undefined
      return !!node
    } catch {
      return false
    }
  }
}
