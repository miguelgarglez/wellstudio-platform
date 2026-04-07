import { describe, expect, it } from 'vitest'

import {
  AGENTATION_PROJECT_SLUG,
  clearAgentationLocalState,
  ensureAgentationProjectIsolation,
  getAgentationProjectOwnerKey,
  getAgentationScopedSessionKey,
} from '@/lib/agentation'

function createStorage(seed: Record<string, string> = {}) {
  const store = new Map(Object.entries(seed))

  return {
    getItem(key: string) {
      return store.get(key) ?? null
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
    removeItem(key: string) {
      store.delete(key)
    },
  } as Storage
}

describe('agentation project isolation', () => {
  it('cleans legacy local state when the page has no ownership marker yet', () => {
    const pathname = '/'
    const origin = 'http://localhost:3000'
    const storage = createStorage({
      'feedback-annotations-/': 'annotations',
      'agentation-session-/': 'legacy-session',
      'agentation-design-/': 'design',
      'agentation-rearrange-/': 'rearrange',
      'agentation-wireframe-/': 'wireframe',
    })

    const sessionId = ensureAgentationProjectIsolation(storage, pathname, origin)

    expect(sessionId).toBeNull()
    expect(storage.getItem('feedback-annotations-/')).toBeNull()
    expect(storage.getItem('agentation-session-/')).toBeNull()
    expect(storage.getItem('agentation-design-/')).toBeNull()
    expect(storage.getItem('agentation-rearrange-/')).toBeNull()
    expect(storage.getItem('agentation-wireframe-/')).toBeNull()
    expect(storage.getItem(getAgentationProjectOwnerKey(pathname))).toBe(
      AGENTATION_PROJECT_SLUG,
    )
  })

  it('resets the page when the ownership marker belongs to another project', () => {
    const pathname = '/members'
    const origin = 'http://localhost:3000'
    const scopedSessionKey = getAgentationScopedSessionKey(origin, pathname)
    const storage = createStorage({
      [getAgentationProjectOwnerKey(pathname)]: 'madrid-x-liveline',
      [scopedSessionKey]: 'stale-session',
      'feedback-annotations-/members': 'annotations',
      'agentation-session-/members': 'legacy-session',
    })

    const sessionId = ensureAgentationProjectIsolation(storage, pathname, origin)

    expect(sessionId).toBeNull()
    expect(storage.getItem(scopedSessionKey)).toBeNull()
    expect(storage.getItem('feedback-annotations-/members')).toBeNull()
    expect(storage.getItem('agentation-session-/members')).toBeNull()
    expect(storage.getItem(getAgentationProjectOwnerKey(pathname))).toBe(
      AGENTATION_PROJECT_SLUG,
    )
  })

  it('reuses only the scoped session when the page already belongs to this project', () => {
    const pathname = '/'
    const origin = 'http://localhost:3000'
    const scopedSessionKey = getAgentationScopedSessionKey(origin, pathname)
    const storage = createStorage({
      [getAgentationProjectOwnerKey(pathname)]: AGENTATION_PROJECT_SLUG,
      [scopedSessionKey]: 'project-session',
      'feedback-annotations-/': 'annotations',
    })

    const sessionId = ensureAgentationProjectIsolation(storage, pathname, origin)

    expect(sessionId).toBe('project-session')
    expect(storage.getItem('feedback-annotations-/')).toBe('annotations')
  })

  it('can clear a page local state directly', () => {
    const storage = createStorage({
      'feedback-annotations-/trace': 'annotations',
      'agentation-session-/trace': 'session',
      'agentation-design-/trace': 'design',
    })

    clearAgentationLocalState(storage, '/trace')

    expect(storage.getItem('feedback-annotations-/trace')).toBeNull()
    expect(storage.getItem('agentation-session-/trace')).toBeNull()
    expect(storage.getItem('agentation-design-/trace')).toBeNull()
  })
})
