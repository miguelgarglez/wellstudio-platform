export function PublicPlansSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 pb-8 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20">
      <div className="grid gap-8 border-b border-border/60 pb-10 lg:grid-cols-[1.15fr_0.55fr]">
        <div><div className="h-4 w-32 rounded-full bg-muted" /><div className="mt-5 h-28 max-w-3xl rounded-[1.5rem] bg-muted/80" /></div>
        <div className="h-32 rounded-[1.5rem] bg-white/65" />
      </div>
      <div className="mt-12 h-14 w-64 rounded-[1rem] bg-muted/70" />
      <div className="mt-6 grid gap-4 lg:grid-cols-2">{[0, 1].map((item) => <div key={item} className="h-72 rounded-[1.65rem] bg-white/70" />)}</div>
      <div className="mt-12 h-72 rounded-[2rem] bg-[var(--wellstudio-ink)]/90" />
    </div>
  )
}
