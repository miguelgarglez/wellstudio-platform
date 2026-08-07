import { describe, expect, it } from 'vitest'

import {
  buildCancellationStatus,
  buildHistoryStatus,
  buildMemberBookingState,
  buildMemberReservationsOverview,
  buildScheduleAvailability,
} from '@/modules/reservations/server/member-reservations-overview'

describe('member reservations overview helpers', () => {
  it('builds booking state for ready, pending and blocked scenarios', () => {
    expect(
      buildMemberBookingState({
        currentMembershipName: 'Fuerza Base',
        pendingMembershipName: null,
        creditsRemaining: 0,
      }).reason,
    ).toBe('ready')

    expect(
      buildMemberBookingState({
        currentMembershipName: null,
        pendingMembershipName: 'Premium',
        creditsRemaining: 0,
      }).reason,
    ).toBe('pending-plan')

    expect(
      buildMemberBookingState({
        currentMembershipName: null,
        pendingMembershipName: null,
        creditsRemaining: 0,
      }).reason,
    ).toBe('no-entitlement')

    expect(
      buildMemberBookingState({
        memberStatus: 'BLOCKED',
        currentMembershipName: 'Premium',
        pendingMembershipName: null,
        creditsRemaining: 10,
      }),
    ).toMatchObject({
      canBook: false,
      reason: 'member-unavailable',
      advisoryLabel: 'Cuenta de socio bloqueada',
    })
  })

  it('derives cancellation labels with a 120 minute cutoff', () => {
    expect(
      buildCancellationStatus(
        new Date('2026-04-01T18:00:00.000Z'),
        new Date('2026-04-01T14:30:00.000Z'),
      ),
    ).toMatchObject({ tone: 'allowed' })

    expect(
      buildCancellationStatus(
        new Date('2026-04-01T18:00:00.000Z'),
        new Date('2026-04-01T16:15:00.000Z'),
      ),
    ).toEqual({
      label: 'Fuera de ventana de cancelación',
      tone: 'blocked',
    })
  })

  it('derives availability and history labels for operational UI', () => {
    expect(
      buildScheduleAvailability({
        capacity: 10,
        reservedCount: 8,
        waitlistEnabled: true,
      }),
    ).toEqual({
      availabilityLabel: '2 plazas libres',
      framingLabel: 'Reserva próximamente',
    })

    expect(
      buildScheduleAvailability({
        capacity: 4,
        reservedCount: 4,
        waitlistEnabled: true,
      }),
    ).toEqual({
      availabilityLabel: 'Clase completa',
      framingLabel: 'Waitlist disponible si se llena',
    })

    expect(buildHistoryStatus('ATTENDED')).toEqual({
      label: 'Asistida',
      tone: 'allowed',
    })
    expect(buildHistoryStatus('CANCELED')).toEqual({
      label: 'Cancelada',
      tone: 'neutral',
    })
    expect(buildHistoryStatus('NO_SHOW')).toEqual({
      label: 'No asististe',
      tone: 'blocked',
    })
  })
})

describe('buildMemberReservationsOverview', () => {
  it('keeps history available but blocks every new schedule action for inactive members', () => {
    const overview = buildMemberReservationsOverview({
      memberStatus: 'INACTIVE',
      upcomingReservations: [],
      activeWaitlists: [],
      recentHistory: [],
      memberships: [],
      creditAccounts: [],
      publishedSessions: [{
        id: 'session-1',
        startsAt: new Date('2026-04-05T18:00:00.000Z'),
        endsAt: new Date('2026-04-05T18:50:00.000Z'),
        locationLabel: 'Sala 1',
        capacity: 10,
        reservedCount: 4,
        waitlistEnabled: true,
        status: 'PUBLISHED',
        classType: { name: 'Fuerza', eligibilityRules: [] },
        coach: null,
      }] as Parameters<typeof buildMemberReservationsOverview>[0]['publishedSessions'],
      now: new Date('2026-04-03T10:00:00.000Z'),
    })

    expect(overview.bookingState.reason).toBe('member-unavailable')
    expect(overview.schedulePreview[0]?.sessions[0]?.primaryAction).toEqual({
      kind: 'blocked',
      label: 'Cuenta inactiva',
      description: 'Contacta con el centro para reactivar nuevas reservas.',
    })
  })

  it('maps real reservation data into an operational dashboard overview', () => {
    const now = new Date('2026-03-31T10:00:00.000Z')

    const overview = buildMemberReservationsOverview({
      upcomingReservations: [
        {
          id: 'reservation-1',
          classSession: {
            startsAt: new Date('2026-03-31T18:45:00.000Z'),
            endsAt: new Date('2026-03-31T19:30:00.000Z'),
            locationLabel: 'Sala principal',
            capacity: 10,
            reservedCount: 7,
            waitlistEnabled: true,
            classType: { name: 'Grupo Dinámico' },
            coach: { displayName: 'Pablo García' },
          },
        },
      ] as Parameters<typeof buildMemberReservationsOverview>[0]['upcomingReservations'],
      activeWaitlists: [
        {
          id: 'waitlist-1',
          position: 2,
          classSession: {
            startsAt: new Date('2026-04-01T18:45:00.000Z'),
            endsAt: new Date('2026-04-01T19:30:00.000Z'),
            locationLabel: 'Sala premium',
            capacity: 4,
            reservedCount: 4,
            waitlistEnabled: true,
            classType: { name: 'Grupo Premium' },
            coach: { displayName: 'Gabriel Mozos' },
          },
        },
      ] as Parameters<typeof buildMemberReservationsOverview>[0]['activeWaitlists'],
      recentHistory: [
        {
          id: 'history-1',
          status: 'ATTENDED',
          classSession: {
            startsAt: new Date('2026-03-25T07:15:00.000Z'),
            endsAt: new Date('2026-03-25T08:00:00.000Z'),
            locationLabel: 'Sala principal',
            capacity: 10,
            reservedCount: 8,
            waitlistEnabled: true,
            classType: { name: 'Grupo Dinámico' },
            coach: { displayName: 'Pablo García' },
          },
        },
      ] as Parameters<typeof buildMemberReservationsOverview>[0]['recentHistory'],
      publishedSessions: [
        {
          id: 'session-1',
          startsAt: new Date('2026-03-31T18:45:00.000Z'),
          endsAt: new Date('2026-03-31T19:30:00.000Z'),
          locationLabel: 'Sala principal',
          capacity: 10,
          reservedCount: 8,
          waitlistEnabled: true,
          status: 'PUBLISHED',
          classType: {
            name: 'Grupo Dinámico',
            eligibilityRules: [],
          },
          coach: { displayName: 'Pablo García' },
        },
        {
          id: 'session-2',
          startsAt: new Date('2026-03-31T20:00:00.000Z'),
          endsAt: new Date('2026-03-31T20:45:00.000Z'),
          locationLabel: 'Sala premium',
          capacity: 4,
          reservedCount: 4,
          waitlistEnabled: true,
          status: 'PUBLISHED',
          classType: {
            name: 'Grupo Premium',
            eligibilityRules: [],
          },
          coach: { displayName: 'Gabriel Mozos' },
        },
        {
          id: 'session-3',
          startsAt: new Date('2026-04-01T07:15:00.000Z'),
          endsAt: new Date('2026-04-01T08:00:00.000Z'),
          locationLabel: 'Sala principal',
          capacity: 10,
          reservedCount: 5,
          waitlistEnabled: false,
          status: 'PUBLISHED',
          classType: {
            name: 'Grupo Dinámico',
            eligibilityRules: [],
          },
          coach: { displayName: 'Pablo García' },
        },
      ] as Parameters<typeof buildMemberReservationsOverview>[0]['publishedSessions'],
      memberships: [],
      creditAccounts: [],
      now,
    })

    expect(overview.bookingState.reason).toBe('no-entitlement')
    expect(overview.summaryLabels).toEqual([
      '1 reserva próxima',
      '3 sesiones publicadas',
      '1 waitlist activa',
    ])

    expect(overview.upcomingReservations[0]).toMatchObject({
      className: 'Grupo Dinámico',
      availabilityLabel: '3 plazas libres',
      cancellationTone: 'allowed',
      canCancel: true,
    })

    expect(overview.activeWaitlists[0]).toMatchObject({
      className: 'Grupo Premium',
      positionLabel: 'Posición 2',
      availabilityLabel: 'Waitlist disponible si se llena',
    })

    expect(overview.recentHistory[0]).toMatchObject({
      statusLabel: 'Asistida',
      statusTone: 'allowed',
    })

    expect(overview.schedulePreview).toHaveLength(2)
    expect(overview.schedulePreview[0].sessions).toHaveLength(2)
    expect(overview.schedulePreview[1].sessions[0]).toMatchObject({
      availabilityLabel: '5 plazas libres',
      framingLabel: 'Reserva próximamente',
      primaryAction: {
        kind: 'blocked',
        label: 'Sin regla activa',
      },
    })
  })
})
