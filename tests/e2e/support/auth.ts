import type { Page } from '@playwright/test'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import { AuthPage } from '../page-objects/auth-page'
import { getSandboxAdminCredentials, getSandboxCredentials, loadE2EEnvFiles } from './env'

loadE2EEnvFiles()

const execFileAsync = promisify(execFile)

export async function loginAsSandboxMember(page: Page) {
  const authPage = new AuthPage(page)
  const { email, password } = getSandboxCredentials()

  await authPage.gotoLogin()
  await authPage.fillLoginForm(email, password)
  await authPage.submitLogin()
  await authPage.expectProtectedMemberShell()
}

export async function loginAsSandboxAdmin(page: Page) {
  const authPage = new AuthPage(page)
  const { email, password } = getSandboxAdminCredentials()

  await page.goto('/admin')
  await authPage.fillLoginForm(email, password)
  await authPage.submitLogin()
  await page.waitForURL(/\/admin(?:\?.*)?$/, {
    timeout: 15_000,
  })
  await page.waitForLoadState('domcontentloaded')

  await page.goto('/admin')
  await authPage.expectAdminHomeVisible()
}

export async function ensureSandboxAdminAccess() {
  try {
    await execFileAsync('pnpm', ['sandbox:auth:admin'], {
      cwd: process.cwd(),
      env: process.env,
      timeout: 30_000,
    })
  } catch (error) {
    const details =
      error instanceof Error && 'stderr' in error && typeof error.stderr === 'string'
        ? error.stderr
        : error instanceof Error
          ? error.message
          : String(error)

    throw new Error(`Failed to provision sandbox admin access.\n${details}`)
  }
}
