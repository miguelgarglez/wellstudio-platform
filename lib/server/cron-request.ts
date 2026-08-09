export type CronRequestAuthorization =
  | { authorized: true }
  | { authorized: false; status: 401 | 503; message: string }

export function authorizeCronRequest(request: Request): CronRequestAuthorization {
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return {
      authorized: false,
      status: 503,
      message: 'Scheduled operations are not configured.',
    }
  }

  if (request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return { authorized: false, status: 401, message: 'Unauthorized.' }
  }

  return { authorized: true }
}
