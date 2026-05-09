import { existsSync, readFileSync } from 'node:fs'

import { defineConfig } from 'prisma/config'

function resolveEnvValue(key: string) {
  for (const filePath of ['.env.local', '.env']) {
    if (!existsSync(filePath)) {
      continue
    }

    const fileContents = readFileSync(filePath, 'utf8')
    const match = fileContents.match(new RegExp(`^${key}=(.*)$`, 'm'))

    if (!match) {
      continue
    }

    return match[1].trim().replace(/^['"]|['"]$/g, '')
  }

  return undefined
}

const runtimeDatabaseUrl = process.env.DATABASE_URL || resolveEnvValue('DATABASE_URL')
const schemaDatabaseUrl =
  process.env.DIRECT_URL || resolveEnvValue('DIRECT_URL') || runtimeDatabaseUrl

if (!runtimeDatabaseUrl) {
  throw new Error('DATABASE_URL is required to configure Prisma')
}

process.env.DATABASE_URL = runtimeDatabaseUrl

if (schemaDatabaseUrl) {
  process.env.DIRECT_URL = schemaDatabaseUrl
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: schemaDatabaseUrl,
  },
})
