#!/usr/bin/env node
/**
 * Optimizes showcase capture assets for deck thumbnails and lightbox full view.
 *
 * Requires: cwebp (brew install webp), sips (macOS built-in).
 * Run after capture-showcase-shots.mjs:
 *   node scripts/optimize-showcase-shots.mjs
 *
 * Outputs per shot:
 *   {name}-thumb.webp  — 960px wide, q80 (~50–150 KB) for deck panels
 *   {name}.webp        — full capture, q85 for lightbox
 *
 * Source PNGs are kept as archival captures; imports should use the WebP variants.
 */
import { execFile } from 'node:child_process'
import { readdir, stat, unlink } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ASSETS = path.join(__dirname, '../modules/public/ui/showcase/assets')

const THUMB_WIDTH = 960
const THUMB_QUALITY = 80
const FULL_QUALITY = 85

async function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

async function hasCommand(name) {
  try {
    await execFileAsync('which', [name])
    return true
  } catch {
    return false
  }
}

async function optimizePng(pngPath) {
  const base = path.basename(pngPath, '.png')
  const thumbWebp = path.join(ASSETS, `${base}-thumb.webp`)
  const fullWebp = path.join(ASSETS, `${base}.webp`)
  const tempThumb = path.join(ASSETS, `.${base}-thumb-temp.png`)

  const before = (await stat(pngPath)).size

  await execFileAsync('sips', ['-Z', String(THUMB_WIDTH), pngPath, '--out', tempThumb])
  await execFileAsync('cwebp', ['-q', String(THUMB_QUALITY), tempThumb, '-o', thumbWebp])
  await execFileAsync('cwebp', ['-q', String(FULL_QUALITY), pngPath, '-o', fullWebp])
  await unlink(tempThumb).catch(() => {})

  const thumbSize = (await stat(thumbWebp)).size
  const fullSize = (await stat(fullWebp)).size

  console.log(
    `${base}: PNG ${await formatSize(before)} → thumb ${await formatSize(thumbSize)}, full ${await formatSize(fullSize)}`,
  )

  return { base, before, thumbSize, fullSize }
}

const hasCwebp = await hasCommand('cwebp')
if (!hasCwebp) {
  console.error('cwebp not found. Install with: brew install webp')
  process.exit(1)
}

const files = (await readdir(ASSETS))
  .filter((f) => f.endsWith('.png') && !f.includes('-thumb'))
  .sort()

if (files.length === 0) {
  console.error('No PNG captures found in', ASSETS)
  process.exit(1)
}

console.log(`Optimizing ${files.length} showcase shots in ${ASSETS}\n`)

const results = []
for (const file of files) {
  results.push(await optimizePng(path.join(ASSETS, file)))
}

const totalBefore = results.reduce((sum, r) => sum + r.before, 0)
const totalThumb = results.reduce((sum, r) => sum + r.thumbSize, 0)
const totalFull = results.reduce((sum, r) => sum + r.fullSize, 0)

console.log(
  `\nTotals: PNG ${await formatSize(totalBefore)} → thumbs ${await formatSize(totalThumb)}, full webp ${await formatSize(totalFull)}`,
)
console.log('done')
