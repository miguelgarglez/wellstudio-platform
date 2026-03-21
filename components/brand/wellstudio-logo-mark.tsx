import Image from 'next/image'

import { cn } from '@/lib/utils'
import wellstudioLogoMark from './wellstudio-logo-mark.jpeg'

type WellstudioLogoMarkProps = {
  className?: string
  imageClassName?: string
}

export function WellstudioLogoMark({
  className,
  imageClassName,
}: WellstudioLogoMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden',
        className,
      )}
    >
      <Image
        src={wellstudioLogoMark}
        alt=""
        sizes="48px"
        className={cn('size-full object-contain', imageClassName)}
      />
    </span>
  )
}
