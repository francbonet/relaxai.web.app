/* eslint-disable no-undef */
// scripts/build-es5.mjs
// 2-pass build to ES5: esbuild (ES2015 IIFE) -> Babel (downlevel)

import { existsSync, cpSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import { build } from 'esbuild'
import { spawnSync } from 'child_process'

// Permet forçar entrada: ENTRY=src/index.ts npm run build:es5
const fromEnv = process.env.ENTRY && process.env.ENTRY.trim()

// ▶︎ entrada de l’APP (no el loader)
const candidates = ['src/index.ts']

function pickEntry() {
  if (fromEnv) {
    const p = resolve(fromEnv)
    if (!existsSync(p)) {
      console.error(`[build-es5] ENTRY no trobat: ${p}`)
      process.exit(1)
    }
    return p
  }
  for (const rel of candidates) {
    const p = resolve(rel)
    if (existsSync(p)) return p
  }
  console.error(
    "[build-es5] No s'ha trobat cap entry d'APP.\n" +
      'Prova amb: ENTRY=path/al/fitxer npm run build:es5\n' +
      `Candidats:\n - ${candidates.join('\n - ')}`,
  )
  process.exit(1)
}

const entry = pickEntry()
console.log(`[build-es5] Entrada APP: ${entry}`)

// 1) ESBUILD → ES2015 (IIFE), sense baixar a ES5
const interm = 'build/app.bundle.es2015.js'
await build({
  entryPoints: [entry],
  outfile: interm,
  bundle: true,
  format: 'iife', // elimina require()
  target: ['es2015'], // 👈 no intentes Chrome 44 aquí
  minify: false,
  legalComments: 'none',
  define: { 'process.env.NODE_ENV': '"production"' },
  publicPath: '/static/',
  loader: {
    '.ts': 'ts',
    '.json': 'json',
    '.png': 'file',
    '.jpg': 'file',
    '.jpeg': 'file',
    '.svg': 'file',
    '.ttf': 'file',
  },
})
console.log('[build-es5] ES2015 IIFE →', interm)

// 2) BABEL → ES5 (sense polyfills, sense modules)
const out = 'build/app.bundle.js'
const configPath = resolve(process.cwd(), 'babel.config.es5.json')

if (!existsSync(configPath)) {
  console.error('[build-es5] No trobo babel.config.es5.json a:', configPath)
  process.exit(1)
}

const babelArgs = [
  'babel',
  interm,
  '-o',
  out,
  '--no-babelrc',
  '--config-file',
  configPath, // 👉 ruta absoluta
]

const r = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', babelArgs, {
  stdio: 'inherit',
  cwd: process.cwd(),
})

if (r.status !== 0) {
  console.error('[build-es5] Babel ha fallat')
  process.exit(r.status || 1)
}

console.log('[build-es5] ES5 final →', out)

const staticSrc = resolve(process.cwd(), 'static')
const buildDst = resolve(process.cwd(), 'build')

if (existsSync(staticSrc)) {
  // assegura build/
  if (!existsSync(buildDst)) mkdirSync(buildDst, { recursive: true })

  // copia TOT (recursivament)
  cpSync(staticSrc, buildDst, { recursive: true })

  console.log('[build-es5] Copiat TOTS els assets de static/ → build/')
} else {
  console.warn('[build-es5] AVÍS: no existeix la carpeta static/. Res a copiar.')
}
