/**
 * Capture real Preview screenshots for `/showcase`.
 *
 * Env: SHOWCASE_BASE_URL, SHOWCASE_ONLY=public|member|staff|all,
 * SHOWCASE_*_EMAIL/PASSWORD or E2E_* credentials.
 *
 * ---------------------------------------------------------------------------
 * Readiness waits (MIG-162 / showcase-capture-findings §7)
 * ---------------------------------------------------------------------------
 * Admin dashboards stream: HTTP 200 + AdminSectionShell (h1) arrive before the
 * Suspense body. Shell titles alone are NOT ready signals — loading.tsx and the
 * page share the same h1. Wait for BODY copy / aria-labels that only exist once
 * the dashboard resolves. Matching is case-insensitive (CSS `uppercase` makes
 * innerText UPPERCASE; DOM source is title-case).
 *
 * Empty skeletons use `.animate-pulse` and must not count as a good shot.
 *
 * Per-route markers (shell = header only; body = ready signal):
 *
 * | Shot               | Route                 | Shell (not enough)   | Body / aria ready                          |
 * |--------------------|-----------------------|----------------------|--------------------------------------------|
 * | staff-overview     | /admin                | Control de hoy       | Clases de hoy · Qué revisar ahora · [aria-label=Resumen operativo] |
 * | staff-sessions     | /admin/sessions       | Agenda de sesiones   | Operativa diaria · Nueva sesión · La agenda está vacía |
 * | staff-members      | /admin/members        | Gestión de socios    | Busca por identidad · Filtrar socios por estado |
 * | staff-payments     | /admin/payments       | Cobros               | Pagos recientes · Bandeja operativa · [aria-label=Monitor de cobros] |
 * | member-home        | /app                  | Bienvenido de nuevo  | Tu plan y créditos (hero alone streams early) |
 * | member-reservations| /app/reservations     | Tus reservas / Reservas | Tu actividad confirmada                 |
 * | member-account     | /app/account          | Cuenta y pagos       | Tarjeta vinculada · Pagos recientes        |
 *
 * Timeouts stay bounded (no multi-minute hangs): navigation ≤60s, networkidle
 * ≤20s soft, body ready ≤30s, ≤5 attempts with short backoff.
 */

import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const BASE = process.env.SHOWCASE_BASE_URL || 'https://preview-wellstudio.miguelgarglez.com'
const OUT = path.join(root, 'modules/public/ui/showcase/assets')

const NAV_TIMEOUT_MS = 60_000
const NETWORK_IDLE_MS = 20_000
const READY_TIMEOUT_MS = 30_000
const H1_TIMEOUT_MS = 20_000
const MAX_ATTEMPTS = 5

const memberEmail = process.env.SHOWCASE_MEMBER_EMAIL || process.env.E2E_MEMBER_EMAIL
const memberPassword = process.env.SHOWCASE_MEMBER_PASSWORD || process.env.E2E_MEMBER_PASSWORD
const adminEmail = process.env.SHOWCASE_ADMIN_EMAIL || process.env.E2E_ADMIN_EMAIL
const adminPassword = process.env.SHOWCASE_ADMIN_PASSWORD || process.env.E2E_ADMIN_PASSWORD

if (!memberEmail || !memberPassword || !adminEmail || !adminPassword) {
  throw new Error('Missing showcase/E2E credentials in env')
}

/** @typedef {{ patterns: RegExp[], ariaLabel?: string }} ReadySpec */

/** @type {Record<string, ReadySpec>} */
const READY = {
  'staff-overview': {
    patterns: [/clases de hoy/i, /qu[eé] revisar ahora/i],
    ariaLabel: 'Resumen operativo',
  },
  'staff-sessions': {
    patterns: [/operativa diaria/i, /nueva sesi[oó]n/i, /la agenda est[aá] vac[ií]a/i],
  },
  'staff-members': {
    patterns: [/busca por identidad/i, /filtrar socios por estado/i],
  },
  'staff-payments': {
    patterns: [/pagos recientes/i, /bandeja operativa/i],
    ariaLabel: 'Monitor de cobros',
  },
  'member-home': {
    patterns: [/tu plan y cr[eé]ditos/i],
  },
  'member-reservations': {
    patterns: [/tu actividad confirmada/i],
  },
  'member-account': {
    patterns: [/tarjeta vinculada/i, /pagos recientes/i],
  },
}

await mkdir(OUT, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const only = process.env.SHOWCASE_ONLY // public | member | staff | all

function isBroken(text) {
  return /Application error|Digest:|RUTA PERDIDA/i.test(text)
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Normalize ReadySpec | RegExp | string | null into a ReadySpec. */
function normalizeReady(ready) {
  if (!ready) return null
  if (typeof ready === 'object' && ready !== null && 'patterns' in ready) {
    return /** @type {ReadySpec} */ (ready)
  }
  if (ready instanceof RegExp) {
    return { patterns: [ready] }
  }
  if (typeof ready === 'string') {
    return { patterns: [new RegExp(escapeRegExp(ready), 'i')] }
  }
  return null
}

function matchesReadyText(text, spec) {
  return spec.patterns.some((pattern) => pattern.test(text))
}

async function hasVisibleSkeleton(page) {
  const pulsing = page.locator('.animate-pulse')
  const count = await pulsing.count()
  for (let i = 0; i < count; i++) {
    if (await pulsing.nth(i).isVisible().catch(() => false)) return true
  }
  return false
}

/**
 * Case-aware body readiness: positive text/aria match and no empty skeleton.
 * Returns false on timeout instead of hanging.
 */
async function waitReady(page, ready, timeoutMs = READY_TIMEOUT_MS) {
  const spec = normalizeReady(ready)
  if (!spec) return true

  const deadline = Date.now() + timeoutMs

  if (spec.ariaLabel) {
    const remaining = Math.max(500, deadline - Date.now())
    await page
      .getByLabel(spec.ariaLabel)
      .first()
      .waitFor({ state: 'visible', timeout: remaining })
      .catch(() => {})
  }

  while (Date.now() < deadline) {
    const text = await page.locator('body').innerText().catch(() => '')
    if (isBroken(text)) return false

    const bodyOk = matchesReadyText(text, spec)
    const skeleton = await hasVisibleSkeleton(page)

    if (bodyOk && !skeleton) return true

    await page.waitForTimeout(400)
  }

  return false
}

async function isPageReady(page, ready) {
  const spec = normalizeReady(ready)
  const text = await page.locator('body').innerText().catch(() => '')
  if (isBroken(text)) return { ok: false, broken: true, text }

  if (!spec) {
    return { ok: text.length > 80 && !(await hasVisibleSkeleton(page)), broken: false, text }
  }

  const bodyOk = matchesReadyText(text, spec)
  const skeleton = await hasVisibleSkeleton(page)
  return { ok: bodyOk && !skeleton, broken: false, text, bodyOk, skeleton }
}

async function withSession(label, email, password, expectPath, run) {
  console.log('session', label)
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()
  page.setDefaultNavigationTimeout(NAV_TIMEOUT_MS)
  page.setDefaultTimeout(READY_TIMEOUT_MS)

  async function saveShot(name) {
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false })
    console.log('saved', name)
  }

  async function shot(name, url, ready, { reuseCurrent = false } = {}) {
    console.log('capturing', name, url)
    let lastError = null
    const readySpec = ready ?? READY[name] ?? null

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      let response = null
      if (!(reuseCurrent && attempt === 1 && page.url().startsWith(url.split('?')[0]))) {
        response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS })
      }
      await page.waitForLoadState('networkidle', { timeout: NETWORK_IDLE_MS }).catch(() => {})
      await page.waitForSelector('h1', { timeout: H1_TIMEOUT_MS }).catch(() => {})
      const foundReady = await waitReady(page, readySpec, READY_TIMEOUT_MS)
      await page.waitForTimeout(800 + attempt * 300)

      const status = await isPageReady(page, readySpec)

      if (status.ok) {
        await saveShot(name)
        return
      }

      lastError = `attempt=${attempt} status=${response?.status() ?? 'reuse'} url=${page.url()} broken=${status.broken} bodyOk=${status.bodyOk ?? 'n/a'} skeleton=${status.skeleton ?? 'n/a'} foundReady=${foundReady}`
      console.log('retry', name, lastError)
      await page.waitForTimeout(1000 * attempt)
    }

    throw new Error(`Bad capture for ${name}: ${lastError}`)
  }

  if (email && password) {
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS })
    await page.waitForLoadState('networkidle', { timeout: NETWORK_IDLE_MS }).catch(() => {})
    await page.locator('input[type="email"], input[name="email"]').first().fill(email)
    await page.locator('input[type="password"]').first().fill(password)
    await page.locator('button[type="submit"]').first().click()
    await page.waitForURL(new RegExp(escapeRegExp(expectPath)), { timeout: NAV_TIMEOUT_MS })
    await page.waitForLoadState('networkidle', { timeout: NETWORK_IDLE_MS }).catch(() => {})
    await page.waitForTimeout(1200)
    console.log('logged in', page.url())
  }

  await run({ page, shot, saveShot, waitReady: (ready, timeoutMs) => waitReady(page, ready, timeoutMs) })
  await context.close()
}

if (!only || only === 'public' || only === 'all') {
  await withSession('public', null, null, null, async ({ page, shot }) => {
    await shot('public-home', `${BASE}/`, null)
    await shot('public-classes', `${BASE}/classes`, null)
    await shot('public-plans', `${BASE}/plans`, null)
    await page.goto(`${BASE}/#contacto`, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS })
    await page.waitForLoadState('networkidle', { timeout: NETWORK_IDLE_MS }).catch(() => {})
    await page.waitForTimeout(1000)
    const contact = page.locator('#contacto').first()
    if (await contact.count()) await contact.scrollIntoViewIfNeeded()
    await page.waitForTimeout(700)
    await page.screenshot({ path: path.join(OUT, 'public-lead.png'), fullPage: false })
    console.log('saved public-lead')
  })
}

if (!only || only === 'member' || only === 'all') {
  await withSession('member', memberEmail, memberPassword, '/app', async ({ shot }) => {
    await shot('member-home', `${BASE}/app`, READY['member-home'], { reuseCurrent: true })
    await shot('member-reservations', `${BASE}/app/reservations`, READY['member-reservations'])
    await shot('member-account', `${BASE}/app/account`, READY['member-account'])
  })
}

if (!only || only === 'staff' || only === 'all') {
  await withSession('staff', adminEmail, adminPassword, '/admin', async ({ page, shot, saveShot, waitReady: waitReadyOnPage }) => {
    // Prefer post-login page without re-navigation — re-goto /admin often 500s on Preview.
    console.log('capturing staff-overview (post-login)')
    let overviewOk = false
    const overviewReady = READY['staff-overview']

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      await page.waitForLoadState('networkidle', { timeout: NETWORK_IDLE_MS }).catch(() => {})
      await waitReadyOnPage(overviewReady, READY_TIMEOUT_MS)
      await page.waitForTimeout(1000)

      const status = await isPageReady(page, overviewReady)
      if (status.ok) {
        await saveShot('staff-overview')
        overviewOk = true
        break
      }

      console.log(
        'retry staff-overview post-login',
        attempt,
        `broken=${status.broken} bodyOk=${status.bodyOk} skeleton=${status.skeleton}`,
      )
      await page.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS })
      await page.waitForTimeout(1500 * attempt)
    }
    if (!overviewOk) {
      await shot('staff-overview', `${BASE}/admin`, overviewReady)
    }

    await shot('staff-sessions', `${BASE}/admin/sessions`, READY['staff-sessions'])
    await shot('staff-members', `${BASE}/admin/members`, READY['staff-members'])
    await shot('staff-payments', `${BASE}/admin/payments`, READY['staff-payments'])
  })
}

await browser.close()
console.log('done')
console.log('Next: node scripts/optimize-showcase-shots.mjs')
console.log('Tip: run pnpm sandbox:showcase-vitrina first for marketing-friendly Preview data.')
