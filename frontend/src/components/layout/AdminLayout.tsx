import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, LogOut, ShieldCheck, Users } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const menuItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Petugas', url: '/petugas', icon: Users },
]

export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { admin, logout } = useAuth()
  const [logoutOpen, setLogoutOpen] = useState<boolean>(false)

  const currentPage = menuItems.find((m) => m.url === location.pathname)

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-white/8">
          <div className="flex items-center gap-2 px-2 py-1">
            <div
              data-testid="admin-brand-icon"
              className="flex size-8 items-center justify-center rounded-lg bg-blue-500/20"
            >
              <ShieldCheck
                data-testid="admin-brand-shield"
                className="size-4 text-blue-400"
                aria-hidden
              />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">Survei PTSP</span>
              <span className="text-xs text-muted-foreground">Admin Panel</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={location.pathname === item.url}
                      onClick={() => navigate(item.url)}
                      className={cn(
                        'rounded-l-none border-l-2 transition-colors',
                        location.pathname === item.url
                          ? 'border-blue-400 bg-blue-500/10 text-foreground'
                          : 'border-transparent hover:border-blue-400/35 hover:bg-blue-500/6',
                      )}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-white/8">
          {admin && (
            <div
              data-testid="admin-footer-profile"
              className="flex items-center gap-2 rounded-md border border-white/8 bg-white/4 p-2"
            >
              <Avatar className="size-8">
                <AvatarFallback
                  data-testid="admin-avatar-fallback"
                  className="bg-blue-500/15 text-blue-400"
                >
                  {(admin.nama || admin.username).charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{admin.nama || admin.username}</p>
                <p className="truncate text-xs text-muted-foreground">@{admin.username}</p>
              </div>
            </div>
          )}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setLogoutOpen(true)}
                className="text-destructive hover:text-destructive"
              >
                <LogOut className="size-4" />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <main className="flex flex-1 flex-col">
        <header
          data-testid="admin-layout-header"
          className="sticky top-0 z-10 flex items-center gap-3 border-b border-white/8 bg-background/80 px-4 py-3 backdrop-blur-md"
        >
          <SidebarTrigger />
          <div className="flex-1">
            <h2 className="text-sm font-medium text-muted-foreground">
              {currentPage?.title ?? 'Admin'}
            </h2>
          </div>
          <ThemeToggle />
        </header>
        <div className="flex-1 p-4 md:p-6">
          <Outlet />
        </div>
      </main>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout dari Admin Panel?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan kembali ke halaman login. Pastikan tidak ada perubahan yang belum
              tersimpan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                logout()
                navigate('/login')
              }}
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  )
}
