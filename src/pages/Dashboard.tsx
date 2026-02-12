import { useAuth } from "@/hooks/useAuth";
import { ResidentDashboard } from "@/components/dashboards/ResidentDashboard";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { StaffDashboard } from "@/components/dashboards/StaffDashboard";

export default function DashboardPage() {
  const { role } = useAuth();

  if (role === "admin") return <AdminDashboard />;
  if (role === "maintenance_staff") return <StaffDashboard />;
  return <ResidentDashboard />;
}
