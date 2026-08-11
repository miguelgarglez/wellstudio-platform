import { describe, expect, it } from 'vitest'

import {
  SANDBOX_REDIRECT_URLS,
  SANDBOX_SITE_URL,
  buildChanges,
  buildDesiredSandboxUrlConfig,
  mergeUriAllowList,
  parseOptions,
  splitUriAllowList,
} from '../../../scripts/auth/ensure-hosted-auth-urls.mjs'

describe('hosted sandbox auth URL configuration', () => {
  it('requires sandbox environment and a valid project ref', () => {
    expect(() => parseOptions(['--project-ref=short', '--environment=sandbox'])).toThrow(
      'project ref válido',
    )
    expect(() =>
      parseOptions(['--project-ref=ighrofdvwpqoyozjisyr', '--environment=production']),
    ).toThrow('sandbox')
  })

  it('keeps apply confirmation separate from the target', () => {
    expect(
      parseOptions([
        '--project-ref=ighrofdvwpqoyozjisyr',
        '--environment=sandbox',
        '--apply',
        '--confirm-project-ref=ighrofdvwpqoyozjisyr',
      ]),
    ).toEqual({
      projectRef: 'ighrofdvwpqoyozjisyr',
      environment: 'sandbox',
      apply: true,
      confirmProjectRef: 'ighrofdvwpqoyozjisyr',
    })
  })

  it('includes the stable Preview host in the required allowlist', () => {
    expect(SANDBOX_SITE_URL).toBe('http://localhost:3000')
    expect(SANDBOX_REDIRECT_URLS).toContain('https://preview-wellstudio.miguelgarglez.com/**')
    expect(SANDBOX_REDIRECT_URLS).toContain(
      'https://*-miguel-garcias-projects-38f9bf81.vercel.app/**',
    )
  })

  it('merges required Preview URLs without dropping existing entries', () => {
    const merged = mergeUriAllowList(
      'http://localhost:3000/auth/confirm,https://example.test/**',
      SANDBOX_REDIRECT_URLS,
    )

    expect(splitUriAllowList(merged)).toEqual(
      expect.arrayContaining([
        'http://localhost:3000/auth/confirm',
        'https://example.test/**',
        'https://preview-wellstudio.miguelgarglez.com/**',
      ]),
    )
  })

  it('patches only Site URL / allowlist when Preview host is missing', () => {
    const current = {
      site_url: 'http://localhost:3000',
      uri_allow_list: 'http://localhost:3000/auth/confirm',
      unrelated_auth_setting: true,
    }
    const desired = buildDesiredSandboxUrlConfig(current)

    expect(buildChanges(current, desired)).toEqual({
      uri_allow_list: desired.uri_allow_list,
    })
    expect(desired.uri_allow_list).toContain('https://preview-wellstudio.miguelgarglez.com/**')
  })
})
