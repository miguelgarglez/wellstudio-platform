import { existsSync, readFileSync } from 'node:fs'

import { defineConfig } from 'prisma/config'

function resolveDatabaseUrlFromEnvFile() {
  for (const filePath of ['.env.local', '.env']) {
    if (!existsSync(filePath)) {
      continue
    }

    const fileContents = readFileSync(filePath, 'utf8')
    const match = fileContents.match(/^DATABASE_URL=(.*)$/m)

    if (!match) {
      continue
    }

    return match[1].trim().replace(/^['"]|['"]$/g, '')
  }

  return undefined
}

const databaseUrl = process.env.DATABASE_URL || resolveDatabaseUrlFromEnvFile()

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to configure Prisma')
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: databaseUrl,
  },
})
