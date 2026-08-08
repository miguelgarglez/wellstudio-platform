import type { PublicScheduleSession } from '@/modules/public/server/public-schedule'

export type PublicScheduleFilters = {
  classType: string | null
  coach: string | null
}

export type PublicScheduleFilterOption = {
  value: string
  label: string
  sessionCount: number
}

type PublicScheduleGroup = {
  key: string
  weekday: string
  dateLabel: string
  sessions: PublicScheduleSession[]
}

export function buildPublicScheduleFilterOptions(groups: PublicScheduleGroup[]) {
  const sessions = groups.flatMap((group) => group.sessions)

  return {
    classTypes: buildOptions(sessions, (session) => ({
      value: session.classTypeSlug,
      label: session.classTypeName,
    })),
    coaches: buildOptions(sessions, (session) => ({
      value: session.coachId,
      label: session.coachName,
    })),
  }
}

export function normalizePublicScheduleFilters(
  filters: PublicScheduleFilters,
  options: ReturnType<typeof buildPublicScheduleFilterOptions>,
): PublicScheduleFilters {
  return {
    classType: options.classTypes.some((option) => option.value === filters.classType)
      ? filters.classType
      : null,
    coach: options.coaches.some((option) => option.value === filters.coach)
      ? filters.coach
      : null,
  }
}

export function filterPublicScheduleGroups(
  groups: PublicScheduleGroup[],
  filters: PublicScheduleFilters,
) {
  return groups.flatMap((group) => {
    const sessions = group.sessions.filter(
      (session) =>
        (!filters.classType || session.classTypeSlug === filters.classType) &&
        (!filters.coach || session.coachId === filters.coach),
    )

    return sessions.length ? [{ ...group, sessions }] : []
  })
}

function buildOptions(
  sessions: PublicScheduleSession[],
  select: (session: PublicScheduleSession) => { value: string; label: string },
) {
  const values = new Map<string, PublicScheduleFilterOption>()

  for (const session of sessions) {
    const option = select(session)
    const current = values.get(option.value)

    values.set(option.value, {
      ...option,
      sessionCount: (current?.sessionCount ?? 0) + 1,
    })
  }

  return [...values.values()].sort((left, right) =>
    left.label.localeCompare(right.label, 'es', { sensitivity: 'base' }),
  )
}
