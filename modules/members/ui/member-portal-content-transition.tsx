"use client";

import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { MemberPortalTransitionDirection } from "@/modules/members/ui/member-portal-navigation";

/* ─────────────────────────────────────────────────────────
 * MEMBER PORTAL TRANSITION STORYBOARD
 *
 * Read top-to-bottom. Each `at` value is ms after pathname changes.
 *
 *    0ms   nav state flips instantly in the persistent shell
 *    0ms   incoming panel starts offset 14px on the travel axis
 *   80ms   opacity is almost fully restored, movement nearly settled
 *  180ms   panel reaches rest and motion disappears
 * ───────────────────────────────────────────────────────── */

const TIMING = {
  duration: 300,
  distance: 25,
};

type MemberPortalContentTransitionProps = {
  children: ReactNode;
  className?: string;
  direction: MemberPortalTransitionDirection | "hold";
  isPending: boolean;
  pathname: string;
};

export function MemberPortalContentTransition({
  children,
  className,
  direction,
  isPending,
  pathname,
}: MemberPortalContentTransitionProps) {
  const animationStyle = {
    "--member-portal-panel-duration": `${TIMING.duration}ms`,
    "--member-portal-panel-distance": `${TIMING.distance}px`,
  } as CSSProperties;

  return (
    <div
      key={pathname}
      data-slot="member-portal-content"
      data-direction={direction}
      data-pending={isPending ? "true" : "false"}
      className={cn("wellstudio-member-portal-animate relative", className)}
      style={animationStyle}
    >
      <div data-slot="member-portal-content-inner">{children}</div>
    </div>
  );
}
