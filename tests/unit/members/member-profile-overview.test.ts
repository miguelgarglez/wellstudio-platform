import { describe, expect, it } from 'vitest'

import { buildMemberProfileOverview } from '@/modules/members/server/member-profile-overview'

describe('buildMemberProfileOverview', () => {
  it('maps personal data, editable values and consent states into the profile view model', () => {
    const overview = buildMemberProfileOverview({
      firstName: 'María',
      lastName: 'WellStudio',
      email: 'maria@wellstudio.test',
      phone: null,
      birthDate: new Date('1992-06-14T00:00:00.000Z'),
      joinedAt: new Date('2026-03-10T09:00:00.000Z'),
      status: 'ACTIVE',
      updatedAt: new Date('2026-03-11T10:30:00.000Z'),
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
    expect(overview.editable).toEqual({
      firstName: 'María',
      lastName: 'WellStudio',
      phone: '',
      birthDate: '1992-06-14',
      updatedAtIso: '2026-03-11T10:30:00.000Z',
    })
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
