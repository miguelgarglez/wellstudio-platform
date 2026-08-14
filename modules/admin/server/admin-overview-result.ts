export type AdminOverviewResult<T> =
  | { ok: true; data: T }
  | { ok: false }

export async function readAdminOverview<T>(
  loader: () => Promise<T>,
): Promise<AdminOverviewResult<T>> {
  try {
    return { ok: true, data: await loader() }
  } catch (error) {
    console.error('Admin overview query failed', error)
    return { ok: false }
  }
}
