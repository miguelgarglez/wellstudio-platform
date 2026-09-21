import { requireIntegrationDatabaseUrl, runPrisma } from './database'

export default function setup() {
  runPrisma(requireIntegrationDatabaseUrl(), ['generate'])
}
