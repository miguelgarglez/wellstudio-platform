import type { Page } from '@playwright/test'

import { AuthPage } from '../page-objects/auth-page'
import { getSandboxCredentials, loadE2EEnvFiles } from './env'

loadE2EEnvFiles()

export async function loginAsSandboxMember(page: Page) {
  const authPage = new AuthPage(page)
  const { email, password } = getSandboxCredentials()

  await authPage.gotoLogin()
  await authPage.fillLoginForm(email, password)
  await authPage.submitLogin()
  await authPage.expectProtectedMemberShell()
}
