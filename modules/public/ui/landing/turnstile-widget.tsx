'use client'

import { useEffect, useId, useRef } from 'react'

type TurnstileWidgetProps = {
  siteKey: string
  error?: string
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string
          theme?: 'light' | 'dark' | 'auto'
          appearance?: 'always' | 'execute' | 'interaction-only'
        },
      ) => string
      remove: (widgetId: string) => void
    }
    onWellstudioTurnstileLoad?: () => void
  }
}

const TURNSTILE_SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onWellstudioTurnstileLoad'

export function TurnstileWidget({ siteKey, error }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const labelId = useId()

  useEffect(() => {
    let cancelled = false

    function renderWidget() {
      if (cancelled || !containerRef.current || !window.turnstile) {
        return
      }

      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }

      containerRef.current.innerHTML = ''
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme: 'light',
        appearance: 'always',
      })
    }

    window.onWellstudioTurnstileLoad = renderWidget

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-wellstudio-turnstile="true"]',
    )

    if (window.turnstile) {
      renderWidget()
    } else if (!existing) {
      const script = document.createElement('script')
      script.src = TURNSTILE_SCRIPT_SRC
      script.async = true
      script.defer = true
      script.dataset.wellstudioTurnstile = 'true'
      document.head.appendChild(script)
    } else {
      existing.addEventListener('load', renderWidget)
    }

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
  }, [siteKey])

  return (
    <div className="space-y-2">
      <p id={labelId} className="sr-only">
        Verificación anti-spam
      </p>
      <div
        ref={containerRef}
        aria-labelledby={labelId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${labelId}-error` : undefined}
      />
      {error ? (
        <p id={`${labelId}-error`} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
