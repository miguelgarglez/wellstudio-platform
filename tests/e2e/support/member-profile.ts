import { Client } from 'pg'

import { getSandboxCredentials, loadE2EEnvFiles } from './env'

loadE2EEnvFiles()

type MemberProfileSnapshot = {
  memberId: string
  firstName: string
  lastName: string
  phone: string | null
  birthDate: Date | null
  updatedAt: Date
  auditStartedAt: Date
}

export function hasMemberProfileDatabase() {
  return Boolean(process.env.DATABASE_URL)
}

export async function prepareMemberProfileFixture(): Promise<MemberProfileSnapshot> {
  const client = await connect()
  const { email } = getSandboxCredentials()

  try {
    const result = await client.query<{
      id: string
      firstName: string
      lastName: string
      phone: string | null
      birthDate: Date | null
      updatedAt: Date
    }>(
      `
        select m.id, m."firstName", m."lastName", m.phone, m."birthDate", m."updatedAt"
        from "Member" m
        join "User" u on u.id = m."userId"
        where u."normalizedEmail" = lower($1)
        limit 1
      `,
      [email],
    )

    const member = result.rows[0]
    if (!member) throw new Error(`No member profile found for sandbox user ${email}`)

    const auditStartedAt = new Date()
    await client.query(
      `
        update "Member"
        set "firstName" = 'E2E', "lastName" = 'Member Sandbox', phone = '612345678',
            "birthDate" = date '1990-02-03', "updatedAt" = now()
        where id = $1
      `,
      [member.id],
    )

    const { id: memberId, ...profile } = member
    return { memberId, ...profile, auditStartedAt }
  } finally {
    await client.end()
  }
}

export async function restoreMemberProfileFixture(snapshot: MemberProfileSnapshot) {
  const client = await connect()

  try {
    await client.query('begin')
    await client.query(
      `
        update "Member"
        set "firstName" = $2, "lastName" = $3, phone = $4, "birthDate" = $5, "updatedAt" = $6
        where id = $1
      `,
      [
        snapshot.memberId,
        snapshot.firstName,
        snapshot.lastName,
        snapshot.phone,
        snapshot.birthDate,
        snapshot.updatedAt,
      ],
    )
    await client.query(
      `
        delete from "AuditLog"
        where "entityType" = 'Member'
          and "entityId" = $1
          and "actionType" = 'MEMBER_PROFILE_UPDATED'
          and "createdAt" >= $2
      `,
      [snapshot.memberId, snapshot.auditStartedAt],
    )
    await client.query('commit')
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    await client.end()
  }
}

async function connect() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required for member profile E2E')

  const client = new Client({ connectionString })
  await client.connect()
  return client
}
