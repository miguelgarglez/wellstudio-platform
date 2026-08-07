export function PublicScheduleSkeleton() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 pb-8 pt-12 sm:px-6 sm:pt-16 lg:px-8 lg:pt-20">
      <div className="grid gap-8 border-b border-border/60 pb-10 lg:grid-cols-[1.15fr_0.55fr]">
        <div><div className="h-4 w-36 rounded-full bg-muted" /><div className="mt-5 h-24 max-w-3xl rounded-[1.5rem] bg-muted/80" /></div>
        <div className="h-36 rounded-[1.5rem] bg-white/70" />
      </div>
      <div className="mt-10 space-y-5">
        {[0, 1].map((group) => <div key={group} className="grid gap-5 rounded-[1.65rem] bg-white/70 p-5 lg:grid-cols-[11rem_1fr]"><div className="h-16 rounded-xl bg-muted/70" /><div className="space-y-3">{[0, 1, 2].map((row) => <div key={row} className="h-20 rounded-[1rem] bg-muted/60" />)}</div></div>)}
      </div>
    </div>
  )
}
