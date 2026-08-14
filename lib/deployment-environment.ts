/**
 * Vercel deployment tier helpers shared across feature gates (showcase, sandbox checkout, etc.).
 */
export function isProductionDeployment() {
  const vercelEnvironment = process.env.VERCEL_ENV?.trim().toLowerCase()

  if (vercelEnvironment) {
    return vercelEnvironment === 'production'
  }

  return process.env.NODE_ENV === 'production'
}

/** Commercial showcase decks are Preview/local only — hidden on Vercel Production. */
export function isShowcaseRoutesEnabled() {
  return !isProductionDeployment()
}
