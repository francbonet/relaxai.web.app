// src/utils/routerUtils.ts
import { Router } from "@lightningjs/sdk";
import { TileData } from "../atoms/Tile";
export type SectionRoute =
  | "home"
  | "suggest"
  | "breathe"
  | "longform"
  | "search";

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
  ];
  return allowed.includes(s as SectionRoute) ? (s as SectionRoute) : null;
}

export function extractIdFromHash(): string | null {
  if (typeof window === "undefined") return null;
  // hash format: #/<section>/detail/<id> o #/<id>
  const segs = window.location.hash.replace(/^#\/?/, "").split("/");
  return segs[3] ? decodeURIComponent(segs[3]) : segs[1] || null;
}

/** Cerca un item per id dins d’una col·lecció o dins d’un objecte amb seccions */
export function resolveById<T>(
  id: string | number | null,
  data: readonly T[] | Record<string, readonly T[]>,
  getId: (item: T) => string | number
): T | null {
  if (!id) return null;
  const s = String(id);

  // Si és un array pla → cerca directe
  if (Array.isArray(data)) {
    return data.find((it) => String(getId(it)) === s) ?? null;
  }

  // Si és un objecte amb seccions → busca dins de cada secció
  for (const section of Object.values(data)) {
    const found = section.find((it: any) => String(getId(it)) === s);
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
