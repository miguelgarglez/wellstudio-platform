import { cn } from '@/lib/utils'
import type { OperationVisualLayout } from '@/modules/public/ui/showcase/showcase-operation-content'

const panelClass =
  'rounded-[1.25rem] border border-white/12 bg-white/[0.04] backdrop-blur-sm'

export function ShowcaseOperationPanel({ layout }: { layout: OperationVisualLayout }) {
  switch (layout) {
    case 'pain-stack':
      return <PainStackPanel />
    case 'models-table':
      return <ModelsTablePanel />
    case 'ownership-matrix':
      return <OwnershipMatrixPanel />
    case 'phases-timeline':
      return <PhasesTimelinePanel />
    case 'support-split':
      return <SupportSplitPanel />
    case 'variants-cards':
      return <VariantsCardsPanel />
    default:
      return null
  }
}

function PainStackPanel() {
  const items = [
    { label: 'Web y reservas', detail: 'Agenda pública, planes y formulario de contacto' },
    { label: 'Accesos y correos', detail: 'Login de socios y emails con la marca del centro' },
    { label: 'Cobros online', detail: 'Bonos y pagos con tarjeta, sin tocar datos bancarios en mostrador' },
  ]

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={item.label}
          className={cn(panelClass, 'flex items-center gap-4 px-5 py-4', index === 1 && 'border-[var(--wellstudio-blue)]/35 bg-[var(--wellstudio-blue)]/8')}
        >
          <span className="font-display text-2xl uppercase tracking-[0.06em] text-white/25">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div>
            <p className="font-medium text-white/90">{item.label}</p>
            <p className="mt-0.5 text-sm text-white/55">{item.detail}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function ModelsTablePanel() {
  const models = [
    {
      id: 'A',
      name: 'Todo gestionado',
      summary: 'Nosotros nos encargamos de toda la parte técnica. Vosotros solo usáis el panel del centro cada día.',
      when: 'Si no queréis entrar al panel de cobros',
      recommended: false,
    },
    {
      id: 'B',
      name: 'Híbrido',
      summary: 'Vosotros lleváis el día a día y veis los cobros. Nosotros mantenemos la web y el sistema por detrás.',
      when: 'Lo que recomendamos a la mayoría',
      recommended: true,
    },
    {
      id: 'C',
      name: 'Traspaso',
      summary: 'Tras la puesta en marcha, vuestro equipo o proveedor asume la operación técnica con nuestra documentación.',
      when: 'Solo si lo pedís expresamente',
      recommended: false,
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {models.map((model) => (
        <article
          key={model.id}
          className={cn(
            panelClass,
            'flex flex-col px-4 py-5 sm:px-5',
            model.recommended && 'border-[var(--wellstudio-blue)]/45 bg-[var(--wellstudio-blue)]/10 ring-1 ring-[var(--wellstudio-blue)]/25',
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-display text-3xl uppercase tracking-[0.04em] text-white/80">
              {model.id}
            </span>
            {model.recommended ? (
              <span className="rounded-full bg-[var(--wellstudio-blue)] px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.14em] text-[var(--wellstudio-ink)]">
                Recomendado
              </span>
            ) : null}
          </div>
          <h3 className="mt-3 font-display text-lg uppercase tracking-[0.04em] text-white">
            {model.name}
          </h3>
          <p className="mt-2 flex-1 text-sm leading-6 text-white/68">{model.summary}</p>
          <p className="mt-4 text-[0.68rem] uppercase tracking-[0.16em] text-white/42">
            {model.when}
          </p>
        </article>
      ))}
    </div>
  )
}

function OwnershipMatrixPanel() {
  const rows = [
    {
      area: 'Marca y cuenta de cobros',
      center: 'A vuestro nombre, con acceso para consultar',
      us: 'Configuramos y conectamos todo de forma segura',
    },
    {
      area: 'Operativa del centro',
      center: 'Agenda, socios, reservas y leads desde el panel',
      us: 'Mantenemos el sistema en marcha y lo actualizamos',
    },
    {
      area: 'Dinero que entra',
      center: 'Veis cobros y podéis gestionar devoluciones de negocio',
      us: 'Enlazamos pagos online sin que guardéis claves raras',
    },
    {
      area: 'Emails a socios',
      center: 'Revisáis textos y remitente (ej. hola@tucentro.com)',
      us: 'Nos aseguramos de que lleguen y no caigan en spam',
    },
  ]

  return (
    <div className={cn(panelClass, 'overflow-hidden')}>
      <div className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)] border-b border-white/10 bg-white/[0.03] text-[0.65rem] uppercase tracking-[0.16em] text-white/45">
        <div className="px-4 py-3 sm:px-5">Tema</div>
        <div className="border-l border-white/10 px-4 py-3 sm:px-5">Vuestro centro</div>
        <div className="border-l border-white/10 px-4 py-3 sm:px-5">WellStudio</div>
      </div>
      {rows.map((row) => (
        <div
          key={row.area}
          className="grid grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)] border-b border-white/8 last:border-b-0"
        >
          <div className="px-4 py-3.5 text-sm font-medium text-white/88 sm:px-5">{row.area}</div>
          <div className="border-l border-white/8 px-4 py-3.5 text-sm leading-6 text-white/62 sm:px-5">
            {row.center}
          </div>
          <div className="border-l border-white/8 px-4 py-3.5 text-sm leading-6 text-[var(--wellstudio-blue-soft)] sm:px-5">
            {row.us}
          </div>
        </div>
      ))}
    </div>
  )
}

function PhasesTimelinePanel() {
  const phases = [
    {
      id: '1',
      name: 'Preparación',
      detail: 'Recogemos datos del centro, cargamos planes y horarios, creamos cuentas del equipo',
    },
    {
      id: '2',
      name: 'Prueba en mostrador',
      detail: 'Agenda real durante 1–2 semanas; 2–3 socios de confianza; bonos dados desde recepción',
    },
    {
      id: '3',
      name: 'Revisión juntos',
      detail: 'Media hora para comprobar: ¿podéis operar solos un día normal?',
    },
    {
      id: '4',
      name: 'Cobros online',
      detail: 'Activamos pagos reales con el mismo grupo piloto — sin abrir a todo el mundo de golpe',
    },
    {
      id: '5',
      name: 'Apertura gradual',
      detail: 'Más socios, aviso al centro y soporte acordado mientras os adaptáis',
    },
  ]

  return (
    <div className="space-y-0">
      {phases.map((phase, index) => (
        <div key={phase.id} className="relative flex gap-4 pb-5 last:pb-0">
          {index < phases.length - 1 ? (
            <span
              aria-hidden="true"
              className="absolute left-[1.15rem] top-10 h-[calc(100%-1.25rem)] w-px bg-white/15"
            />
          ) : null}
          <div className="relative z-[1] flex size-9 shrink-0 items-center justify-center rounded-full border border-[var(--wellstudio-blue)]/40 bg-[var(--wellstudio-blue)]/15 font-display text-sm text-white">
            {phase.id}
          </div>
          <div className={cn(panelClass, 'flex-1 px-4 py-3.5 sm:px-5')}>
            <p className="font-display text-base uppercase tracking-[0.06em] text-white">{phase.name}</p>
            <p className="mt-1 text-sm leading-6 text-white/62">{phase.detail}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function SupportSplitPanel() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <article className={cn(panelClass, 'px-5 py-5')}>
        <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[var(--wellstudio-blue-soft)]">
          Incluido en la cuota
        </p>
        <ul className="mt-4 space-y-2.5 text-sm leading-6 text-white/75">
          <li>Web y sistema siempre disponibles</li>
          <li>Arreglar fallos y caídas</li>
          <li>Actualizaciones de seguridad y mantenimiento</li>
          <li>Respuesta en el horario acordado</li>
        </ul>
      </article>
      <article className={cn(panelClass, 'px-5 py-5')}>
        <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/45">
          Presupuesto aparte
        </p>
        <ul className="mt-4 space-y-2.5 text-sm leading-6 text-white/62">
          <li>Funciones nuevas que no existían</li>
          <li>Cambios grandes de diseño o marca</li>
          <li>Conectar con otras herramientas</li>
          <li>Informes o automatizaciones a medida</li>
        </ul>
      </article>
    </div>
  )
}

function VariantsCardsPanel() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <article className={cn(panelClass, 'px-5 py-5')}>
        <p className="font-display text-lg uppercase tracking-[0.04em] text-white">A · Todo gestionado</p>
        <p className="mt-2 text-sm leading-6 text-white/65">
          El día a día en el panel es igual. La diferencia: no entráis al panel de cobros; os enviamos resúmenes o los veis desde el mostrador digital.
        </p>
      </article>
      <article className={cn(panelClass, 'px-5 py-5')}>
        <p className="font-display text-lg uppercase tracking-[0.04em] text-white">C · Traspaso</p>
        <p className="mt-2 text-sm leading-6 text-white/65">
          Entregamos documentación, accesos y una ventana de acompañamiento. Solo si el centro quiere asumir la parte técnica con su propio proveedor.
        </p>
      </article>
    </div>
  )
}
