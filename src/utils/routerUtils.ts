// src/utils/routerUtils.ts
import { Router } from '@lightningjs/sdk'

export function getActiveRouteName(fallback = 'home'): string {
  const route = (Router as any).getActiveRoute?.()
  const raw =
    route?.hash ??
    (Router as any).getActiveHash?.() ??
    (Router as any).getUrl?.() ??
    (typeof window !== 'undefined' ? window.location.hash : '')

  const name = String(raw)
    .replace(/^#?\/?/, '')
    .split('/')[0]
    ?.toLowerCase()

  return name || fallback
}
