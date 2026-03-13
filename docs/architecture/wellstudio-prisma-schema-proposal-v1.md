# WellStudio Prisma Schema Proposal V1

Fecha: 2026-03-13
Estado: propuesta inicial para implementacion
Objetivo: servir como base para el primer `schema.prisma`

Base:

- [wellstudio-data-model-v1.md](/Users/miguelgarglez/Developer/wellstudio-analysis/wellstudio-data-model-v1.md)
- [wellstudio-v1-product-decisions.md](/Users/miguelgarglez/Developer/wellstudio-analysis/wellstudio-v1-product-decisions.md)
- [ADR-005-prisma-as-v1-orm.md](/Users/miguelgarglez/Developer/wellstudio-analysis/ADR-005-prisma-as-v1-orm.md)

## 1. Alcance

Esta propuesta cubre el schema inicial necesario para:

- auth e identidad local
- socios
- clases y sesiones
- elegibilidad por membresias y creditos
- reservas y waitlist
- pagos y tarjetas
- auditoria

No intenta ser el schema final de todos los anos.
Intenta ser el primer schema serio de V1.

## 2. Decisiones previas

- `Prisma` es el ORM base para V1
- `PostgreSQL` es la base de datos objetivo
- auth provider externo con identidad local en `users`
- creditos con ledger
- cancelacion gratuita hasta `120 minutos`
- coaches sin login obligatorio en V1
- `leads` entran en MVP
- `agreements` quedan fuera del primer corte de schema

## 3. Propuesta de modelos principales

La siguiente propuesta esta escrita en sintaxis Prisma orientativa.
No pretende ser el fichero final exacto, pero ya esta lo bastante cerca como para implementarlo.

```prisma
enum UserStatus {
  PENDING_VERIFICATION
  ACTIVE
  SUSPENDED
  INVITED
}

enum UserRoleType {
  MEMBER
  STAFF
  ADMIN
}

enum MemberStatus {
  LEAD_CONVERTED
  ACTIVE
  INACTIVE
  BLOCKED
}

enum CoachStatus {
  ACTIVE
  INACTIVE
}

enum ClassTypeStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}

enum ClassSessionStatus {
  DRAFT
  PUBLISHED
  CLOSED
  CANCELED
  COMPLETED
}

enum ReservationStatus {
  BOOKED
  CANCELED
  ATTENDED
  NO_SHOW
}

enum AttendanceStatus {
  PENDING
  ATTENDED
  NO_SHOW
}

enum ReservationSource {
  MEMBER_APP
  STAFF
  SYSTEM
}

enum WaitlistStatus {
  WAITING
  NOTIFIED
  PROMOTED
  EXPIRED
  REMOVED
}

enum MembershipPlanStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}

enum MemberMembershipStatus {
  PENDING_ACTIVATION
  ACTIVE
  PAUSED
  EXPIRED
  CANCELED
}

enum CreditPackStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}

enum MemberCreditAccountStatus {
  ACTIVE
  DEPLETED
  EXPIRED
  CANCELED
}

enum CreditLedgerEntryType {
  PURCHASE
  RESERVATION_CONSUME
  RESERVATION_REFUND
  MANUAL_ADJUSTMENT
  EXPIRATION
}

enum EntitlementUsageType {
  MEMBERSHIP
  CREDIT
  MANUAL_OVERRIDE
}

enum CardStatus {
  ACTIVE
  DETACHED
  FAILED_VERIFICATION
}

enum PaymentStatus {
  PENDING
  REQUIRES_ACTION
  SUCCEEDED
  FAILED
  REFUNDED
  CANCELED
}

enum PaymentType {
  MEMBERSHIP_PURCHASE
  CREDIT_PACK_PURCHASE
  MANUAL_CHARGE
}

enum PaymentItemType {
  MEMBERSHIP_PLAN
  CREDIT_PACK
}

enum PaymentEventProcessingStatus {
  RECEIVED
  PROCESSED
  IGNORED
  FAILED
}

enum LeadStatus {
  NEW
  CONTACTED
  QUALIFIED
  CONVERTED
  LOST
}

enum ConsentType {
  TERMS
  PRIVACY
  MARKETING
}

model User {
  id                   String        @id @default(cuid())
  email                String
  normalizedEmail      String        @unique
  status               UserStatus
  externalAuthProvider String?
  externalAuthId       String?
  emailVerifiedAt      DateTime?
  lastLoginAt          DateTime?
  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt

  member               Member?
  roles                UserRole[]
  consents             UserConsent[]
  coachProfile         Coach?
  auditLogs            AuditLog[]    @relation("AuditActor")

  @@unique([externalAuthProvider, externalAuthId])
}

model UserRole {
  id        String       @id @default(cuid())
  userId    String
  role      UserRoleType
  createdAt DateTime     @default(now())

  user      User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, role])
}

model UserConsent {
  id            String      @id @default(cuid())
  userId        String
  consentType   ConsentType
  accepted      Boolean
  acceptedAt    DateTime?
  source        String?
  policyVersion String?
  createdAt     DateTime    @default(now())

  user          User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, consentType])
}

model Member {
  id          String                 @id @default(cuid())
  userId      String                 @unique
  firstName   String
  lastName    String
  phone       String?
  birthDate   DateTime?
  status      MemberStatus
  joinedAt    DateTime?
  createdAt   DateTime               @default(now())
  updatedAt   DateTime               @updatedAt

  user                User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  memberships         MemberMembership[]
  creditAccounts      MemberCreditAccount[]
  reservations        Reservation[]
  waitlistEntries     WaitlistEntry[]
  cards               Card[]
  payments            Payment[]
  leadsConvertedFrom  Lead[]                @relation("LeadConversion")
  notes               MemberNote[]
}

model MemberNote {
  id           String    @id @default(cuid())
  memberId     String
  authorUserId String
  body         String
  visibility   String?
  createdAt    DateTime  @default(now())

  member       Member    @relation(fields: [memberId], references: [id], onDelete: Cascade)
}

model Lead {
  id                String      @id @default(cuid())
  email             String?
  phone             String?
  firstName         String?
  lastName          String?
  status            LeadStatus
  source            String?
  ownerUserId       String?
  convertedMemberId String?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  convertedMember   Member?     @relation("LeadConversion", fields: [convertedMemberId], references: [id])

  @@index([status, createdAt])
}

model Coach {
  id          String      @id @default(cuid())
  userId      String?     @unique
  displayName String
  firstName   String?
  lastName    String?
  bio         String?
  status      CoachStatus
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  user        User?       @relation(fields: [userId], references: [id])
  sessions    ClassSession[]
}

model ClassType {
  id               String                     @id @default(cuid())
  name             String
  slug             String                     @unique
  description      String?
  category         String?
  durationMinutes  Int
  capacityDefault  Int
  waitlistEnabled  Boolean                    @default(true)
  isPublic         Boolean                    @default(true)
  status           ClassTypeStatus
  createdAt        DateTime                   @default(now())
  updatedAt        DateTime                   @updatedAt

  sessions         ClassSession[]
  eligibilityRules ClassTypeEligibilityRule[]
}

model ClassTypeEligibilityRule {
  id               String   @id @default(cuid())
  classTypeId      String
  ruleType         String
  membershipPlanId String?
  creditCost       Int?
  priority         Int      @default(0)
  isActive         Boolean  @default(true)
  createdAt        DateTime @default(now())

  classType        ClassType        @relation(fields: [classTypeId], references: [id], onDelete: Cascade)
  membershipPlan   MembershipPlan?  @relation(fields: [membershipPlanId], references: [id])

  @@index([classTypeId, isActive, priority])
}

model ClassSession {
  id              String             @id @default(cuid())
  classTypeId     String
  coachId         String?
  startsAt        DateTime
  endsAt          DateTime
  capacity        Int
  reservedCount   Int                @default(0)
  waitlistEnabled Boolean            @default(true)
  locationLabel   String?
  status          ClassSessionStatus
  publishedAt     DateTime?
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt

  classType       ClassType          @relation(fields: [classTypeId], references: [id])
  coach           Coach?             @relation(fields: [coachId], references: [id])
  reservations    Reservation[]
  waitlistEntries WaitlistEntry[]

  @@index([startsAt])
  @@index([status, startsAt])
}

model Reservation {
  id                  String                  @id @default(cuid())
  memberId            String
  classSessionId      String
  status              ReservationStatus
  bookedAt            DateTime                @default(now())
  canceledAt          DateTime?
  canceledByUserId    String?
  cancellationReason  String?
  attendanceStatus    AttendanceStatus        @default(PENDING)
  source              ReservationSource       @default(MEMBER_APP)
  createdAt           DateTime                @default(now())
  updatedAt           DateTime                @updatedAt

  member              Member                  @relation(fields: [memberId], references: [id], onDelete: Cascade)
  classSession        ClassSession            @relation(fields: [classSessionId], references: [id], onDelete: Cascade)
  entitlementUsages   ReservationEntitlementUsage[]

  @@index([memberId, status])
  @@index([classSessionId, status])
  @@unique([memberId, classSessionId, status], map: "reservation_member_session_status_unique")
}

model ReservationEntitlementUsage {
  id                    String                @id @default(cuid())
  reservationId         String
  usageType             EntitlementUsageType
  memberMembershipId    String?
  memberCreditAccountId String?
  creditLedgerEntryId   String?
  creditsUsed           Int?
  createdAt             DateTime              @default(now())

  reservation           Reservation           @relation(fields: [reservationId], references: [id], onDelete: Cascade)
  memberMembership      MemberMembership?     @relation(fields: [memberMembershipId], references: [id])
  memberCreditAccount   MemberCreditAccount?  @relation(fields: [memberCreditAccountId], references: [id])
  creditLedgerEntry     CreditLedgerEntry?    @relation(fields: [creditLedgerEntryId], references: [id])
}

model WaitlistEntry {
  id             String         @id @default(cuid())
  memberId       String
  classSessionId String
  position       Int?
  status         WaitlistStatus
  joinedAt       DateTime       @default(now())
  notifiedAt     DateTime?
  promotedAt     DateTime?
  expiredAt      DateTime?

  member         Member         @relation(fields: [memberId], references: [id], onDelete: Cascade)
  classSession   ClassSession   @relation(fields: [classSessionId], references: [id], onDelete: Cascade)

  @@index([classSessionId, status, joinedAt])
  @@unique([memberId, classSessionId, status], map: "waitlist_member_session_status_unique")
}

model MembershipPlan {
  id               String                   @id @default(cuid())
  name             String
  slug             String                   @unique
  description      String?
  billingType      String?
  priceAmount      Int
  currency         String
  billingInterval  String?
  bookingPolicyType String?
  includedCredits  Int?
  status           MembershipPlanStatus
  isPublic         Boolean                  @default(true)
  createdAt        DateTime                 @default(now())
  updatedAt        DateTime                 @updatedAt

  memberMemberships MemberMembership[]
  eligibilityRules  ClassTypeEligibilityRule[]
}

model MemberMembership {
  id                     String                  @id @default(cuid())
  memberId               String
  membershipPlanId       String
  status                 MemberMembershipStatus
  startsAt               DateTime
  endsAt                 DateTime?
  autoRenews             Boolean                 @default(false)
  providerSubscriptionId String?
  paymentId              String?
  createdAt              DateTime                @default(now())
  updatedAt              DateTime                @updatedAt

  member                 Member                  @relation(fields: [memberId], references: [id], onDelete: Cascade)
  membershipPlan         MembershipPlan          @relation(fields: [membershipPlanId], references: [id])
  payment                Payment?                @relation(fields: [paymentId], references: [id])
  usages                 ReservationEntitlementUsage[]

  @@index([memberId, status])
  @@index([providerSubscriptionId])
}

model CreditPack {
  id               String                   @id @default(cuid())
  name             String
  slug             String                   @unique
  description      String?
  creditsTotal     Int
  priceAmount      Int
  currency         String
  expiresAfterDays Int?
  status           CreditPackStatus
  isPublic         Boolean                  @default(true)
  createdAt        DateTime                 @default(now())
  updatedAt        DateTime                 @updatedAt

  memberCreditAccounts MemberCreditAccount[]
}

model MemberCreditAccount {
  id              String                    @id @default(cuid())
  memberId        String
  creditPackId    String
  status          MemberCreditAccountStatus
  openedAt        DateTime                  @default(now())
  expiresAt       DateTime?
  paymentId       String?
  createdAt       DateTime                  @default(now())
  updatedAt       DateTime                  @updatedAt

  member          Member                    @relation(fields: [memberId], references: [id], onDelete: Cascade)
  creditPack      CreditPack                @relation(fields: [creditPackId], references: [id])
  payment         Payment?                  @relation(fields: [paymentId], references: [id])
  ledgerEntries   CreditLedgerEntry[]
  usages          ReservationEntitlementUsage[]

  @@index([memberId, status])
}

model CreditLedgerEntry {
  id                    String                 @id @default(cuid())
  memberCreditAccountId String
  entryType             CreditLedgerEntryType
  creditsDelta          Int
  balanceAfter          Int
  referenceType         String?
  referenceId           String?
  notes                 String?
  createdAt             DateTime               @default(now())

  memberCreditAccount   MemberCreditAccount    @relation(fields: [memberCreditAccountId], references: [id], onDelete: Cascade)
  usages                ReservationEntitlementUsage[]

  @@index([memberCreditAccountId, createdAt])
}

model Card {
  id                     String      @id @default(cuid())
  memberId               String
  provider               String
  providerCustomerId     String?
  providerPaymentMethodId String
  brand                  String?
  last4                  String?
  expMonth               Int?
  expYear                Int?
  isDefault              Boolean     @default(false)
  status                 CardStatus
  createdAt              DateTime    @default(now())
  updatedAt              DateTime    @updatedAt

  member                 Member      @relation(fields: [memberId], references: [id], onDelete: Cascade)
  payments               Payment[]

  @@unique([provider, providerPaymentMethodId])
  @@index([memberId, isDefault])
}

model Payment {
  id                    String       @id @default(cuid())
  memberId              String
  cardId                String?
  provider              String
  providerPaymentIntentId String?
  providerInvoiceId     String?
  status                PaymentStatus
  paymentType           PaymentType
  amount                Int
  currency              String
  capturedAt            DateTime?
  failedAt              DateTime?
  failureReason         String?
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt

  member                Member       @relation(fields: [memberId], references: [id], onDelete: Cascade)
  card                  Card?        @relation(fields: [cardId], references: [id])
  items                 PaymentItem[]
  events                PaymentEvent[]
  memberships           MemberMembership[]
  creditAccounts        MemberCreditAccount[]

  @@index([memberId, createdAt])
  @@index([providerPaymentIntentId])
}

model PaymentItem {
  id         String          @id @default(cuid())
  paymentId  String
  itemType   PaymentItemType
  referenceId String
  quantity   Int             @default(1)
  unitAmount Int
  totalAmount Int
  createdAt  DateTime        @default(now())

  payment    Payment         @relation(fields: [paymentId], references: [id], onDelete: Cascade)

  @@index([paymentId])
}

model PaymentEvent {
  id               String                       @id @default(cuid())
  paymentId        String?
  provider         String
  providerEventId  String
  eventType        String
  payloadJson      Json
  processedAt      DateTime?
  processingStatus PaymentEventProcessingStatus
  createdAt        DateTime                     @default(now())

  payment          Payment?                     @relation(fields: [paymentId], references: [id])

  @@unique([provider, providerEventId])
  @@index([paymentId])
}

model AuditLog {
  id          String    @id @default(cuid())
  actorUserId String?
  actionType  String
  entityType  String
  entityId    String
  contextJson Json?
  createdAt   DateTime  @default(now())

  actorUser   User?     @relation("AuditActor", fields: [actorUserId], references: [id])

  @@index([entityType, entityId])
  @@index([actorUserId, createdAt])
}
```

## 4. Notas importantes sobre Prisma y constraints

Hay tres puntos donde no conviene ser ingenuo:

### Reservas activas unicas

Lo que de verdad queremos es:

- una unica reserva activa por `member + session`

Con Prisma puro, un `@@unique([memberId, classSessionId, status])` no expresa exactamente la restriccion de "solo para ciertos estados".

Recomendacion:

- usar el schema Prisma como base
- añadir despues un indice unico parcial en SQL para `status = 'BOOKED'`

### Waitlist activa unica

Mismo problema:

- queremos una sola entrada activa en waitlist por `member + session`

Recomendacion:

- indice parcial en SQL para estados activos

### Tarjeta por defecto unica

Si se quiere garantizar solo una tarjeta por defecto por socio:

- puede resolverse en logica de aplicacion dentro de transaccion
- o con indice parcial si se quiere endurecer mas tarde

## 5. Que dejaria fuera del primer schema

Para no sobredimensionar el primer corte:

- `agreements`
- `agreement_signatures`
- `attendance_records` separada si no hace falta aun
- tablas avanzadas de reporting
- politicas muy flexibles por localizacion o multi-centro

`member_notes` y `leads` si me parecen razonables para incluir si el panel interno arranca pronto.

## 6. Orden recomendado de implementacion del schema

### Paso 1

- `User`
- `UserRole`
- `UserConsent`
- `Member`
- `Lead`

### Paso 2

- `Coach`
- `ClassType`
- `ClassTypeEligibilityRule`
- `ClassSession`

### Paso 3

- `MembershipPlan`
- `MemberMembership`
- `CreditPack`
- `MemberCreditAccount`
- `CreditLedgerEntry`

### Paso 4

- `Reservation`
- `ReservationEntitlementUsage`
- `WaitlistEntry`

### Paso 5

- `Card`
- `Payment`
- `PaymentItem`
- `PaymentEvent`
- `AuditLog`

## 7. Recomendaciones de implementacion

- mantener el cliente Prisma en `lib/db`
- no usar Prisma directamente desde componentes o paginas
- exponer acceso a datos via modulos o repositorios
- envolver reservas, cancelaciones y pagos en transacciones explicitas
- no confiar solo en Prisma para concurrencia: revisar SQL o locks cuando toque

## 8. Open questions finales

Estas ya no bloquean tanto el primer schema, pero conviene resolverlas pronto:

- si `member_notes` entra desde el primer sprint
- si `Lead.ownerUserId` se usara de verdad en V1
- si `ClassTypeEligibilityRule` necesita mas expresividad o basta con la version simple
- si la compra inicial en UI mostrara membresias, creditos o ambos

## 9. Recomendacion final

Esta propuesta ya es suficientemente concreta para:

- abrir el repo
- crear el `schema.prisma`
- generar migraciones iniciales
- empezar modulos de auth, members, classes y reservations

No esta cerrada al 100%, pero ya esta en el punto correcto para dejar de especular y empezar a construir.
