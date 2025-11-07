import { Router } from "@lightningjs/sdk";
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
  const segs = window.location.hash.replace(/^#\/?/, "").split("/");
  return segs[3] ? decodeURIComponent(segs[3]) : segs[1] || null;
}

// export function resolveById<T>(
//   id: string | number | null,
//   data: readonly T[],
//   getId: (item: T) => string | number,
// ): T | null;
// export function resolveById<T>(
//   id: string | number | null,
//   data: Record<string, readonly T[] | undefined>,
//   getId: (item: T) => string | number,
// ): T | null;

export function resolveById<T>(
  id: string | number | null,
  data: readonly T[] | Record<string, readonly T[] | undefined>,
  getId: (item: T) => string | number,
): T | null {
  if (id == null) return null;
  const s = String(id);

  if (Array.isArray(data)) {
    return data.find((it) => String(getId(it)) === s) ?? null;
  }

  for (const section of Object.values(data)) {
    if (!section || !Array.isArray(section)) continue;
    const found = section.find((it) => String(getId(it)) === s);
    if (found) return found;
  }

  return null;
}

/*
export function makeHydrator<T>(
  items: readonly T[],
  getId: (item: T) => string | number,
) {
  return (id: string | null) => resolveById(id, items, getId);
}
*/
