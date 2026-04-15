import { describe, expect, it } from 'vitest'

import { buildMemberProfileOverview } from '@/modules/members/server/member-profile-overview'

describe('buildMemberProfileOverview', () => {
  it('maps personal data and consent states into a read-only profile view model', () => {
    const overview = buildMemberProfileOverview({
      fullName: 'María WellStudio',
      email: 'maria@wellstudio.test',
      phone: null,
      birthDate: new Date('1992-06-14T00:00:00.000Z'),
      joinedAt: new Date('2026-03-10T09:00:00.000Z'),
      status: 'ACTIVE',
      consents: [
        {
          id: 'consent-1',
          consentType: 'TERMS',
          accepted: true,
          acceptedAt: new Date('2026-03-10T09:00:00.000Z'),
          createdAt: new Date('2026-03-10T08:50:00.000Z'),
        },
        {
          id: 'consent-2',
          consentType: 'MARKETING',
          accepted: false,
          acceptedAt: null,
          createdAt: new Date('2026-03-10T08:50:00.000Z'),
        },
      ],
    })

    expect(overview.fullName).toBe('María WellStudio')
    expect(overview.phoneLabel).toBe('Sin teléfono')
    expect(overview.statusLabel).toBe('Socio activo')
    expect(overview.consents).toEqual([
      {
        id: 'consent-1',
        label: 'Términos',
        statusLabel: 'Aceptado',
        detailLabel: 'Registrado el 10 mar 2026',
      },
      {
        id: 'consent-2',
        label: 'Marketing',
        statusLabel: 'Pendiente',
        detailLabel: 'Sin aceptación registrada',
      },
    ])
  })
})
