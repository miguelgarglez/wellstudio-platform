'use client'

import { CircleHelp } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'

type MemberInfoPopoverProps = {
  label: string
  description: string
}

export function MemberInfoPopover({
  label,
  description,
}: MemberInfoPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Más información sobre ${label.toLowerCase()}`}
            className="rounded-full text-[color:color-mix(in_srgb,var(--foreground)_52%,white)] hover:bg-[var(--muted)] hover:text-[var(--wellstudio-ink)]"
          >
            <CircleHelp aria-hidden="true" />
          </Button>
        }
      />
      <PopoverContent
        align="end"
        className="w-72 rounded-[1.2rem] border border-[color:color-mix(in_srgb,var(--border)_74%,white)] bg-white p-4 shadow-[0_18px_44px_rgba(16,18,24,0.12)]"
      >
        <PopoverHeader className="gap-2">
          <PopoverTitle className="text-sm text-[var(--wellstudio-ink)]">
            {label}
          </PopoverTitle>
          <PopoverDescription className="text-sm leading-7 text-[color:color-mix(in_srgb,var(--foreground)_74%,white)]">
            {description}
          </PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  )
}
