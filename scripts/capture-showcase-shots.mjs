import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const BASE = process.env.SHOWCASE_BASE_URL || 'https://preview-wellstudio.miguelgarglez.com'
const OUT = path.join(root, 'modules/public/ui/showcase/assets')

const memberEmail = process.env.SHOWCASE_MEMBER_EMAIL || process.env.E2E_MEMBER_EMAIL
const memberPassword = process.env.SHOWCASE_MEMBER_PASSWORD || process.env.E2E_MEMBER_PASSWORD
const adminEmail = process.env.SHOWCASE_ADMIN_EMAIL || process.env.E2E_ADMIN_EMAIL
const adminPassword = process.env.SHOWCASE_ADMIN_PASSWORD || process.env.E2E_ADMIN_PASSWORD

if (!memberEmail || !memberPassword || !adminEmail || !adminPassword) {
  throw new Error('Missing showcase/E2E credentials in env')
}

await mkdir(OUT, { recursive: true })

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const only = process.env.SHOWCASE_ONLY // public | member | staff | all

function isBroken(text) {
  return /Application error|Digest:|RUTA PERDIDA/.test(text)
}

async function withSession(label, email, password, expectPath, run) {
  console.log('session', label)
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()

  async function saveShot(name) {
    await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: false })
    console.log('saved', name)
  }

  async function waitReady(readyText, timeoutMs = 45000) {
    if (!readyText) return true
    try {
      await page.getByText(readyText, { exact: false }).first().waitFor({ timeout: timeoutMs })
      return true
    } catch {
      return false
    }
  }

  async function shot(name, url, readyText, { reuseCurrent = false } = {}) {
    console.log('capturing', name, url)
    let lastError = null

    for (let attempt = 1; attempt <= 5; attempt++) {
      let response = null
      if (!(reuseCurrent && attempt === 1 && page.url().startsWith(url.split('?')[0]))) {
        response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 })
      }
      await page.waitForLoadState('networkidle', { timeout: 45000 }).catch(() => {})
      await page.waitForSelector('h1', { timeout: 45000 }).catch(() => {})
      const foundReady = await waitReady(readyText, 20000)
      await page.waitForTimeout(1200 + attempt * 400)

      const text = await page.locator('body').innerText().catch(() => '')
      const broken = isBroken(text)
      const ready = readyText ? text.includes(readyText) : text.length > 80

      if (!broken && ready) {
        await saveShot(name)
        return
      }

      lastError = `attempt=${attempt} status=${response?.status() ?? 'reuse'} url=${page.url()} broken=${broken} ready=${ready} foundReady=${foundReady}`
      console.log('retry', name, lastError)
      await page.waitForTimeout(1500 * attempt)
    }

    throw new Error(`Bad capture for ${name}: ${lastError}`)
  }

  if (email && password) {
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 90000 })
    await page.waitForLoadState('networkidle', { timeout: 45000 }).catch(() => {})
    await page.locator('input[type="email"], input[name="email"]').first().fill(email)
    await page.locator('input[type="password"]').first().fill(password)
    await page.locator('button[type="submit"]').first().click()
    await page.waitForURL(new RegExp(expectPath), { timeout: 90000 })
    await page.waitForLoadState('networkidle', { timeout: 45000 }).catch(() => {})
    await page.waitForTimeout(1500)
    console.log('logged in', page.url())
  }

  await run({ page, shot, saveShot, waitReady })
  await context.close()
}

if (!only || only === 'public' || only === 'all') {
  await withSession('public', null, null, null, async ({ page, shot }) => {
    await shot('public-home', `${BASE}/`, null)
    await shot('public-classes', `${BASE}/classes`, null)
    await shot('public-plans', `${BASE}/plans`, null)
    await page.goto(`${BASE}/#contacto`, { waitUntil: 'domcontentloaded', timeout: 90000 })
    await page.waitForLoadState('networkidle', { timeout: 45000 }).catch(() => {})
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
    await shot('member-home', `${BASE}/app`, 'BIENVENIDO', { reuseCurrent: true })
    await shot('member-reservations', `${BASE}/app/reservations`, 'Reservas')
    await shot('member-account', `${BASE}/app/account`, 'Cuenta')
  })
}

if (!only || only === 'staff' || only === 'all') {
  await withSession('staff', adminEmail, adminPassword, '/admin', async ({ page, shot, saveShot, waitReady }) => {
    // Prefer post-login page without re-navigation — re-goto /admin often 500s on Preview.
    console.log('capturing staff-overview (post-login)')
    let overviewOk = false
    for (let attempt = 1; attempt <= 5; attempt++) {
      await page.waitForLoadState('networkidle', { timeout: 45000 }).catch(() => {})
      await waitReady('CONTROL DE HOY', 25000)
      await page.waitForTimeout(1500)
      const text = await page.locator('body').innerText().catch(() => '')
      if (!isBroken(text) && text.includes('CONTROL DE HOY')) {
        await saveShot('staff-overview')
        overviewOk = true
        break
      }
      console.log('retry staff-overview post-login', attempt, 'broken=', isBroken(text))
      await page.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded', timeout: 90000 })
      await page.waitForTimeout(2000 * attempt)
    }
    if (!overviewOk) {
      await shot('staff-overview', `${BASE}/admin`, 'CONTROL DE HOY')
    }

    await shot('staff-sessions', `${BASE}/admin/sessions`, 'AGENDA DE SESIONES')
    await shot('staff-members', `${BASE}/admin/members`, 'GESTIÓN DE SOCIOS')
    await shot('staff-payments', `${BASE}/admin/payments`, 'COBROS')
  })
}

await browser.close()
console.log('done')
console.log('Next: node scripts/optimize-showcase-shots.mjs')
console.log('Tip: run pnpm sandbox:showcase-vitrina first for marketing-friendly Preview data.')
