import { LegalPageShell } from '@/modules/public/ui/legal-page-shell'

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Condiciones"
      title="Condiciones de uso"
      description="Resumen básico de cómo debe usarse el acceso privado de WellStudio en esta primera versión pública."
    >
      <section>
        <h2>Objeto</h2>
        <p>
          Estas condiciones explican de forma breve cómo se usa el acceso privado de WellStudio y qué puede esperar el
          usuario en esta primera versión.
        </p>
      </section>

      <section>
        <h2>Uso del acceso privado</h2>
        <p>
          El acceso privado está pensado para que cada usuario gestione su cuenta y las acciones vinculadas al servicio
          que WellStudio vaya habilitando.
        </p>
        <p>
          Cada usuario debe mantener su contraseña de forma razonablemente segura y no compartir su acceso con otras
          personas.
        </p>
      </section>

      <section>
        <h2>Disponibilidad y cambios</h2>
        <p>
          WellStudio intentará mantener el servicio disponible, pero puede introducir cambios, mejoras o ajustes
          operativos cuando sea necesario para la evolución del producto o del centro.
        </p>
      </section>

      <section>
        <h2>Reservas y operativa del centro</h2>
        <p>
          Las reglas concretas sobre reservas, cancelaciones, planes o elegibilidad pueden depender de la operativa del
          centro y del tipo de servicio contratado en cada momento.
        </p>
        <p>
          Si existe alguna duda o incidencia, prevalecerá la información operativa comunicada directamente por
          WellStudio mientras esta V1 sigue madurando.
        </p>
      </section>

      <section>
        <h2>Contacto</h2>
        <p>
          Para dudas sobre el uso del acceso o sobre estas condiciones, puedes escribir a{' '}
          <a href="mailto:miguel.garglez@gmail.com">miguel.garglez@gmail.com</a>.
        </p>
      </section>

      <section>
        <h2>Estado de este texto</h2>
        <p>
          Estas condiciones son una base mínima y honesta para la V1. No pretenden sustituir todavía una redacción
          legal más completa, que podrá publicarse más adelante si el proyecto lo necesita.
        </p>
        <p>
          <strong>Última actualización:</strong> 17 de marzo de 2026
        </p>
      </section>
    </LegalPageShell>
  )
}
