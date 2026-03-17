import { LegalPageShell } from '@/modules/public/ui/legal-page-shell'

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      eyebrow="Privacidad"
      title="Política de privacidad"
      description="Versión mínima y honesta de la información de privacidad que acompaña al registro y a los formularios de WellStudio en esta fase inicial."
    >
      <section>
        <h2>Responsable</h2>
        <p>
          En esta primera versión pública, WellStudio actúa como responsable del tratamiento básico de los datos que
          introduces en sus formularios y en el área privada.
        </p>
        <p>
          Si necesitas cualquier aclaración, puedes escribir a{' '}
          <a href="mailto:miguel.garglez@gmail.com">miguel.garglez@gmail.com</a>.
        </p>
      </section>

      <section>
        <h2>Qué datos recogemos</h2>
        <p>Podemos recoger datos básicos como nombre, apellidos, email, teléfono y la información necesaria para crear y gestionar tu acceso.</p>
        <p>
          Si utilizas el área privada, también podemos tratar información relacionada con tu cuenta, accesos y
          operaciones necesarias para que el servicio funcione correctamente.
        </p>
      </section>

      <section>
        <h2>Para qué usamos esos datos</h2>
        <p>Usamos estos datos para finalidades básicas de servicio, por ejemplo:</p>
        <ul>
          <li>crear y proteger tu cuenta</li>
          <li>enviarte correos de confirmación o recuperación de contraseña</li>
          <li>atender solicitudes de contacto o seguimiento</li>
          <li>mantener la operativa básica del servicio</li>
        </ul>
      </section>

      <section>
        <h2>Con quién compartimos datos</h2>
        <p>
          No publicamos tus datos ni los usamos para finalidades ajenas al servicio. Para operar la plataforma podemos
          apoyarnos en proveedores técnicos como alojamiento, autenticación o envío de correo.
        </p>
      </section>

      <section>
        <h2>Tus derechos y contacto</h2>
        <p>
          Si quieres consultar, corregir o pedir la eliminación de tus datos dentro de lo razonable para esta fase del
          proyecto, puedes escribir a <a href="mailto:miguel.garglez@gmail.com">miguel.garglez@gmail.com</a>.
        </p>
      </section>

      <section>
        <h2>Estado de este texto</h2>
        <p>
          Esta política es una base pública mínima para la V1. Está pensada para ser clara y honesta, y podrá
          refinarse cuando WellStudio cierre una versión legal más completa.
        </p>
        <p>
          <strong>Última actualización:</strong> 17 de marzo de 2026
        </p>
      </section>
    </LegalPageShell>
  )
}
