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
      className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden"
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
          className="object-cover object-[center_28%]"
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,12,0.72)_0%,rgba(8,10,12,0.58)_42%,rgba(8,10,12,0.82)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(79,137,197,0.28),transparent_36%)]" />
    </div>
  );
}
