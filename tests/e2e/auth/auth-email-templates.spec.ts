import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { expect, test } from '@playwright/test'

const templateDirectory = resolve(process.cwd(), 'supabase/templates')

const templates = [
  {
    file: 'confirmation.html',
    heading: 'Confirma tu correo',
    action: 'Confirmar y entrar',
  },
  {
    file: 'recovery.html',
    heading: 'Nueva contraseña',
    action: 'Crear nueva contraseña',
  },
] as const

function renderTemplate(file: string) {
  return readFileSync(resolve(templateDirectory, file), 'utf8')
    .replace(/\{\{ \.RedirectTo \}\}/gu, 'https://wellstudio.miguelgarglez.com')
    .replace(/\{\{ \.TokenHash \}\}/gu, 'e2e-token-hash')
    .replace(/\{\{ \.Email \}\}/gu, 'socio@example.com')
    .replace(
      /\{\{ \.ConfirmationURL \}\}/gu,
      'https://wellstudio.miguelgarglez.com/reset-password?code=e2e-code',
    )
}

for (const template of templates) {
  test(`${template.file} renders a focused responsive email`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.setContent(renderTemplate(template.file))

    await expect(page.getByRole('heading', { level: 1, name: template.heading })).toBeVisible()
    await expect(page.getByRole('link', { name: template.action })).toBeVisible()
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(1)

    await page.screenshot({
      path: testInfo.outputPath(template.file.replace('.html', '-mobile.png')),
      fullPage: true,
    })
  })
}
