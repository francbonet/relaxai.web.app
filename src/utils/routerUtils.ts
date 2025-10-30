// src/utils/routerUtils.ts
import { Router } from "@lightningjs/sdk";
import { TileData } from "../atoms/Tile";
export type SectionRoute =
  | "home"
  | "suggest"
  | "breathe"
  | "longform"
  | "search"
  | "watchlist";

export function getActiveRouteName(fallback = "home"): string {
  const route = (Router as any).getActiveRoute?.();
  const raw =
    route?.hash ??
    (Router as any).getActiveHash?.() ??
    (Router as any).getUrl?.() ??
    (typeof window !== "undefined" ? window.location.hash : "");

  const name = String(raw)
    .replace(/^#?\/?/, "")
    .split("/")[0]
    ?.toLowerCase();

  return name || fallback;
}

export function sanitizeSection(v: any): SectionRoute | null {
  const s = String(v ?? "").toLowerCase();
  const allowed: SectionRoute[] = [
    "home",
    "suggest",
    "breathe",
    "longform",
    "search",
    "watchlist",
  ];
  return allowed.includes(s as SectionRoute) ? (s as SectionRoute) : null;
}

export function extractIdFromHash(): string | null {
  if (typeof window === "undefined") return null;
  // hash format: #/<section>/detail/<id> o #/<id>
  const segs = window.location.hash.replace(/^#\/?/, "").split("/");
  return segs[3] ? decodeURIComponent(segs[3]) : segs[1] || null;
}

/** Overloads para tipado más preciso */
export function resolveById<T>(
  id: string | number | null,
  data: readonly T[],
  getId: (item: T) => string | number
): T | null;
export function resolveById<T>(
  id: string | number | null,
  data: Record<string, readonly T[] | undefined>,
  getId: (item: T) => string | number
): T | null;

/** Implementación */
export function resolveById<T>(
  id: string | number | null,
  data: readonly T[] | Record<string, readonly T[] | undefined>,
  getId: (item: T) => string | number
): T | null {
  if (id == null) return null;
  const s = String(id);

  // Array plano → búsqueda directa
  if (Array.isArray(data)) {
    return data.find((it) => String(getId(it)) === s) ?? null;
  }

  // Objeto con secciones (algunas pueden ser undefined)
  for (const section of Object.values(data)) {
    if (!section || !Array.isArray(section)) continue;
    const found = section.find((it) => String(getId(it)) === s);
    if (found) return found;
  }

  return null;
}

/** Variante “curried” per crear un hidratador amb la teva col·lecció */
export function makeHydrator<T>(
  items: readonly T[],
  getId: (item: T) => string | number
) {
  return (id: string | null) => resolveById(id, items, getId);
}
