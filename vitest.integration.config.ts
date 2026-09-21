import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

import { newDatabaseUrl, requireIntegrationDatabaseUrl } from './tests/integration/database'

const root = path.dirname(fileURLToPath(import.meta.url))
const databaseUrl = newDatabaseUrl(requireIntegrationDatabaseUrl())
const schema = process.env.INTEGRATION_SCHEMA ?? 'migrated'

if (!['legacy', 'migrated'].includes(schema)) {
  throw new Error('INTEGRATION_SCHEMA must be legacy or migrated')
}

export default defineConfig({
  resolve: { alias: { '@': root } },
  test: {
    include: ['tests/integration/**/*.test.ts'],
    environment: 'node',
    fileParallelism: false,
    hookTimeout: 120_000,
    testTimeout: 120_000,
    globalSetup: ['tests/integration/global-setup.ts'],
    env: {
      DATABASE_URL: databaseUrl,
      DIRECT_URL: databaseUrl,
      INTEGRATION_SCHEMA: schema,
    },
  },
})
