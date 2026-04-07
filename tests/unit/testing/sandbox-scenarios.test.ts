import { describe, expect, it } from 'vitest'

import {
  buildMemberReservationsFlowSessionBlueprints,
  buildMemberReservationsFlowTimeline,
  MEMBER_RESERVATIONS_FLOW_PREFIX,
  MEMBER_RESERVATIONS_FLOW_SESSION_KEYS,
} from '@/modules/testing/server/sandbox-scenarios/member-reservations-flow.mjs'
import {
  extractProjectRef,
  isManagedScenarioEmail,
} from '@/modules/testing/server/sandbox-scenarios/shared.mjs'

describe('sandbox scenario helpers', () => {
  it('accepts only managed sandbox scenario emails', () => {
    expect(isManagedScenarioEmail('e2e.member.sandbox@wellstudio.test')).toBe(true)
    expect(isManagedScenarioEmail('e2e.member.flow.sandbox@wellstudio.test')).toBe(true)
    expect(isManagedScenarioEmail('miguel.garglez@gmail.com')).toBe(false)
    expect(isManagedScenarioEmail('e2e.member.local@wellstudio.test')).toBe(false)
  })

  it('extracts the sandbox project ref from the Supabase URL', () => {
    expect(extractProjectRef('https://abc123.supabase.co')).toBe('abc123')
  })

  it('builds deterministic relative timestamps for the member reservations flow', () => {
    const now = new Date('2026-04-03T10:00:00.000Z')
    const timeline = buildMemberReservationsFlowTimeline(now)

    expect(timeline.available.startsAt.getDate()).toBe(4)
    expect(timeline.available.startsAt.getHours()).toBe(18)
    expect(timeline.available.startsAt.getMinutes()).toBe(0)

    expect(timeline.cancelable.startsAt.getDate()).toBe(5)
    expect(timeline.cancelable.startsAt.getHours()).toBe(18)
    expect(timeline.cancelable.startsAt.getMinutes()).toBe(30)

    expect(timeline.fullWaitlist.startsAt.getDate()).toBe(6)
    expect(timeline.fullWaitlist.startsAt.getHours()).toBe(19)
    expect(timeline.fullWaitlist.startsAt.getMinutes()).toBe(0)

    expect(timeline.attended.startsAt.getDate()).toBe(1)
    expect(timeline.attended.startsAt.getHours()).toBe(18)
    expect(timeline.attended.startsAt.getMinutes()).toBe(15)

    expect(timeline.canceled.startsAt.getDate()).toBe(30)
    expect(timeline.canceled.startsAt.getHours()).toBe(18)
    expect(timeline.canceled.startsAt.getMinutes()).toBe(45)

    expect(timeline.noShow.startsAt.getDate()).toBe(28)
    expect(timeline.noShow.startsAt.getHours()).toBe(19)
    expect(timeline.noShow.startsAt.getMinutes()).toBe(15)
  })

  it('uses a stable managed prefix for all canonical sessions', () => {
    expect(Object.values(MEMBER_RESERVATIONS_FLOW_SESSION_KEYS)).toHaveLength(6)

    for (const label of Object.values(MEMBER_RESERVATIONS_FLOW_SESSION_KEYS) as string[]) {
      expect(label.startsWith(MEMBER_RESERVATIONS_FLOW_PREFIX)).toBe(true)
    }
  })

  it('builds deterministic session blueprints with final reserved counts', () => {
    const blueprints = buildMemberReservationsFlowSessionBlueprints(
      new Date('2026-04-03T10:00:00.000Z'),
    )

    expect(blueprints.available.reservedCount).toBe(0)
    expect(blueprints.cancelable.reservedCount).toBe(1)
    expect(blueprints.fullWaitlist.reservedCount).toBe(1)
    expect(blueprints.attended.reservedCount).toBe(1)
    expect(blueprints.canceled.reservedCount).toBe(0)
    expect(blueprints.noShow.reservedCount).toBe(1)

    expect(blueprints.available.status).toBe('PUBLISHED')
    expect(blueprints.fullWaitlist.waitlistEnabled).toBe(true)
    expect(blueprints.attended.status).toBe('COMPLETED')
    expect(blueprints.canceled.locationLabel).toBe(
      MEMBER_RESERVATIONS_FLOW_SESSION_KEYS.canceled,
    )
  })
})
