import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function DashboardLayout() {
  const { user, loading, profile, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b bg-card flex items-center gap-4 px-4 lg:px-6 sticky top-0 z-10">
            <SidebarTrigger />
            <div className="flex-1 flex items-center gap-4">
              <div className="relative max-w-md flex-1 hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search complaints, events..." className="pl-9 bg-secondary border-0" />
              </div>
            </div>

            <NotificationBell />

            <div className="flex items-center gap-2 pl-2 border-l">
              <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-semibold shadow-sm cursor-default">
                {initials}
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-medium leading-none">{profile?.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground capitalize">{role?.replace("_", " ")}</p>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
