"use client";

import Image, { type StaticImageData } from "next/image";
import { useEffect, useRef } from "react";

type LandingHeroParallaxBackdropProps = {
  image: StaticImageData;
  alt: string;
};

export function LandingHeroParallaxBackdrop({
  image,
  alt,
}: LandingHeroParallaxBackdropProps) {
  const mediaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) {
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = () => {
      frame = 0;
      if (reduceMotion.matches) {
        media.style.transform = "translate3d(0, 0, 0)";
        return;
      }

      const offset = Math.min(window.scrollY, 420) * 0.28;
      media.style.transform = `translate3d(0, ${offset}px, 0)`;
    };

    const onScroll = () => {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    reduceMotion.addEventListener("change", update);

    return () => {
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
      window.removeEventListener("scroll", onScroll);
      reduceMotion.removeEventListener("change", update);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        ref={mediaRef}
        className="absolute inset-[-18%_0] will-change-transform"
      >
        <Image
          src={image}
          alt={alt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_28%] lg:object-[72%_center]"
        />
      </div>

      {/* Mobile: vertical readability veil */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,12,0.72)_0%,rgba(8,10,12,0.58)_42%,rgba(8,10,12,0.82)_100%)] lg:hidden" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(79,137,197,0.28),transparent_36%)] lg:hidden" />

      {/* Desktop: left text shelter + right image reveal */}
      <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(8,10,12,0.92)_0%,rgba(8,10,12,0.78)_34%,rgba(8,10,12,0.38)_58%,rgba(8,10,12,0.22)_78%,rgba(8,10,12,0.42)_100%)] lg:block" />
      <div className="absolute inset-0 hidden bg-[linear-gradient(180deg,rgba(8,10,12,0.42)_0%,transparent_28%,rgba(8,10,12,0.55)_100%)] lg:block" />
      <div className="absolute inset-0 hidden bg-[radial-gradient(circle_at_16%_18%,rgba(79,137,197,0.26),transparent_34%)] lg:block" />
    </div>
  );
}
