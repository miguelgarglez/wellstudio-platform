import { isShowcaseRoutesEnabled } from '@/lib/deployment-environment'

export function PublicDemoNotice() {
  if (!isShowcaseRoutesEnabled()) return null

  return (
    <aside aria-label="Entorno de demostración" className="border-b border-black/10 bg-white/80 px-4 py-3 text-center text-sm text-[var(--foreground)]">
      Demo de portfolio · Agenda y perfiles sintéticos. Los pagos de demostración son
      simulados o de prueba; no representan cobros reales.
    </aside>
  )
}
