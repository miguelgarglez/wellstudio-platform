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

const databaseUrl = process.env.DATABASE_URL || resolveEnvValue('DATABASE_URL')

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to configure Prisma')
}

process.env.DATABASE_URL = databaseUrl

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: databaseUrl,
  },
})
