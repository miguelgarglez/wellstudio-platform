import { LegalPageShell } from '@/modules/public/ui/legal-page-shell'

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Condiciones"
      title="Condiciones de uso"
      description="Condiciones esenciales que regulan el acceso y el uso inicial del área privada de WellStudio."
      currentPath="/terms"
      lastUpdated="17 de marzo de 2026"
      contactEmail="miguel.garglez@gmail.com"
    >
      <section>
        <h2>Objeto y alcance</h2>
        <p>
          Estas condiciones regulan el acceso y el uso básico del área privada de WellStudio en la fase actual del
          servicio.
        </p>
      </section>

      <section>
        <h2>Uso del acceso privado</h2>
        <p>
          El área privada está destinada a que cada usuario gestione su cuenta y las funcionalidades que WellStudio
          habilite en cada momento dentro de la plataforma.
        </p>
        <p>
          Cada persona usuaria es responsable de custodiar su contraseña y de no compartir sus credenciales de acceso
          con terceros.
        </p>
      </section>

      <section>
        <h2>Disponibilidad del servicio</h2>
        <p>
          WellStudio procurará mantener la plataforma disponible y operativa, aunque podrá introducir cambios, mejoras,
          interrupciones puntuales o ajustes cuando resulten necesarios para la evolución del producto o de la
          actividad del centro.
        </p>
      </section>

      <section>
        <h2>Operativa del centro y servicios</h2>
        <p>
          Las condiciones concretas aplicables a reservas, cancelaciones, planes, acceso a servicios o criterios de
          elegibilidad podrán depender de la operativa del centro y del servicio contratado en cada momento.
        </p>
        <p>
          En caso de duda o incidencia operativa, prevalecerá la información comunicada directamente por WellStudio a
          la persona usuaria por los canales habituales de atención.
        </p>
      </section>

      <section>
        <h2>Contacto</h2>
        <p>
          Para consultas sobre el acceso, el uso de la plataforma o estas condiciones, puedes escribir a{' '}
          <a href="mailto:miguel.garglez@gmail.com">miguel.garglez@gmail.com</a>.
        </p>
      </section>

      <section>
        <h2>Vigencia y actualización</h2>
        <p>
          Estas condiciones recogen la regulación esencial aplicable a la versión actual del servicio. WellStudio podrá
          revisarlas o ampliarlas cuando la evolución del proyecto, la operativa o las necesidades legales lo hagan
          conveniente.
        </p>
        <p>
          <strong>Última actualización:</strong> 17 de marzo de 2026
        </p>
      </section>
    </LegalPageShell>
  )
}
