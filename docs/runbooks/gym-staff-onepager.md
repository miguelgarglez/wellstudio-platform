# Guía staff WellStudio (1 página) + sesión 45–60 min

Fecha: 2026-08-12  
Para: operadores del centro en el piloto  
Playbook: [gym-onboarding-handoff.md](./gym-onboarding-handoff.md)

---

## Guía de 1 página (imprimible / Notion)

**Entrar:** URL Production → `/login` con el email que os dimos → cambiar password en el primer acceso si se indica.

**Home admin (`/admin`):** resumen del día — sesiones, ocupación, leads nuevos. Empezad aquí.

### 1. Publicar la semana

1. Tipos de clase y coaches (catálogo) — solo si falta algo nuevo.
2. Crear sesiones: tipo, coach, inicio, aforo.
3. Revisar agenda pública (sin login) para confirmar que se ve bien.

### 2. Alta de socio

1. El socio se registra en la web (confirmación por email).
2. En `/admin` → Socios: localizar ficha.
3. Asignar **plan** o **bono/créditos** (mostrador). Esto habilita reservas sin cobro online.
4. Notas internas: solo contexto operativo; no datos sensibles innecesarios.

### 3. Reservas

- El socio reserva / cancela desde su app (`/app`).
- Si llama al centro: ficha del socio → **reserva asistida** (mismas reglas; no “saltéis” aforo a mano fuera del producto).
- Waitlist: apuntar desde la misma ficha cuando la clase esté llena.

### 4. Leads

- Formulario público → aviso a la bandeja acordada y/o listado en admin.
- Responder fuera (WhatsApp/email) y marcar seguimiento según vuestra operativa.

### 5. Cobros (cuando esté Wave 2)

- El socio compra bono en **Cuenta** (Stripe).
- Si el pago falla o duda: **asignad el bono a mano** y seguid con la reserva.
- Consulta rápida: `/admin` Cobros + Stripe Dashboard (modelo híbrido).

### 6. Qué no hacer

- No pedir ni guardar números de tarjeta.
- No compartir vuestras credenciales admin.
- No tocar paneles de Vercel / Supabase / “API keys”.
- Ante duda de cobro: mostrador primero, ticket a soporte después.

### Soporte

Canal acordado: _(rellenar en el kickoff)_  
Bug = “está roto / no deja reservar / no llegan emails”.  
Evolutivo = “queremos una regla o pantalla nueva”.

---

## Guion de sesión de entrenamiento (45–60 min)

Objetivo: 8 pantallas críticas, no tour completo. Un staff conduce; otro observa.

| Min | Bloque | Qué hacer | Hecho cuando |
|---|---|---|---|
| 0–5 | Acceso | Login admin, cambiar password, abrir `/admin` | Ven el overview del día |
| 5–12 | Agenda | Crear o editar 1 sesión; verla en agenda pública | Coincide público vs admin |
| 12–20 | Socio | Abrir ficha de socio piloto; asignar plan o bono | Socio tiene cobertura |
| 20–28 | Reserva socio | El socio (u otro móvil) reserva esa clase | Plaza ocupada en admin |
| 28–35 | Asistida | Staff reserva/cancela en nombre del socio | Misma regla de elegibilidad |
| 35–42 | Lead | Enviar lead de prueba desde la web | Llega aviso / aparece en admin |
| 42–50 | Cuenta socio | Ver saldo / historial; (Wave 2) comprar bono o simular asignación | Entienden plan B manual |
| 50–60 | Cierre | Repasar “qué no hacer” + canal soporte + dudas | Checklist Wave 1 firmada |

### Materiales

- URL Production
- 1 portátil staff + 1 móvil socio piloto
- Emails de confirmación abiertos (spam check)
- [Intake](./gym-intake-checklist.md) ya cerrado
- Esta guía impresa o en pantalla

### Tras la sesión

- [ ] Wave 1 checklist del playbook en verde
- [ ] Anotar fricciones reales (copy, pasos confusos) para polish menor
- [ ] Agendar Gate (~30 min) antes de Stripe live
