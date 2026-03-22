import Image from 'next/image'

import { cn } from '@/lib/utils'
import wellstudioWordmark from './wellstudio-wordmark.jpeg'

type WellstudioWordmarkProps = {
  className?: string
  imageClassName?: string
  alt?: string
}

export function WellstudioWordmark({
  className,
  imageClassName,
  alt = 'WellStudio',
}: WellstudioWordmarkProps) {
  return (
    <span className={cn('relative inline-flex items-center justify-center', className)}>
      <Image
        src={wellstudioWordmark}
        alt={alt}
        sizes="(min-width: 1024px) 420px, 280px"
        className={cn('h-auto w-full object-contain', imageClassName)}
      />
    </span>
  )
}
