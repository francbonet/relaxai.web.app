// src/pages/base/BasePage.ts
import { Lightning as L, Router } from "@lightningjs/sdk";
import { Theme } from "../../core/theme";

// ---- Tipos ----
export type SectionKey = string;

export type HistorySnapshot = {
  section: number;
  scrollY: number;
  focus?: Record<SectionKey, number>;
};

export abstract class BasePage extends L.Component {
  // ======== CONFIG POR PÁGINA (override en subclases) ========
  protected get hasHeader(): boolean {
    return true;
  }
  protected get sections(): SectionKey[] {
    return [];
  }
  protected get defaultHeights(): Partial<
    Record<SectionKey | "Header", number>
  > {
    return {};
  }
  protected get extraBottom(): number {
    return 120;
  }
  protected get enableScrollSnap(): boolean {
    return true;
  }
  protected get enableHistory(): boolean {
    return true;
  }
  protected get innerPath(): string {
    return "Viewport.Content.ContentInner";
  }
  protected get persistHeaderInHistory(): boolean {
    return false;
  }
  protected get autoInitialFocus(): boolean {
    return true;
  }
  /** Si `false`, no restauramos índices de foco desde history POP. */
  protected get enableFocusRecovery(): boolean {
    return true;
  }
  /** Hook: decidir si una sección debe hacer scroll (por índice). */
  protected get shouldScrollOnSection(): (index: number) => boolean {
    return () => true;
  }

  // ======== ESTADO ========
  protected _section: number = this.hasHeader ? -1 : 0;
  protected _restoredFromHistory = false;
  protected get wasRestoredFromHistory() {
    return this._restoredFromHistory;
  }

  private _offsets: Record<string, number> = {};
  private _minY = 0;
  private _maxY = 0;
  private _lastSync = 0;
  private _pendingRestoreY: number | null = null;

  // ======== TEMPLATE (Chrome) ========
  static chrome(
    children: L.Component.Template<any>
  ): L.Component.Template<any> {
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
          transitions: { y: { duration: 0.25, timingFunction: "ease-out" } },
          ContentInner: children,
        },
      },
    };
  }

  // ======== HISTORYSTATE ========
  override historyState(params?: HistorySnapshot) {
    if (!this.enableHistory || !this.enableFocusRecovery) return;

    const content = this.tag("Viewport.Content") as L.Component;

    // POP → restaurar estado
    if (params) {
      this._restoredFromHistory = true;

      // Si no persistimos Header en history, al restaurar -1 lo normalizamos a 0
      const restored = params.section ?? (this.hasHeader ? -1 : 0);
      this._section =
        !this.persistHeaderInHistory && restored < 0 ? 0 : restored;

      // Guardamos scroll deseado para aplicarlo tras layout
      this._pendingRestoreY = params.scrollY ?? 0;

      // Restaurar foco de hijos (si procede)
      if (params.focus) {
        for (const key of this.sections) {
          const idx = params.focus[key];
          if (idx !== undefined) this._setChildFocusIndex(key, idx);
        }
      }

      // No tocar y aún; se aplica tras _computeMetrics
      return;
    }

    // PUSH → guardar snapshot
    const sectionToSave =
      !this.persistHeaderInHistory && this._section < 0 ? 0 : this._section;

    const snap: HistorySnapshot = {
      section: sectionToSave,
      scrollY: Math.abs((content.y as number) || 0),
      focus: {},
    };

    for (const key of this.sections) {
      const idx = this._getChildFocusIndex(key);
      if (idx !== undefined) snap.focus![key] = idx;
    }
    return snap;
  }

  // ======== LIFECYCLE ========
  override _attach() {
    this._computeMetrics();
    this._maybeInitFocus();
  }

  override _active() {
    if ((Router as any)._resetNextPage) {
      console.warn(
        "\x1b[31m%s\x1b[0m",
        "[HomePage] Reset state due to header navigation"
      );
      this.resetRailsFocus();
      this.focusCarousel();
      (Router as any)._resetNextPage = false;
    }
  }

  private resetRailsFocus() {
    for (const key of this.sections) {
      const node = this.tag(`${this.innerPath}.${key}`) as any;
      if (!node) continue;

      try {
        // Si el componente tiene setFocusIndex o _focusIndex → lo reseteamos
        if (node.setFocusIndex) {
          node.setFocusIndex(0);
        } else if (node._focusIndex !== undefined) {
          node._focusIndex = 0;
        }
      } catch {
        // noop
      }
    }
  }

  private focusCarousel() {
    const carouselIndex = this.sections.indexOf("Carussel");
    if (carouselIndex < 0) return; // No existe Carussel

    // 1️⃣ Ajustar sección actual
    this._section = carouselIndex;

    // 2️⃣ Hacer scroll a la sección
    this._applyScrollForSection(carouselIndex);

    // 3️⃣ Refocus
    this._refocus();

    // 4️⃣ Optional: sincronizar snapshot de history
    this._syncHistorySnapshot();
  }

  /** Ejecuta después de layout (útil desde subclases post-patch). */
  protected computeAfterLayout() {
    // Dejar que el motor resuelva medidas y posiciones antes de calcular límites
    setTimeout(() => {
      this._computeMetrics();

      // Si venimos de POP, aplicar scroll exacto ahora que ya tenemos límites
      if (this._pendingRestoreY !== null) {
        const content = this.tag("Viewport.Content") as L.Component;
        const wantedY = -this._pendingRestoreY;
        content.patch({ y: this._clamp(wantedY) });
        this._pendingRestoreY = null;
        this._refocus();
      } else {
        this._maybeInitFocus();
      }
    }, 0);
  }

  // ======== MÉTRICAS / LIMITES ========
  protected _computeMetrics() {
    const content = this.tag("Viewport.Content") as L.Component;
    const inner = this.tag(this.innerPath) as L.Component;

    // Asegura final coords (Lightning recomienda forzar update para layout)
    this.stage.update(); // :contentReference[oaicite:2]{index=2}

    const zy = (n?: any) => (n?.y as number) || 0;
    const zh = (name: string, n?: any) =>
      (n?.h as number) ||
      this.defaultHeights[name as keyof typeof this.defaultHeights] ||
      0;
    const get = (name: string) => inner?.tag(name) as L.Component | undefined;

    const innerY = zy(inner);
    this._offsets = {};

    if (this.hasHeader) {
      const header = get("Header");
      this._offsets["Header"] = innerY + zy(header);
    }
    for (const key of this.sections) {
      const node = get(key);
      this._offsets[key] = innerY + zy(node);
    }

    const bottoms: number[] = [];
    if (this.hasHeader) {
      const header = get("Header");
      bottoms.push(innerY + zy(header) + zh("Header", header));
    }
    for (const key of this.sections) {
      const node = get(key);
      bottoms.push(innerY + zy(node) + zh(key, node));
    }

    const totalH = Math.max(...bottoms, Theme.h) + this.extraBottom;
    const viewportH = Theme.h;

    this._maxY = 0;
    this._minY = Math.min(0, viewportH - totalH);

    // Re-clamp del valor actual
    content.y = this._clamp(content.y as number);
  }

  protected _clamp(y: number) {
    return Math.max(this._minY, Math.min(y, this._maxY));
  }

  // ======== FOCUS ========
  override _getFocused() {
    if (this.hasHeader && this._section === -1) {
      return this.tag(`${this.innerPath}.Header`);
    }
    const name = this._nameFor(this._section);
    return this.tag(`${this.innerPath}.${name}`);
  }

  protected _nameFor(index: number): string {
    const clampIndex = (i: number) =>
      Math.max(0, Math.min(i, this.sections.length - 1));

    if (this.hasHeader) {
      if (index < 0) return "Header";
      return this.sections[clampIndex(index)]!;
    }
    return this.sections[clampIndex(index)]!;
  }

  protected focusActiveNode() {
    const f = this._getFocused() as any;
    if (f?.focus) f.focus();
  }

  // ======== NAVEGACIÓN POR SECCIONES ========
  protected focusNext() {
    if (!this.enableScrollSnap) return;
    const max = this.sections.length - 1;
    this._section = Math.min(this._section + 1, max);
    this._applyScrollForSection(this._section);
    this._syncHistorySnapshot();
  }

  protected focusPrev() {
    if (!this.enableScrollSnap) return;
    const min = this.hasHeader ? -1 : 0;
    this._section = Math.max(this._section - 1, min);
    this._applyScrollForSection(this._section);
    this._syncHistorySnapshot();
  }

  /** Lleva el viewport al top inmediato, preservando transiciones del resto. */
  $scrollTop() {
    const content = this.tag("Viewport.Content") as L.Component;
    const prev = (content as any).transitions?.y;

    content.patch({ transitions: { y: { duration: 0 } } });
    content.patch({ y: this._clamp(0) });
    // restaurar transición previa o quitarla si no existía
    content.patch({ transitions: { y: prev ?? (undefined as any) } });

    this._syncHistorySnapshot(true);
  }

  protected _applyScrollForSection(index: number) {
    const content = this.tag("Viewport.Content") as L.Component;

    // Si no hay snap o el hook lo desactiva para esta sección → solo refocus
    if (!this.enableScrollSnap || !this.shouldScrollOnSection(index)) {
      this._refocus();
      return;
    }

    // Header o sección 0 → al tope
    if ((this.hasHeader && index < 0) || index === 0) {
      content.setSmooth("y", this._clamp(0));
      this._refocus();
      return;
    }

    const key = this._nameFor(index);
    const targetY = -(this._offsets[key] || 0);
    content.setSmooth("y", this._clamp(targetY));
    this._refocus();
  }

  // ======== HISTORY SNAPSHOT (throttle) ========
  protected _syncHistorySnapshot(force = false) {
    if (!this.enableHistory) return;
    const now = performance?.now?.() ?? Date.now();
    if (!force && now - this._lastSync < 120) return;
    this._lastSync = now;

    const content = this.tag("Viewport.Content") as L.Component;
    const sectionToSave =
      !this.persistHeaderInHistory && this._section < 0 ? 0 : this._section;
    const scrollY = Math.abs((content.y as number) || 0);

    const state: HistorySnapshot = {
      section: sectionToSave,
      scrollY,
      focus: {},
    };
    for (const key of this.sections) {
      const idx = this._getChildFocusIndex(key);
      if (idx !== undefined) state.focus![key] = idx;
    }

    // Útil para depuración
    console.log("%c[BasePage] SAVE", "color:#00bfa5", state);

    Router.replaceHistoryState?.(state);
  }

  // ======== HELPERS FOCUS HIJOS ========
  protected _getChildFocusIndex(name: SectionKey): number | undefined {
    const node = this.tag(`${this.innerPath}.${name}`) as any;
    try {
      if (node?.getFocusIndex) return node.getFocusIndex();
      if (node?._focusIndex !== undefined) return node._focusIndex;
    } catch {
      /* noop */
    }
    return undefined;
  }

  protected _setChildFocusIndex(name: SectionKey, idx?: number) {
    if (idx === undefined) return;
    const node = this.tag(`${this.innerPath}.${name}`) as any;
    try {
      if (node?.setFocusIndex) node.setFocusIndex(idx);
      else if (node) node._focusIndex = idx;
    } catch {
      /* noop */
    }
  }

  // ======== TECLAS POR DEFECTO ========
  override _handleDown() {
    this.focusNext();
    return true;
  }

  override _handleUp() {
    this.focusPrev();
    return true;
  }

  // ======== NAVEGAR util ========
  protected navigate(path: string, params?: Record<string, any>) {
    this._syncHistorySnapshot(true); // 💾
    const base = path.replace(/^#?\/?/, "").toLowerCase();
    const target = params?.id
      ? `${base}/${encodeURIComponent(params.id)}`
      : base;

    if (params?.from == "header") {
      (Router as any)._resetNextPage = true;
    }
    (Router as any).navigate(target);
  }

  // ======== FOCUS INICIAL INTELIGENTE ========
  public _maybeInitFocus() {
    if (!this.autoInitialFocus) return;
    if (this.wasRestoredFromHistory) return;
    if (!this.sections.length) return;

    const desired = this._determineInitialSectionIndex();
    const safeIndex = Math.max(0, desired); // evita -1(Header) por defecto

    if (this._section !== safeIndex) {
      this._section = safeIndex;
      this._applyScrollForSection(this._section);
    } else {
      this._refocus();
    }
  }

  /** Heurística para sección inicial: prevFocus > Carussel > Hero > SearchInput > primera. */
  public _determineInitialSectionIndex(): number {
    const withPrev = this.sections.findIndex((name) => {
      const idx = this._getChildFocusIndex(name);
      return idx !== undefined && idx !== null;
    });
    if (withPrev >= 0) return withPrev;

    const idxCar = this._hasInnerTag("Carussel")
      ? this.sections.indexOf("Carussel")
      : -1;
    if (idxCar >= 0) return idxCar;

    const idxHero = this._hasInnerTag("Hero")
      ? this.sections.indexOf("Hero")
      : -1;
    if (idxHero >= 0) return idxHero;

    const idxSearch = this._hasInnerTag("SearchInput")
      ? this.sections.indexOf("SearchInput")
      : -1;
    if (idxSearch >= 0) return idxSearch;

    return 0;
  }

  private _hasInnerTag(name: string): boolean {
    try {
      return !!(this.tag(`${this.innerPath}.${name}`) as
        | L.Component
        | undefined);
    } catch {
      return false;
    }
  }
}
