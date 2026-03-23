import {
  CalendarDays,
  type LucideIcon,
  LayoutGrid,
  Settings2,
  UserRound,
} from 'lucide-react'

export type MemberPortalNavItem = {
  href: '/app' | '/app/reservations' | '/app/profile' | '/app/account'
  label: string
  icon: LucideIcon
  matchMode: 'exact' | 'prefix'
}

export const memberPortalNavItems: readonly MemberPortalNavItem[] = [
  {
    href: '/app',
    label: 'Inicio',
    icon: LayoutGrid,
    matchMode: 'exact',
  },
  {
    href: '/app/reservations',
    label: 'Reservas',
    icon: CalendarDays,
    matchMode: 'prefix',
  },
  {
    href: '/app/profile',
    label: 'Perfil',
    icon: UserRound,
    matchMode: 'prefix',
  },
  {
    href: '/app/account',
    label: 'Cuenta',
    icon: Settings2,
    matchMode: 'prefix',
  },
] as const

export function isMemberPortalItemActive(
  pathname: string,
  item: MemberPortalNavItem,
) {
  if (item.matchMode === 'exact') {
    return pathname === item.href
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}
