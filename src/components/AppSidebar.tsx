import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '@admin/nav/nav'
import { useMe } from '@admin/hooks/useMe'
import { cn } from '@admin/lib/utils'

export function AppSidebar() {
  const { me } = useMe()
  const items = NAV_ITEMS.filter((item) => !item.superadminOnly || me?.role === 'superadmin')

  return (
    <aside className="hidden md:block md:w-72 md:shrink-0">
      <div className="sticky top-14 h-[calc(100dvh-3.5rem)] border-r border-[hsl(var(--border))] bg-[hsl(var(--background))]">
        <nav className="flex h-full flex-col gap-1 p-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--foreground))]',
                  isActive &&
                    'bg-[hsl(var(--accent))] text-[hsl(var(--foreground))] shadow-[0_1px_0_0_hsl(var(--border)/0.8)]',
                )
              }
            >
              <item.icon className="size-4 opacity-80 group-hover:opacity-100" />
              <span className="leading-tight">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  )
}

