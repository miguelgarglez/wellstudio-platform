export function ensureSandboxCheckoutEnabled() {
  if (isProductionDeployment() || process.env.PAYMENTS_CHECKOUT_MODE !== 'sandbox') {
    throw new Error('Sandbox checkout is disabled')
  }
}

function isProductionDeployment() {
  const vercelEnvironment = process.env.VERCEL_ENV?.trim().toLowerCase()

  if (vercelEnvironment) {
    return vercelEnvironment === 'production'
  }

  return process.env.NODE_ENV === 'production'
}
