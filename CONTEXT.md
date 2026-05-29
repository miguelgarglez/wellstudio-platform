# WellStudio Context

WellStudio models the operational language of a boutique fitness studio: public acquisition, member access, reservations and internal staff workflows.

## Language

**Lead**:
A person who has left contact details so the studio can contact them before becoming a member.
_Avoid_: contact request, prospect form submission

**Solicitud de contacto**:
The admin-facing UI label for a **Lead** when staff are reviewing and updating follow-up status.
_Avoid_: CRM opportunity, sales pipeline

**Operational lead notification**:
An internal notice sent to the studio team when a new lead needs staff attention.
_Avoid_: marketing email, newsletter, automated campaign

**Operational inbox**:
The studio email address where actionable internal notices are received.
_Avoid_: marketing list, customer mailing list

**Test operational inbox**:
A temporary personal email address used to validate operational notices before the studio inbox is configured.
_Avoid_: production inbox, customer support inbox

## Relationships

- A **Lead** may produce one **Operational lead notification** when it is newly captured.
- A **Lead** appears in admin as a **Solicitud de contacto**.
- An **Operational lead notification** is addressed to the **Operational inbox**.
- A **Test operational inbox** may temporarily stand in for the **Operational inbox** during validation.

## Example Dialogue

> **Dev:** "When a **Lead** submits the public form, should we email them automatically?"
> **Domain expert:** "No. We send an **Operational lead notification** to the **Operational inbox** so staff can call them."

## Flagged Ambiguities

- "Email notification" was clarified to mean **Operational lead notification**, not an email to the lead and not a marketing automation.
- `miguel.garglez@gmail.com` is the **Test operational inbox** for validation, not the final studio operational inbox.
