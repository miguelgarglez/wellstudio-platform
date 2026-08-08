import { expect, test } from '@playwright/test'

import { loginAsSandboxMember } from '../support/auth'
import {
  getMissingSandboxAuthEnv,
  hasSandboxCredentials,
  isSandboxAuthEnabled,
} from '../support/env'
import {
  hasMemberProfileDatabase,
  prepareMemberProfileFixture,
  restoreMemberProfileFixture,
} from '../support/member-profile'

test.describe('Member profile editing @sandbox @members', () => {
  test.describe.configure({ mode: 'serial' })

  const setupIssue = !isSandboxAuthEnabled() || !hasSandboxCredentials()
    ? getMissingSandboxAuthEnv().join(', ')
    : !hasMemberProfileDatabase()
      ? 'DATABASE_URL is required'
      : null

  test.skip(Boolean(setupIssue), setupIssue ?? 'Member profile sandbox suite is enabled.')

  let snapshot: Awaited<ReturnType<typeof prepareMemberProfileFixture>> | null = null

  test.beforeAll(async () => {
    snapshot = await prepareMemberProfileFixture()
  })

  test.afterAll(async () => {
    if (snapshot) await restoreMemberProfileFixture(snapshot)
  })

  test.beforeEach(async ({ page }) => {
    await loginAsSandboxMember(page)
    await page.goto('/app/profile')
    await expect(page.getByRole('heading', { name: 'Tus datos' })).toBeVisible()
  })

  test('member edits personal data and sees it persisted after reload', async ({ page }) => {
    await page.getByRole('button', { name: 'Editar datos' }).click()

    const dialog = page.getByRole('dialog', { name: 'Editar tu perfil' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Email de acceso')).toBeVisible()

    await dialog.getByLabel('Nombre').fill('E2E Perfil')
    await dialog.getByLabel('Apellidos').fill('Actualizado')
    await dialog.getByLabel('Teléfono').fill('699 123 456')
    await dialog.getByLabel('Fecha de nacimiento').fill('1991-05-04')
    await page.screenshot({ path: 'test-results/member-profile-editor-desktop.png' })
    await dialog.getByRole('button', { name: 'Guardar cambios' }).click()

    await expect(dialog).toBeHidden()
    await expect(page.getByRole('status').filter({ hasText: 'Perfil actualizado' })).toBeVisible()
    const main = page.locator('#main-content')
    await expect(main.getByText('E2E Perfil Actualizado', { exact: true })).toBeVisible()
    await expect(main.getByText('699123456', { exact: true })).toBeVisible()
    await page.screenshot({ path: 'test-results/member-profile-success-desktop.png' })

    await page.reload()
    await expect(main.getByText('E2E Perfil Actualizado', { exact: true })).toBeVisible()
    await expect(main.getByText('699123456', { exact: true })).toBeVisible()
    await expect(main.getByText(/4 may 1991/i)).toBeVisible()

    await page.screenshot({ path: 'test-results/member-profile-desktop.png', fullPage: true })
  })

  test('profile editor remains focused and overflow-free on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.reload()
    await page.getByRole('button', { name: 'Editar datos' }).click()

    const dialog = page.getByRole('dialog', { name: 'Editar tu perfil' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Guardar cambios' })).toBeVisible()

    const horizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    )
    expect(horizontalOverflow).toBe(false)

    const box = await dialog.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(390)

    await page.waitForTimeout(250)
    await page.screenshot({ path: 'test-results/member-profile-mobile.png' })

    await dialog.getByLabel('Teléfono').fill('123')
    await dialog.getByRole('button', { name: 'Guardar cambios' }).click()
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Escribe un teléfono válido de entre 9 y 15 dígitos.')).toBeVisible()
    await page.screenshot({ path: 'test-results/member-profile-validation-mobile.png' })
  })
})
