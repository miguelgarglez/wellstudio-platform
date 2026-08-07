import { Client } from 'pg'

import { loadE2EEnvFiles } from './env'

loadE2EEnvFiles()

export const ADMIN_MEMBER_NOTE_E2E_PREFIX = '[E2E member note]'

export async function cleanupSandboxAdminMemberNotes() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is required to clean admin member notes')

  const client = new Client({ connectionString })
  await client.connect()
  try {
    await client.query('delete from "MemberNote" where body like $1', [`${ADMIN_MEMBER_NOTE_E2E_PREFIX}%`])
  } finally {
    await client.end()
  }
}
