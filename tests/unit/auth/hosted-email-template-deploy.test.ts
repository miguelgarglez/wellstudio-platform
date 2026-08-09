import { describe, expect, it } from 'vitest'

import {
  buildChanges,
  buildDesiredConfig,
  parseOptions,
} from '../../../scripts/auth/apply-hosted-email-templates.mjs'

describe('hosted auth email template deployment', () => {
  it('requires an explicit environment and valid project ref', () => {
    expect(() => parseOptions(['--project-ref=short', '--environment=sandbox'])).toThrow(
      'project ref válido',
    )
    expect(() => parseOptions(['--project-ref=ighrofdvwpqoyozjisyr', '--environment=staging'])).toThrow(
      'sandbox o production',
    )
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

  it('builds environment-specific subjects from versioned templates', async () => {
    const sandbox = await buildDesiredConfig('sandbox')
    const production = await buildDesiredConfig('production')

    expect(sandbox.mailer_subjects_confirmation).toBe('[DEV] WellStudio: confirma tu acceso')
    expect(production.mailer_subjects_confirmation).toBe('WellStudio: confirma tu acceso')
    expect(sandbox.mailer_templates_confirmation_content).toContain('{{ .TokenHash }}')
    expect(sandbox.mailer_templates_recovery_content).toContain('{{ .ConfirmationURL }}')
  })

  it('patches only values that differ from hosted config', () => {
    const desired = {
      mailer_subjects_confirmation: 'Confirmation',
      mailer_templates_confirmation_content: '<p>confirmation</p>',
      mailer_subjects_recovery: 'Recovery',
      mailer_templates_recovery_content: '<p>recovery</p>',
    }

    expect(
      buildChanges(
        {
          ...desired,
          mailer_subjects_recovery: 'Old recovery',
          unrelated_auth_setting: true,
        },
        desired,
      ),
    ).toEqual({ mailer_subjects_recovery: 'Recovery' })
  })
})
