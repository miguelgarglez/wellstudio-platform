"use client";

import Link from "next/link";

import { WellstudioLogoMark } from "@/components/brand/wellstudio-logo-mark";
import { cn } from "@/lib/utils";
import { LandingSectionMenu } from "@/modules/public/ui/landing/landing-section-menu";

type LandingNavigationLink = {
  href: string;
  label: string;
};

type LandingStickyHeaderProps = {
  loginButtonClassName: string;
  links: readonly LandingNavigationLink[];
};

export function LandingStickyHeader({
  loginButtonClassName,
  links,
}: LandingStickyHeaderProps) {
  return (
    <div className="sticky top-2 z-50 px-4 pt-2 sm:top-3 sm:px-6 sm:pt-3 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-2">
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
            aria-label="Navegación pública"
            className="hidden items-center gap-5 text-sm text-white/74 lg:flex"
          >
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-2 py-1 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <Link href="/login" className={cn(loginButtonClassName)}>
            Acceso socios
          </Link>
        </header>

        <LandingSectionMenu links={links} />
      </div>
    </div>
  );
}
