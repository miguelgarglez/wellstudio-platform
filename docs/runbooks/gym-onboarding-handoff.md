# Gym onboarding & handoff (mínima fricción)

Fecha: 2026-08-12  
Estado: ready for intake  
Relacionados:

- [gym-intake-checklist.md](./gym-intake-checklist.md)
- [gym-staff-onepager.md](./gym-staff-onepager.md)
- [stripe-production-golive.md](./stripe-production-golive.md)
- [software-delivery-commercial-template.md](./software-delivery-commercial-template.md)
- [vercel-preview-and-production.md](./vercel-preview-and-production.md)
- [resend-supabase-auth-smtp-setup.md](./resend-supabase-auth-smtp-setup.md)

## Objetivo

Dejar WellStudio listo para **clientes reales del centro**: no construir más producto, sino un paquete operable (quién hace qué, en qué orden, cómo se mide “listo”).

Criterio de éxito: el gym puede, sin nosotros en la sala:

- publicar agenda de la semana
- dar de alta / asignar cobertura a un socio
- que el socio reserve y cancele
- cobrar un bono online (Wave 2) o asignarlo a mano si hace falta
- recibir un lead y responder

## Decisión operativa

### Modelos contemplados

| Modelo | Quién hace qué | Pros | Contras | Cuándo |
|---|---|---|---|---|
| **A Managed** | Nosotros: infra, Stripe técnico, emails, deploys. Gym: solo `/admin` y operación diaria | Mínima fricción tech para el gym | Dependencia total; el gym no “ve” dinero en Stripe | El centro no quiere tocar proveedores |
| **B Híbrido (default)** | Nosotros: Vercel, Supabase, secretos, deploys. Gym: admin producto + visibilidad Stripe comercial. Emails de marca juntos | Equilibrio negocio / control técnico | Hay que acotar accesos por escrito | Caso típico boutique gym |
| **C Traspaso** | Gym o su proveedor opera todo; nosotros docs + accesos | Independencia del cliente | Alta fricción y riesgo operativo | Solo si el gym insiste en ownership total |

### Default: B Híbrido

El handoff se escribe para **B**. A y C son variantes comerciales (1–2 párrafos en el acuerdo), no tres playbooks distintos. Encaja con “entrega + mantenimiento recurrente” en la plantilla comercial.

Implicaciones de B:

- Titularidad legal de dominio, Stripe y Resend: preferible **a nombre del gym** (o holding), con nosotros como operadores técnicos.
- Secretos (`sk_live`, webhook, DB URLs): **custodia nuestra** (Vercel / gestor de secretos). El gym no pega keys.
- Stripe Dashboard: el gym con acceso de **lectura + operaciones comerciales** (cobros, reembolsos de negocio). Keys API solo nosotros.
- Canal de soporte: un WhatsApp o email acordado + definición clara de bug vs evolutivo.
- Cerrar B por escrito aunque sea “provisional 6 meses”.

### Variantes (resumen)

- **A:** igual que B en operación diaria del producto; el gym no necesita Stripe Dashboard. Nosotros reportamos cobros desde `/admin` Cobros o extractos acordados.
- **C:** entregar runbooks, rotar accesos al gym/proveedor, incluir ventana de transición. No es el camino por defecto.

## Principios de baja fricción

1. El gym **no configura infra**. Pedimos datos; nosotros cableamos.
2. Un solo documento de intake hacia el gym ([gym-intake-checklist.md](./gym-intake-checklist.md)).
3. Plantilla de datos (planes, bonos, coaches, horario); nosotros cargamos.
4. Cuentas staff seed creadas por nosotros; el gym solo cambia password.
5. Sesión de entrenamiento 45–60 min + [guía de 1 página](./gym-staff-onepager.md), no manual largo.
6. Plan B operativo: si Stripe falla, staff asigna bono/membresía a mano (ya soportado en admin).

## Roles

### Nosotros (operadores técnicos)

- Vercel Preview / Production, variables, deploys
- Supabase Auth (Site URL, redirects, plantillas)
- Resend / SMTP custom
- Stripe API keys y webhook Production
- Migraciones Prisma en prod
- Carga inicial de catálogo y cuentas staff
- Soporte según paquete de mantenimiento

### Gym (operación de negocio)

- Confirmar titularidad y datos de intake
- Usar `/admin` día a día (agenda, socios, reservas asistidas, leads)
- Ver cobros en Stripe Dashboard (modelo B) y/o `/admin` Cobros
- Responder a socios y leads
- No tocar secretos ni paneles de hosting salvo acuerdo explícito (modelo C)

## Fases

```text
PrepOps → Wave1 (staff + socios de confianza) → Gate → Wave2 (pagos live, mismo grupo) → Widen
```

### PrepOps

1. Confirmar modelo **B** por escrito (o variante A/C).
2. Completar [intake](./gym-intake-checklist.md).
3. Cablear Production: dominio, SMTP, redirects, plantillas sin marcador `[DEV]`.
4. Cargar datos piloto + cuentas staff.
5. Entregar [guía staff](./gym-staff-onepager.md) y canal de soporte.

### Wave 1 — Operativa real sin cobro online

- Staff usa `/admin` con agenda real (1–2 semanas).
- 2–3 socios de confianza: registro, reserva, cancelación, waitlist.
- Memberships/bonos: **asignación staff** (sin Stripe live).
- Validar: “¿el día a día del mostrador funciona?”

Checklist Wave 1:

- [ ] Staff inicia sesión en Production y cambia password seed
- [ ] Existe al menos 1 tipo de clase, 1 coach, sesiones de la semana
- [ ] Agenda pública muestra esas sesiones
- [ ] Socio piloto se registra / confirma email / entra a `/app`
- [ ] Staff asigna plan o bono al socio
- [ ] Socio reserva y cancela (o cancela con política de 120 min)
- [ ] Staff hace 1 reserva asistida desde ficha del socio
- [ ] Lead de prueba llega a inbox / notificación staff

### Gate go-live (~30 min)

No pasar a Wave 2 sin esto en verde:

- [ ] Register / confirm / reset password con dominio y SMTP finales
- [ ] Agenda pública = datos reales del piloto
- [ ] 1 incidencia asistida resuelta por staff
- [ ] Lead de prueba recibido
- [ ] Canal de soporte acordado y probado (mensaje de prueba)

### Wave 2 — Pagos live controlados

Seguir [stripe-production-golive.md](./stripe-production-golive.md).

- Stripe **live** solo en Production; Preview permanece en test/sandbox.
- Mismo grupo pequeño: 1 compra real de bono + 1 vinculación de tarjeta.
- Verificar créditos en Cuenta + email de confirmación.
- Si falla: rollback a asignación staff; las reservas no dependen del cobro online.

Checklist Wave 2:

- [ ] `PAYMENTS_CHECKOUT_MODE=stripe` en Production con `sk_live` + webhook live
- [ ] Smoke: compra bono → `Payment SUCCEEDED` → créditos visibles
- [ ] Smoke: vincular tarjeta → card primaria en Cuenta
- [ ] Email de confirmación de compra recibido (sin `[DEV]`)
- [ ] Documentado el plan B (asignación manual) para el staff

### Widen

- Ampliar socios tras 3–7 días estables en Wave 2.
- Activar captcha en leads **antes** de publicitar mucho la web (no bloquea Wave 1–2).
- Memberships recurrentes online siguen diferidas; altas de plan por staff.

## Orden de trabajo

1. Cerrar modelo B (provisional OK).
2. Intake del gym.
3. Dominio + SMTP + redirects + plantillas prod.
4. Datos piloto + cuentas staff.
5. Wave 1.
6. Gate → Stripe live → Wave 2.
7. Guía staff + mantenimiento (básico/estándar según plantilla comercial).

## Fuera de alcance del handoff

- White-label / multi-tenant
- Suscripciones recurrentes online
- Migración masiva histórica desde BEWE (salvo petición explícita)
- Manuales largos o formación de un día completo

## Paquete mantenimiento (referencia)

Usar [software-delivery-commercial-template.md](./software-delivery-commercial-template.md):

- qué incluye la cuota (hosting, bugs críticos, deploys)
- qué es evolutivo
- canal y tiempos de respuesta
- fin de relación (entrega de datos / accesos)

## Ejecución del piloto

Wave 1 / Gate / Wave 2 se ejecutan **cuando el gym completa el intake** y hay ventana acordada. Hasta entonces, este runbook + tickets Linear son la pista operativa; no inventar datos de producción ni activar `sk_live` sin decisión explícita.

### Linear (epic MIG-146)

- [MIG-147](https://linear.app/miguelgarglez/issue/MIG-147) Intake + modelo B
- [MIG-148](https://linear.app/miguelgarglez/issue/MIG-148) SMTP / dominio prod
- [MIG-149](https://linear.app/miguelgarglez/issue/MIG-149) Datos piloto + staff
- [MIG-153](https://linear.app/miguelgarglez/issue/MIG-153) Sesión staff 45–60 min
- [MIG-151](https://linear.app/miguelgarglez/issue/MIG-151) Wave 1
- [MIG-154](https://linear.app/miguelgarglez/issue/MIG-154) Gate
- [MIG-150](https://linear.app/miguelgarglez/issue/MIG-150) Stripe live
- [MIG-155](https://linear.app/miguelgarglez/issue/MIG-155) Wave 2
- [MIG-156](https://linear.app/miguelgarglez/issue/MIG-156) Captcha leads
- [MIG-152](https://linear.app/miguelgarglez/issue/MIG-152) Paquete mantenimiento
