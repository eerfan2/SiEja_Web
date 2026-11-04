"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpenCheck,
  FolderArchive,
  Gauge,
  KeyRound,
  LogOut,
  RefreshCcw,
  Settings,
  Users,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { logoutTeacher } from "@/services/auth-service";

const MENU = [
  ["Dashboard", "/dashboard", Gauge],
  ["Data Siswa", "/dashboard/siswa", Users],
  ["Progress", "/dashboard/progress", BarChart3],
  ["Remedial", "/dashboard/remedial", RefreshCcw],
  ["Kelola Stage", "/dashboard/stage", KeyRound],
  ["Katalog Materi", "/dashboard/katalog", FolderArchive],
  ["Kelola Soal", "/dashboard/soal", BookOpenCheck],
  ["Pengaturan", "/dashboard/settings", Settings],
] as const;

const BOTTOM_MENU = MENU.filter(([, href]) => ["/dashboard", "/dashboard/siswa", "/dashboard/progress", "/dashboard/soal"].includes(href));

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  function isActive(href: string) {
    return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
  }

  async function handleLogout() {
    await logoutTeacher();
    router.replace("/login-guru");
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": "17rem" } as React.CSSProperties}>
      <Sidebar collapsible="offcanvas" className="border-r transition-all duration-200 ease-out">
        <SidebarHeader className="border-b p-4"><Logo compact /></SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Dashboard Guru</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {MENU.map(([label, href, Icon]) => (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton asChild isActive={isActive(href)} tooltip={label} size="lg" className="rounded-xl px-3 transition-all duration-200 ease-out hover:translate-x-0.5 data-[active=true]:bg-primary data-[active=true]:text-white data-[active=true]:shadow-sm">
                      <Link href={href}><Icon /><span>{label}</span></Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t p-4">
          <Button variant="ghost" className="h-11 w-full justify-start rounded-xl text-destructive transition-all duration-150 ease-out hover:bg-red-50 hover:text-destructive active:scale-[0.98]" onClick={handleLogout}><LogOut className="size-4" /> Logout</Button>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-w-0 bg-background">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-md md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger className="size-10 transition-transform duration-150 active:scale-95 md:hidden" aria-label="Buka menu dashboard" />
            <div className="min-w-0"><p className="truncate text-sm font-bold">Dashboard Guru SiEja</p></div>
          </div>
          <Button variant="outline" size="sm" asChild className="rounded-xl"><Link href="/">Website Publik</Link></Button>
        </header>
        <main className="page-enter min-w-0 flex-1 p-4 pb-28 sm:p-6 sm:pb-28 lg:p-8 lg:pb-8">{children}</main>
        <nav className="mobile-safe-bottom fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-white/98 px-2 pt-2 shadow-[0_-8px_30px_rgba(74,62,61,.08)] backdrop-blur md:hidden" aria-label="Navigasi dashboard cepat">
          {BOTTOM_MENU.map(([label, href, Icon]) => (
            <Link key={href} href={href} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold transition-all duration-200 active:scale-95 ${isActive(href) ? "bg-[#eeeafd] text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon className="size-5" /><span className="truncate">{label}</span>
            </Link>
          ))}
        </nav>
      </SidebarInset>
    </SidebarProvider>
  );
}
