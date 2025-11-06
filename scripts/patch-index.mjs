import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'

const src = resolve('public', 'index.html')
const destDir = resolve('build')
const dest = resolve(destDir, 'index.html')

if (!existsSync(src)) {
  console.error("[copy-public-index] No s'ha trobat public/index.html")
  // eslint-disable-next-line no-undef
  process.exit(1)
}

if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true })

copyFileSync(src, dest)
console.log('[copy-public-index] Copiat public/index.html -> build/index.html')
