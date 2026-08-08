import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

const templateDirectory = resolve(process.cwd(), 'supabase/templates')

function readTemplate(name: string) {
  return readFileSync(resolve(templateDirectory, name), 'utf8')
}

describe('Supabase auth email templates', () => {
  it('preserves the SSR confirmation contract', () => {
    const html = readTemplate('confirmation.html')

    expect(html).toContain('{{ .RedirectTo }}/auth/confirm')
    expect(html).toContain('token_hash={{ .TokenHash }}')
    expect(html).toContain('type=email')
    expect(html).toContain('next=/app')
    expect(html).toContain('email={{ .Email }}')
    expect(html).toContain('Confirmar mi acceso')
  })

  it('preserves the validated recovery link', () => {
    const html = readTemplate('recovery.html')

    expect(html).toContain('href="{{ .ConfirmationURL }}"')
    expect(html).toContain('Restablecer contraseña')
  })

  it.each(['confirmation.html', 'recovery.html'])('%s stays deliverability-focused', (name) => {
    const html = readTemplate(name)

    expect(html.match(/<a\b/gu)).toHaveLength(1)
    expect(html).not.toMatch(/<(script|img|video|form)\b/iu)
    expect(html).not.toMatch(/https?:\/\//iu)
    expect(Buffer.byteLength(html)).toBeLessThan(12_000)
  })
})
