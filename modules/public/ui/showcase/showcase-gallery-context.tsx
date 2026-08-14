'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import {
  SHOWCASE_GALLERY_ORDER,
  type ShowcaseShotKey,
} from '@/modules/public/ui/showcase/showcase-visuals'

export type ShowcaseGalleryOpenOrigin = {
  top: number
  left: number
  width: number
  height: number
}

type ShowcaseGalleryPhase = 'closed' | 'open' | 'closing'

type ShowcaseGalleryContextValue = {
  isOpen: boolean
  isClosing: boolean
  currentIndex: number
  order: readonly ShowcaseShotKey[]
  openOrigin: ShowcaseGalleryOpenOrigin | null
  openAt: (key: ShowcaseShotKey) => void
  openGallery: (startIndex?: number) => void
  close: () => void
  finalizeClose: () => void
  goNext: () => void
  goPrev: () => void
  goToIndex: (index: number) => void
  registerTrigger: (element: HTMLElement | null) => void
}

const ShowcaseGalleryContext = createContext<ShowcaseGalleryContextValue | null>(null)

function readOpenOrigin(element: HTMLElement | null): ShowcaseGalleryOpenOrigin | null {
  if (!element) return null
  const rect = element.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return null
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  }
}

export function ShowcaseGalleryProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<ShowcaseGalleryPhase>('closed')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [openOrigin, setOpenOrigin] = useState<ShowcaseGalleryOpenOrigin | null>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  const isOpen = phase !== 'closed'
  const isClosing = phase === 'closing'

  const registerTrigger = useCallback((element: HTMLElement | null) => {
    triggerRef.current = element
  }, [])

  const openAt = useCallback((key: ShowcaseShotKey) => {
    const index = SHOWCASE_GALLERY_ORDER.indexOf(key)
    if (index < 0) return
    setOpenOrigin(readOpenOrigin(triggerRef.current))
    setCurrentIndex(index)
    setPhase('open')
  }, [])

  const openGallery = useCallback((startIndex = 0) => {
    const clamped = Math.max(0, Math.min(SHOWCASE_GALLERY_ORDER.length - 1, startIndex))
    setOpenOrigin(readOpenOrigin(triggerRef.current))
    setCurrentIndex(clamped)
    setPhase('open')
  }, [])

  const close = useCallback(() => {
    setPhase((current) => (current === 'open' ? 'closing' : current))
  }, [])

  const finalizeClose = useCallback(() => {
    setPhase('closed')
    setOpenOrigin(null)
    const trigger = triggerRef.current
    if (trigger && document.contains(trigger)) {
      requestAnimationFrame(() => trigger.focus())
    }
  }, [])

  const goToIndex = useCallback((index: number) => {
    setCurrentIndex(Math.max(0, Math.min(SHOWCASE_GALLERY_ORDER.length - 1, index)))
  }, [])

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % SHOWCASE_GALLERY_ORDER.length)
  }, [])

  const goPrev = useCallback(() => {
    setCurrentIndex(
      (prev) => (prev - 1 + SHOWCASE_GALLERY_ORDER.length) % SHOWCASE_GALLERY_ORDER.length,
    )
  }, [])

  const value = useMemo(
    () => ({
      isOpen,
      isClosing,
      currentIndex,
      order: SHOWCASE_GALLERY_ORDER,
      openOrigin,
      openAt,
      openGallery,
      close,
      finalizeClose,
      goNext,
      goPrev,
      goToIndex,
      registerTrigger,
    }),
    [
      isOpen,
      isClosing,
      currentIndex,
      openOrigin,
      openAt,
      openGallery,
      close,
      finalizeClose,
      goNext,
      goPrev,
      goToIndex,
      registerTrigger,
    ],
  )

  return (
    <ShowcaseGalleryContext.Provider value={value}>{children}</ShowcaseGalleryContext.Provider>
  )
}

export function useShowcaseGallery() {
  const context = useContext(ShowcaseGalleryContext)
  if (!context) {
    throw new Error('useShowcaseGallery must be used within ShowcaseGalleryProvider')
  }
  return context
}
