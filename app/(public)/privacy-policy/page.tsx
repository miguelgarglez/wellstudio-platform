import { LegalPageShell } from '@/modules/public/ui/legal-page-shell'
import { PUBLIC_CONTACT_EMAIL } from '@/modules/public/content/public-contact'

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      eyebrow="Privacidad"
      title="Política de privacidad"
      description="Información esencial sobre cómo WellStudio recoge, utiliza y protege los datos personales asociados al registro, al acceso privado y al uso básico de la plataforma."
      currentPath="/privacy-policy"
      lastUpdated="17 de marzo de 2026"
      contactEmail={PUBLIC_CONTACT_EMAIL}
    >
      <section>
        <h2>Responsable</h2>
        <p>
          WellStudio es responsable del tratamiento de los datos personales que facilitas a través de sus formularios,
          del proceso de registro y del acceso privado disponible en esta plataforma.
        </p>
        <p>
          Para cualquier consulta relacionada con privacidad o protección de datos, puedes escribir a{' '}
          <a href={`mailto:${PUBLIC_CONTACT_EMAIL}`}>{PUBLIC_CONTACT_EMAIL}</a>.
        </p>
      </section>

      <section>
        <h2>Qué datos recogemos</h2>
        <p>
          Podemos recoger datos identificativos y de contacto como nombre, apellidos, correo electrónico, teléfono y
          cualquier otra información necesaria para crear, proteger y administrar tu cuenta.
        </p>
        <p>
          Si utilizas el área privada, también podemos tratar información relacionada con tu cuenta, tus accesos y las
          operaciones necesarias para que el servicio funcione correctamente.
        </p>
      </section>

      <section>
        <h2>Finalidad del tratamiento</h2>
        <p>Tratamos estos datos con finalidades operativas y de servicio, entre ellas:</p>
        <ul>
          <li>gestionar el alta, acceso y seguridad de tu cuenta</li>
          <li>enviarte comunicaciones técnicas necesarias, como confirmaciones o recuperación de contraseña</li>
          <li>atender solicitudes de contacto, soporte o seguimiento comercial vinculado al servicio</li>
          <li>mantener la operativa básica y la mejora progresiva de la plataforma</li>
        </ul>
      </section>

      <section>
        <h2>Proveedores y terceros</h2>
        <p>
          WellStudio no vende ni publica tus datos personales. Para prestar el servicio puede apoyarse en proveedores
          técnicos necesarios para alojamiento, autenticación, base de datos o envío de correo electrónico.
        </p>
      </section>

      <section>
        <h2>Derechos de las personas usuarias</h2>
        <p>
          Puedes solicitar información sobre los datos asociados a tu cuenta, así como pedir su corrección o su
          eliminación cuando proceda, escribiendo a{' '}
          <a href={`mailto:${PUBLIC_CONTACT_EMAIL}`}>{PUBLIC_CONTACT_EMAIL}</a>.
        </p>
      </section>

      <section>
        <h2>Alcance de esta política</h2>
        <p>
          Esta política recoge la información esencial aplicable a la fase actual del proyecto. WellStudio podrá
          ampliarla o actualizarla cuando el servicio, el marco operativo o las necesidades legales lo requieran.
        </p>
        <p>
          <strong>Última actualización:</strong> 17 de marzo de 2026
        </p>
      </section>
    </LegalPageShell>
  )
}
