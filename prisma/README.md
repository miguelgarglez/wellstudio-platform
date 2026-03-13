# Prisma

This folder hosts the first domain schema for WellStudio.

Current status:

- `schema.prisma` drafted from approved architecture and product decisions
- Prisma 7 config moved to `prisma.config.ts`
- pending runtime DB setup and future migrations

Important note:

- some business constraints will likely require SQL migrations beyond plain Prisma schema expressiveness
- especially partial unique indexes for active reservations and active waitlist entries
