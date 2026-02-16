import {
  LayoutDashboard,
  MessageSquarePlus,
  ListChecks,
  Users,
  Calendar,
  Bell,
  Building2,
  BarChart3,
  LogOut,
  Megaphone,
  CreditCard,
  Wallet,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const navigationByRole = {
  resident: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "New Complaint", url: "/dashboard/complaints/new", icon: MessageSquarePlus },
    { title: "My Complaints", url: "/dashboard/complaints", icon: ListChecks },
    { title: "Payments", url: "/dashboard/payments", icon: CreditCard },
    { title: "Events", url: "/dashboard/events", icon: Calendar },
    { title: "Directory", url: "/dashboard/directory", icon: Users },
    { title: "Announcements", url: "/dashboard/announcements", icon: Megaphone },
    { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
  ],
  admin: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "All Complaints", url: "/dashboard/complaints", icon: ListChecks },
    { title: "Manage Staff", url: "/dashboard/staff", icon: Users },
    { title: "Payments", url: "/dashboard/payments", icon: CreditCard },
    { title: "Funds", url: "/dashboard/funds", icon: Wallet },
    { title: "Events", url: "/dashboard/events", icon: Calendar },
    { title: "Announcements", url: "/dashboard/announcements", icon: Megaphone },
    { title: "Directory", url: "/dashboard/directory", icon: Building2 },
    { title: "Analytics", url: "/dashboard/analytics", icon: BarChart3 },
    { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
  ],
  maintenance_staff: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Assigned Tasks", url: "/dashboard/complaints", icon: ListChecks },
    { title: "Events", url: "/dashboard/events", icon: Calendar },
    { title: "Notifications", url: "/dashboard/notifications", icon: Bell },
  ],
};

export function AppSidebar() {
  const { role, signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const items = navigationByRole[role || "resident"];

  return (
    <Sidebar className="border-r-0 gradient-sidebar" collapsible="icon">
      <div className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
          <Building2 className="w-5 h-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="font-heading font-bold text-lg text-sidebar-primary-foreground">TownCare</span>
        )}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 uppercase text-xs tracking-wider">
            {!collapsed && "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={signOut}
        >
          <LogOut className="w-5 h-5 mr-2" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
