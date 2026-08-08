'use client'

import { useEffect, useState } from 'react'
import { Check, ChevronDown, SlidersHorizontal, UserRound, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
  buildPublicScheduleFilterOptions,
  filterPublicScheduleGroups,
  normalizePublicScheduleFilters,
  type PublicScheduleFilterOption,
  type PublicScheduleFilters,
} from '@/modules/public/lib/public-schedule-filters'
import type { PublicScheduleSession } from '@/modules/public/server/public-schedule'
import { PublicSessionRow } from '@/modules/public/ui/schedule/public-schedule-elements'

type PublicScheduleGroup = {
  key: string
  weekday: string
  dateLabel: string
  sessions: PublicScheduleSession[]
}

export function PublicScheduleExplorer({
  groups,
  initialFilters,
}: {
  groups: PublicScheduleGroup[]
  initialFilters: PublicScheduleFilters
}) {
  const options = buildPublicScheduleFilterOptions(groups)
  const [filters, setFilters] = useState(() =>
    normalizePublicScheduleFilters(initialFilters, options),
  )
  const filteredGroups = filterPublicScheduleGroups(groups, filters)
  const filteredCount = filteredGroups.reduce(
    (total, group) => total + group.sessions.length,
    0,
  )
  const hasActiveFilters = Boolean(filters.classType || filters.coach)
  const classTypeLabel =
    options.classTypes.find((option) => option.value === filters.classType)?.label ??
    'Todas las clases'
  const coachLabel =
    options.coaches.find((option) => option.value === filters.coach)?.label ??
    'Todos los coaches'

  useEffect(() => {
    const url = new URL(window.location.href)

    updateSearchParam(url, 'class', filters.classType)
    updateSearchParam(url, 'coach', filters.coach)
    window.history.replaceState(window.history.state, '', url)
  }, [filters])

  function setFilter(key: keyof PublicScheduleFilters, value: string | null) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  return (
    <>
      <section
        aria-labelledby="schedule-filters-title"
        className="mt-10 rounded-[1.65rem] border border-white/80 bg-white/74 p-4 shadow-[0_18px_55px_rgba(17,19,22,0.055)] backdrop-blur sm:p-5"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[var(--wellstudio-blue-deep)]">
              <SlidersHorizontal className="size-4" aria-hidden="true" />
              <p
                id="schedule-filters-title"
                className="text-xs uppercase tracking-[0.22em]"
              >
                Filtrar agenda
              </p>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Afina la agenda por entrenamiento o por la persona que dirige la sesión.
            </p>
          </div>

          <p className="text-sm text-muted-foreground" aria-live="polite" aria-atomic="true">
            <strong className="font-medium text-[var(--wellstudio-ink)]">{filteredCount}</strong>{' '}
            {filteredCount === 1 ? 'sesión encontrada' : 'sesiones encontradas'}
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <ScheduleFilterPopover
            label="Tipo de clase"
            valueLabel={classTypeLabel}
            options={options.classTypes}
            selectedValue={filters.classType}
            allLabel="Todas las clases"
            onSelect={(value) => setFilter('classType', value)}
          />
          <ScheduleFilterPopover
            label="Coach"
            valueLabel={coachLabel}
            options={options.coaches}
            selectedValue={filters.coach}
            allLabel="Todos los coaches"
            onSelect={(value) => setFilter('coach', value)}
            icon="coach"
          />
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              className="h-14 justify-center gap-2 rounded-[1rem] px-5 text-[var(--wellstudio-blue-deep)] sm:col-span-2 lg:col-span-1"
              onClick={() => setFilters({ classType: null, coach: null })}
            >
              <X className="size-4" aria-hidden="true" />
              Limpiar filtros
            </Button>
          ) : null}
        </div>
      </section>

      {filteredGroups.length ? (
        <div
          key={`${filters.classType ?? 'all'}:${filters.coach ?? 'all'}`}
          className="mt-5 space-y-5 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 motion-safe:duration-200"
        >
          {filteredGroups.map((group) => (
            <section
              key={group.key}
              aria-labelledby={`schedule-${group.key}`}
              className="grid gap-4 rounded-[1.65rem] border border-white/75 bg-white/70 p-4 shadow-[0_20px_55px_rgba(17,19,22,0.055)] backdrop-blur sm:p-5 lg:grid-cols-[11rem_minmax(0,1fr)] lg:gap-6"
            >
              <header className="lg:sticky lg:top-28 lg:self-start">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--wellstudio-blue-deep)]">
                  {group.weekday}
                </p>
                <h2
                  id={`schedule-${group.key}`}
                  className="mt-1 font-display text-3xl uppercase leading-none text-[var(--wellstudio-ink)]"
                >
                  {group.dateLabel}
                </h2>
              </header>
              <div className="divide-y divide-[color:color-mix(in_srgb,var(--border)_72%,white)]">
                {group.sessions.map((session) => (
                  <PublicSessionRow key={session.id} session={session} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <FilteredScheduleEmptyState onClear={() => setFilters({ classType: null, coach: null })} />
      )}
    </>
  )
}

function ScheduleFilterPopover({
  label,
  valueLabel,
  options,
  selectedValue,
  allLabel,
  onSelect,
  icon = 'filters',
}: {
  label: string
  valueLabel: string
  options: PublicScheduleFilterOption[]
  selectedValue: string | null
  allLabel: string
  onSelect: (value: string | null) => void
  icon?: 'filters' | 'coach'
}) {
  const [open, setOpen] = useState(false)

  function select(value: string | null) {
    onSelect(value)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'group flex h-14 min-w-0 items-center justify-between gap-3 rounded-[1rem] border bg-white/74 px-4 text-left outline-none transition-[border-color,background-color,box-shadow] duration-200 hover:bg-white focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue)] motion-reduce:transition-none',
          selectedValue
            ? 'border-[color:color-mix(in_srgb,var(--wellstudio-blue)_40%,var(--border))] shadow-[0_8px_24px_rgba(79,137,197,0.08)]'
            : 'border-border/85',
        )}
        aria-label={`${label}: ${valueLabel}`}
      >
        <span className="min-w-0">
          <span className="block text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
            {label}
          </span>
          <span className="mt-0.5 block truncate text-sm font-medium text-[var(--wellstudio-ink)]">
            {valueLabel}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-[var(--wellstudio-blue-deep)]">
          {icon === 'coach' ? <UserRound className="size-4" aria-hidden="true" /> : null}
          <ChevronDown
            className="size-4 transition-transform duration-200 group-data-[popup-open]:rotate-180 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </span>
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="w-[min(22rem,calc(100vw-2rem))] rounded-[1.2rem] p-2">
        <PopoverHeader className="px-2 pb-1 pt-1">
          <PopoverTitle>{label}</PopoverTitle>
          <PopoverDescription>Selecciona una opción para actualizar la agenda.</PopoverDescription>
        </PopoverHeader>
        <div className="grid gap-1" role="listbox" aria-label={label}>
          <FilterOption
            label={allLabel}
            selected={!selectedValue}
            onSelect={() => select(null)}
          />
          {options.map((option) => (
            <FilterOption
              key={option.value}
              label={option.label}
              sessionCount={option.sessionCount}
              selected={selectedValue === option.value}
              onSelect={() => select(option.value)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function FilterOption({
  label,
  sessionCount,
  selected,
  onSelect,
}: {
  label: string
  sessionCount?: number
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      className={cn(
        'flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-[0.8rem] px-3 py-2 text-left text-sm outline-none transition-colors hover:bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_7%,white)] focus-visible:ring-2 focus-visible:ring-[var(--wellstudio-blue)]',
        selected && 'bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]',
      )}
      onClick={onSelect}
    >
      <span className="font-medium">{label}</span>
      <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
        {sessionCount === undefined ? null : sessionCount}
        <span className="grid size-5 place-items-center" aria-hidden="true">
          {selected ? <Check className="size-4" /> : null}
        </span>
      </span>
    </button>
  )
}

function FilteredScheduleEmptyState({ onClear }: { onClear: () => void }) {
  return (
    <section className="mt-5 grid min-h-[20rem] place-items-center rounded-[1.7rem] border border-dashed border-[color:color-mix(in_srgb,var(--wellstudio-blue)_22%,var(--border))] bg-white/60 p-8 text-center">
      <div className="max-w-lg">
        <span className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,white)] text-[var(--wellstudio-blue-deep)]">
          <SlidersHorizontal aria-hidden="true" />
        </span>
        <h2 className="mt-5 font-display text-4xl uppercase">No hay sesiones con estos filtros</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Prueba otra combinación o vuelve a ver toda la agenda publicada.
        </p>
        <Button type="button" variant="outline" className="mt-6 rounded-full px-5" onClick={onClear}>
          Ver toda la agenda
        </Button>
      </div>
    </section>
  )
}

function updateSearchParam(url: URL, key: string, value: string | null) {
  if (value) url.searchParams.set(key, value)
  else url.searchParams.delete(key)
}
