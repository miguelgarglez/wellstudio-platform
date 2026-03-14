# WellStudio Auth Gap: Email Confirmation E2E

Fecha: 2026-03-14  
Estado: accepted deferred gap

## Qué falta exactamente

Hoy no estamos automatizando de punta a punta este tramo del registro:

1. enviar el email real de confirmación
2. abrir ese email desde un inbox de test
3. seguir el enlace de confirmación
4. completar el alta hasta `/app`

## Qué sí está cubierto

- render de `/register`
- submit real del formulario de registro
- soporte de `/auth/confirm`
- feedback de verificación cuando no hay sesión inmediata
- login real
- logout real
- provisión local de identidad tras login

## Por qué aceptamos el gap

Para `Supabase hosted`, el email por defecto introduce dos límites prácticos:

- rate limiting
- flujo de confirmación que depende de un correo externo que hoy no estamos capturando automáticamente

Cerrar ese último tramo exigiría una infraestructura adicional de QA, por ejemplo:

- inbox harness
- custom SMTP de sandbox
- o un flujo admin específico para confirmar usuarios de test

Ahora mismo no compensa frente al valor que aporta seguir con producto y UX.

## Riesgo residual

El riesgo que queda es este:

- un cambio en templates, redirect URLs o entrega de email podría romper el último tramo del registro sin que lo detectemos en la suite por defecto

## Mitigación actual

- la app ya soporta `/auth/confirm`
- la UI ya refleja correctamente el estado de confirmación pendiente
- el gap está documentado
- el resto del bloque de auth sí tiene cobertura fuerte

## Cuándo retomar esto

Tiene sentido retomarlo cuando ocurra una de estas cosas:

- vayamos a hacer una beta cerrada seria
- necesitemos validar onboarding real antes de entrega
- configuremos un proveedor de correo de sandbox o un inbox harness
- queramos convertir registro en un gate fuerte de release
