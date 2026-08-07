import { Client } from 'pg'

import { loadE2EEnvFiles } from './env'

loadE2EEnvFiles()

export const ADMIN_LEADS_E2E_NAME = 'E2E Leads V2'
const ADMIN_LEADS_E2E_SOURCE = 'e2e_admin_leads_v2'

export async function prepareSandboxAdminLeadsFixture() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL is required to prepare the admin leads fixture')
  }

  const client = new Client({ connectionString })
  await client.connect()

  try {
    await client.query('delete from "Lead" where source = $1', [ADMIN_LEADS_E2E_SOURCE])

    const result = await client.query<{ id: string }>(
      `
        insert into "Lead" (
          id,
          email,
          phone,
          "normalizedPhone",
          "firstName",
          status,
          source,
          "privacyAcceptedAt",
          "privacyPolicyVersion",
          "createdAt",
          "updatedAt"
        )
        values (
          gen_random_uuid()::text,
          'e2e.leads.v2@wellstudio.test',
          '612 555 105',
          '612555105',
          $1,
          'NEW',
          $2,
          now(),
          'e2e',
          now(),
          now()
        )
        returning id
      `,
      [ADMIN_LEADS_E2E_NAME, ADMIN_LEADS_E2E_SOURCE],
    )

    const leadId = result.rows[0]?.id

    if (!leadId) {
      throw new Error('Admin leads fixture could not create its contact request')
    }

    return { leadId }
  } finally {
    await client.end()
  }
}
