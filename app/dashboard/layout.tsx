import { ProtectedRoute } from "@/components/auth/protected-route";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute><DashboardShell>{children}</DashboardShell></ProtectedRoute>;
}
