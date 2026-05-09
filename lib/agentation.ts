export const AGENTATION_PROJECT_SLUG = 'wellstudio-platform'

const AGENTATION_STORAGE_PREFIXES = [
  'feedback-annotations-',
  'agentation-session-',
  'agentation-design-',
  'agentation-rearrange-',
  'agentation-wireframe-',
] as const

export function getAgentationProjectOwnerKey(pathname: string) {
  return `agentation-project-owner:${pathname}`
}

export function getAgentationScopedSessionKey(origin: string, pathname: string) {
  return `agentation-project-session:${AGENTATION_PROJECT_SLUG}:${origin}${pathname}`
}

export function clearAgentationLocalState(storage: Storage, pathname: string) {
  for (const prefix of AGENTATION_STORAGE_PREFIXES) {
    storage.removeItem(`${prefix}${pathname}`)
  }
}

export function ensureAgentationProjectIsolation(
  storage: Storage,
  pathname: string,
  origin: string,
) {
  const ownerKey = getAgentationProjectOwnerKey(pathname)
  const scopedSessionKey = getAgentationScopedSessionKey(origin, pathname)
  const storedOwner = storage.getItem(ownerKey)

  if (storedOwner !== AGENTATION_PROJECT_SLUG) {
    clearAgentationLocalState(storage, pathname)
    storage.removeItem(scopedSessionKey)
    storage.setItem(ownerKey, AGENTATION_PROJECT_SLUG)

    return null
  }

  return storage.getItem(scopedSessionKey)
}
