# Payments Module

Boundary responsible for checkout providers, local payment snapshots, provider events and commerce fulfillment.

## Invariants

- The client never sends price, currency or entitlement units.
- A browser redirect never grants credits.
- A verified provider event is the source of truth for fulfillment.
- `PaymentEvent(provider, providerEventId)` deduplicates delivery.
- `MemberCreditAccount.paymentId` deduplicates the granted entitlement.
- `CreditLedgerEntry` remains the source of truth for balance.
- Provider payloads are reduced to an operational, non-secret snapshot before persistence.

Provider-specific code stays behind `PaymentCheckoutProvider`. Pages, actions and route handlers only resolve identity, parse transport input and delegate to this module.
