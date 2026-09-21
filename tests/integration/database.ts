import { execFileSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { cpSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { Client } from 'pg'

export const baseline = '20260313190000_mig39_initial_schema'
export const historyFix = '20260921120000_mig78_repeatable_reservation_history'
export const migrationsPath = path.resolve('prisma/migrations')
export const migrations = readdirSync(migrationsPath).filter((name) => /^\d{14}_/.test(name)).sort()
export const legacyMigrations = migrations.filter((name) => name !== baseline && name < historyFix)

export function requireIntegrationDatabaseUrl() {
  const value = process.env.INTEGRATION_DATABASE_URL
  if (!value) {
    throw new Error('INTEGRATION_DATABASE_URL is required; ambient DATABASE_URL is never used')
  }
  const url = new URL(value)
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol)
    || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    || url.pathname !== '/wellstudio_integration'
    || url.search
    || url.hash
  ) {
    throw new Error('Integration tests require a loopback PostgreSQL URL for wellstudio_integration without query parameters')
  }
  return url.toString()
}

export function newDatabaseUrl(adminUrl = requireIntegrationDatabaseUrl()) {
  const url = new URL(adminUrl)
  url.pathname = `/wellstudio_integration_${randomUUID().replace(/-/g, '')}`
  return url.toString()
}

export function runPrisma(url: string, args: string[]) {
  return execFileSync(process.execPath, [path.resolve('node_modules/prisma/build/index.js'), ...args], {
    encoding: 'utf8',
    timeout: 90_000,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
  })
}

export async function createDatabase(url = newDatabaseUrl()) {
  const adminUrl = requireIntegrationDatabaseUrl()
  const target = new URL(url)
  const expected = new URL(adminUrl)
  expected.pathname = target.pathname
  if (
    expected.toString() !== target.toString()
    || !/^\/wellstudio_integration_[a-f0-9]{32}$/.test(target.pathname)
  ) {
    throw new Error('Refusing to create or drop a database outside this integration run')
  }

  const name = target.pathname.slice(1)
  const admin = new Client({ connectionString: adminUrl })
  await admin.connect()
  try {
    await admin.query(`CREATE DATABASE "${name}"`)
  } finally {
    await admin.end()
  }
  const client = new Client({ connectionString: url })
  await client.connect()

  return {
    url,
    client,
    async dispose() {
      await client.end()
      const cleanup = new Client({ connectionString: adminUrl })
      await cleanup.connect()
      try {
        await cleanup.query(`DROP DATABASE "${name}" WITH (FORCE)`)
      } finally {
        await cleanup.end()
      }
    },
  }
}

export function withMigrationHistory<T>(names: string[], operation: (config: string) => T) {
  const output = path.resolve('test-results')
  mkdirSync(output, { recursive: true })
  const directory = mkdtempSync(path.join(output, 'integration-'))
  const history = path.join(directory, 'migrations')
  mkdirSync(history)
  for (const name of names) {
    cpSync(path.join(migrationsPath, name), path.join(history, name), { recursive: true })
  }
  writeFileSync(path.join(history, 'migration_lock.toml'), 'provider = "postgresql"\n')
  const config = path.join(directory, 'prisma.config.ts')
  writeFileSync(config, `import { defineConfig } from 'prisma/config'
export default defineConfig({
  schema: ${JSON.stringify(path.resolve('prisma/schema.prisma'))},
  migrations: { path: ${JSON.stringify(history)} },
  datasource: { url: process.env.DIRECT_URL },
})
`)
  try {
    return operation(config)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
}

export function deploy(url: string, names = migrations) {
  return withMigrationHistory(names, (config) => runPrisma(url, ['migrate', 'deploy', '--config', config]))
}
