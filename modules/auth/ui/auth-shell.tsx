import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { WellstudioLogoMark } from "@/components/brand/wellstudio-logo-mark";
import type { AuthShellPanelContent } from "@/modules/auth/ui/auth-page-content";

/* ─────────────────────────────────────────────────────────
 * AUTH SHELL STORYBOARD
 *
 * Read top-to-bottom. Each `at` value is ms after mount.
 *
 *    0ms   shell surfaces appear with depth and edge highlight
 *  120ms   brand rail fades in, y 18 → 0
 *  220ms   brand copy settles next, now more compact
 *  320ms   action rail fades in as the primary focus
 *  420ms   legal footer softens into view
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  brandRail: 120, // primary brand surface appears first
  brandCopy: 220, // narrative content settles next
  actionRail: 320, // form rail becomes the dominant action area
  footer: 420, // legal footer arrives last with lower emphasis
};

type AuthShellProps = {
  panel: AuthShellPanelContent;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ panel, children, footer }: AuthShellProps) {
  const animationStyle = {
    "--auth-shell-brand-rail-delay": `${TIMING.brandRail}ms`,
    "--auth-shell-brand-copy-delay": `${TIMING.brandCopy}ms`,
    "--auth-shell-action-rail-delay": `${TIMING.actionRail}ms`,
    "--auth-shell-footer-delay": `${TIMING.footer}ms`,
  } as CSSProperties;

  return (
    <main
      id="main-content"
      data-variant={panel.variant}
      className="wellstudio-auth-shell wellstudio-auth-animate flex min-h-screen flex-col text-foreground"
      style={animationStyle}
    >
      <section
        data-slot="auth-brand-rail"
        className={cn(
          "relative overflow-hidden border-b border-black/18 text-white",
          panel.variant === "recovery"
            ? "wellstudio-auth-panel-recovery"
            : "wellstudio-auth-panel-entry",
        )}
      >
        <div className="wellstudio-auth-panel-glow absolute inset-0 opacity-90" />

        <div className="relative z-10 mx-auto max-w-[68rem] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-9">
          <div className="space-y-6 sm:space-y-8">
            <header className="flex items-center justify-between gap-3 rounded-full border border-white/12 bg-[color:color-mix(in_srgb,var(--wellstudio-ink)_84%,rgba(13,15,18,0.45))] px-3 py-2.5 text-white shadow-[0_24px_60px_rgba(8,10,12,0.22)] backdrop-blur-2xl sm:gap-4 sm:px-5 sm:py-3">
              <Link
                href="/"
                className="flex min-w-0 items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                <WellstudioLogoMark className="size-10 rounded-[1rem] shadow-none sm:size-12 sm:rounded-[1.1rem]" />
                <span className="block font-display text-xl uppercase tracking-[0.08em] text-white sm:text-2xl">
                  WellStudio
                </span>
              </Link>

              <nav
                aria-label="Public navigation"
                className="hidden items-center gap-5 text-sm text-white/74 lg:flex"
              >
                <Link
                  href="/"
                  className="rounded-full px-2 py-1 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  Inicio
                </Link>
                <Link
                  href="/login"
                  className="rounded-full px-2 py-1 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  Acceso
                </Link>
                <Link
                  href="/register"
                  className="rounded-full px-2 py-1 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                  Registro
                </Link>
              </nav>
            </header>

            <div data-slot="auth-brand-copy" className="max-w-[46rem]">
              <div className="space-y-2">
                <p className="text-[0.68rem] uppercase tracking-[0.26em] text-[var(--wellstudio-blue-soft)] sm:text-xs lg:text-sm">
                  {panel.eyebrow}
                </p>
                <h1 className="font-display text-balance text-[2.05rem] leading-[0.92] uppercase tracking-[0.05em] text-white sm:text-[2.9rem] lg:max-w-[20ch] lg:text-[4.15rem] xl:max-w-[22ch]">
                  {panel.title}
                </h1>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        data-slot="auth-action-rail"
        className="relative overflow-hidden border-b border-[color:color-mix(in_srgb,var(--wellstudio-blue)_10%,var(--border))] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,245,239,0.96))]"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,rgba(183,206,231,0.18),transparent)]" />

        <div className="relative z-10 mx-auto max-w-[68rem] px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="space-y-3">
            <div>{children}</div>

            {footer ? (
              <div
                data-slot="auth-footer"
                className="pt-4 text-sm text-muted-foreground"
              >
                {footer}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
