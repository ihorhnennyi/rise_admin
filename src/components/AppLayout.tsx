import { Outlet, useNavigate } from 'react-router-dom'
import { AppHeader } from '@admin/components/AppHeader'
import { AppSidebar } from '@admin/components/AppSidebar'
import { Toaster } from '@admin/components/Toaster'

export function AppLayout() {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh w-full bg-[hsl(var(--background))]">
      <AppHeader onLoggedOut={() => navigate('/login', { replace: true })} />
      <Toaster />
      <div className="flex w-full">
        <AppSidebar />
        <main className="w-full px-6 py-10">{<Outlet />}</main>
      </div>
    </div>
  )
}

