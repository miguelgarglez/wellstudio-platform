# Gym intake checklist

Fecha: 2026-08-12  
Uso: una sola lista para pedir al centro. Nosotros cableamos; el gym rellena datos, no configura paneles técnicos.  
Playbook: [gym-onboarding-handoff.md](./gym-onboarding-handoff.md)

## Cómo usarlo

1. Enviar esta lista al contacto del gym (o rellenarla juntos en 30–45 min).
2. Marcar cada bloque cuando esté **recibido y usable**.
3. No pedir al gym que cree webhooks, variables Vercel ni SMTP en Supabase.

## 1. Ownership y accesos (modelo B por defecto)

- [ ] Confirmado modelo operativo: **B Híbrido** (u otra variante por escrito)
- [ ] Titular del dominio (quién paga el DNS / registrar)
- [ ] Titular de la cuenta Stripe (negocio del gym)
- [ ] Titular Resend / dominio de email (negocio del gym o nuestro temporal hasta cutover)
- [ ] Contacto operativo del gym (nombre, email, WhatsApp)
- [ ] Contacto técnico nuestro para secretos y deploys
- [ ] Canal de soporte acordado (un solo canal)

Notas de acceso modelo B:

- Gym: Stripe Dashboard (lectura + operaciones comerciales), `/admin` del producto
- Nosotros: Vercel, Supabase, API keys, webhooks, DB

## 2. Dominio y DNS

- [ ] Dominio final de la app (ej. `app.wellstudio…` o el que acuerden)
- [ ] Acceso DNS o contacto que pueda crear registros (CNAME / A según Vercel)
- [ ] Confirmación de si el dominio marketing actual (si existe) redirige o convive

Tras intake, nosotros:

- [ ] Custom domain en Vercel Production
- [ ] `NEXT_PUBLIC_APP_URL` Production = dominio final
- [ ] Supabase Production `Site URL` + Redirect URLs al dominio final

## 3. Email / SMTP / marca en correo

- [ ] Dominio desde el que deben salir los correos (ej. `wellstudio.example` o subdominio `auth.` / `mail.`)
- [ ] Remitente deseado (nombre: `WellStudio`; email: `no-reply@…`)
- [ ] Quién verifica el dominio en Resend (nosotros con acceso, o gym)
- [ ] Inbox staff para leads / avisos operativos
- [ ] Lista de emails que deben recibir notificaciones de lead

Tras intake, nosotros:

- [ ] Dominio verificado en Resend (prod)
- [ ] Custom SMTP en Supabase production
- [ ] Plantillas auth **sin** prefijo `[DEV]`
- [ ] Probar register / reset en Production

## 4. Stripe (prep Wave 2; no bloquea Wave 1)

- [ ] Cuenta Stripe del negocio creada / accesible
- [ ] Onboarding Stripe (datos fiscales / banco) en curso o completo
- [ ] Invitación Dashboard para operador nuestro (admin técnico) y para el gym (negocio)
- [ ] Moneda y país de cobro confirmados (EUR / ES salvo acuerdo)

Tras intake (solo en Gate → Wave 2):

- [ ] Live keys solo en Vercel Production
- [ ] Webhook Production dedicado (ver [stripe-production-golive.md](./stripe-production-golive.md))
- [ ] Nunca `sk_live` en Preview

## 5. Catálogo y datos piloto (plantilla corta)

Pedir en texto, hoja o CSV. Nosotros cargamos en admin / DB.

### Planes de membresía

Para cada plan:

- nombre
- precio orientativo (informativo si el cobro online de planes sigue diferido)
- reglas de reserva (ilimitado / cupo semanal o mensual)
- si está activo y público en `/plans`

### Bonos de créditos

Para cada bono:

- nombre
- créditos
- precio (EUR)
- activo / público para compra online

### Coaches

- nombre visible
- activo sí/no

### Tipos de clase

- nombre, duración típica, aforo por defecto, descripción corta

### Horario semanal tipo (1–2 semanas piloto)

- día / hora inicio / tipo / coach / aforo
- zona horaria del centro

### Socios piloto (2–3)

- nombre + email (consentimiento a probar)
- cobertura inicial deseada (plan o bono asignado por staff)

### Staff

- nombre + email de cada operador `/admin`
- rol esperado (admin / staff según modelo actual)

## 6. Contenido mínimo público (opcional en Wave 1)

- [ ] Textos de contacto / WhatsApp / dirección si deben salir en landing
- [ ] Horario de atención
- [ ] Confirmación de copy legal (aviso privacidad / cookies) si cambia el dominio

No bloquear Wave 1 por marketing perfecto.

## 7. Captcha (pre-widen público)

- [ ] Decisión: activar captcha en leads antes de campañas
- Ticket aparte; no bloquea intake ni Wave 1–2

## 8. Checklist “listo para PrepOps”

Intake completo cuando:

- [ ] Ownership B (o variante) firmado o mail de confirmación
- [ ] Dominio + contacto DNS
- [ ] Remitente email + inbox leads
- [ ] Catálogo mínimo (al menos 1 plan o 1 bono, 1 tipo, 1 coach, horario 1 semana)
- [ ] ≥1 email staff + ≥2 emails socios piloto
- [ ] Stripe account identificada (aunque live sea Wave 2)

## Mensaje corto al gym (copiar/pegar)

> Para arrancar el piloto necesitamos de vosotros, en una sola pasada:
>
> 1) confirmar que nosotros operamos la tech y vosotros el día a día + Stripe Dashboard  
> 2) dominio de la app y acceso DNS  
> 3) desde qué email deben salir confirmaciones y a qué bandeja llegan los leads  
> 4) lista de planes, bonos, coaches, tipos de clase y horario de 1–2 semanas  
> 5) 1–2 emails de staff y 2–3 socios de confianza para probar  
>
> Nosotros montamos Production, cargamos datos y os damos usuarios. No tenéis que configurar hosting ni webhooks.
