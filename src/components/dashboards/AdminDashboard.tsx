import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Users, CheckCircle2, AlertTriangle, Clock, Building2,
  CreditCard, Megaphone, Activity, ArrowUpRight, IndianRupee, UserCheck,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { format } from "date-fns";

const CHART_COLORS = [
  "hsl(174,62%,38%)", "hsl(38,92%,50%)", "hsl(210,80%,55%)",
  "hsl(152,55%,42%)", "hsl(0,72%,55%)", "hsl(280,60%,50%)",
];

type RecentActivity = {
  id: string;
  type: "complaint" | "payment" | "announcement";
  title: string;
  subtitle: string;
  time: string;
};

export function AdminDashboard() {
  const { profile } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [staffCount, setStaffCount] = useState(0);
  const [residentCount, setResidentCount] = useState(0);
  const [pendingDues, setPendingDues] = useState(0);
  const [noticeCount, setNoticeCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    // Complaints
    supabase.from("complaints").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setComplaints(data);
    });
    // Counts
    supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "maintenance_staff").then(({ count }) => setStaffCount(count || 0));
    supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "resident").then(({ count }) => setResidentCount(count || 0));
    // Pending dues
    supabase.from("maintenance_payments").select("*", { count: "exact", head: true }).eq("status", "pending").then(({ count }) => setPendingDues(count || 0));
    // Notices
    supabase.from("announcements").select("*", { count: "exact", head: true }).then(({ count }) => setNoticeCount(count || 0));

    // Recent activity feed
    buildActivityFeed();
  }, []);

  const buildActivityFeed = async () => {
    const activities: RecentActivity[] = [];

    const { data: recentComplaints } = await supabase
      .from("complaints")
      .select("id, title, complaint_number, created_at, category")
      .order("created_at", { ascending: false })
      .limit(3);

    recentComplaints?.forEach((c) => {
      activities.push({
        id: c.id,
        type: "complaint",
        title: `Complaint raised: ${c.title}`,
        subtitle: `#${c.complaint_number} · ${c.category}`,
        time: c.created_at,
      });
    });

    const { data: recentPayments } = await supabase
      .from("maintenance_payments")
      .select("id, month, amount, paid_at, status")
      .eq("status", "paid")
      .order("paid_at", { ascending: false })
      .limit(3);

    recentPayments?.forEach((p) => {
      activities.push({
        id: p.id,
        type: "payment",
        title: `Maintenance payment received`,
        subtitle: `₹${p.amount} · ${p.month}`,
        time: p.paid_at || p.month,
      });
    });

    const { data: recentAnnouncements } = await supabase
      .from("announcements")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(2);

    recentAnnouncements?.forEach((a) => {
      activities.push({
        id: a.id,
        type: "announcement",
        title: `Notice posted: ${a.title}`,
        subtitle: "Announcement",
        time: a.created_at,
      });
    });

    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setRecentActivity(activities.slice(0, 8));
  };

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === "submitted").length,
    inProgress: complaints.filter((c) => c.status === "in_progress" || c.status === "assigned").length,
    resolved: complaints.filter((c) => c.status === "resolved" || c.status === "closed").length,
  };

  const categoryData = Object.entries(
    complaints.reduce((acc, c) => { acc[c.category] = (acc[c.category] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const statusData = Object.entries(
    complaints.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name: name.replace("_", " "), value }));

  const statCards = [
    { title: "Total Residents", value: residentCount, icon: Users, border: "border-l-primary" },
    { title: "Pending Complaints", value: stats.pending, icon: AlertTriangle, border: "border-l-warning" },
    { title: "Maintenance Dues", value: pendingDues, icon: IndianRupee, border: "border-l-destructive" },
    { title: "Active Notices", value: noticeCount, icon: Megaphone, border: "border-l-info" },
    { title: "In Progress", value: stats.inProgress, icon: Clock, border: "border-l-accent" },
    { title: "Staff Members", value: staffCount, icon: UserCheck, border: "border-l-primary" },
  ];

  const activityIcon = (type: string) => {
    if (type === "complaint") return <FileText className="w-4 h-4 text-warning" />;
    if (type === "payment") return <CreditCard className="w-4 h-4 text-success" />;
    return <Megaphone className="w-4 h-4 text-info" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-heading font-bold">Welcome to TownCare Residency Society Portal</h1>
          </div>
          <p className="text-muted-foreground">
            Hello, <span className="font-medium text-foreground">{profile?.full_name || "Admin"}</span> · Society management overview
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className={`shadow-card border-l-4 ${stat.border} hover:shadow-elevated transition-shadow`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-heading font-bold">{stat.value}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-muted-foreground/60" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="shadow-card lg:col-span-2">
          <CardHeader><CardTitle className="font-heading">Complaints by Category</CardTitle></CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categoryData}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(174,62%,38%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-12">No data yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentActivity.length > 0 ? recentActivity.map((a) => (
              <div key={a.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-secondary transition-colors">
                <div className="mt-0.5">{activityIcon(a.type)}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-tight truncate">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.subtitle}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                    {(() => { try { return format(new Date(a.time), "dd MMM, hh:mm a"); } catch { return ""; } })()}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-muted-foreground text-center py-8 text-sm">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status pie + Recent complaints */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-heading">Status Distribution</CardTitle></CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-12">No data yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-heading">Recent Complaints</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {complaints.slice(0, 6).map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs text-muted-foreground">{c.complaint_number}</span>
                    <span className="font-medium truncate">{c.title}</span>
                    <Badge variant="outline" className="text-xs capitalize hidden sm:inline-flex">{c.category}</Badge>
                  </div>
                  <Badge className={`text-xs shrink-0 ${c.status === "submitted" ? "bg-warning text-warning-foreground" : c.status === "resolved" ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground"}`}>
                    {c.status.replace("_", " ")}
                  </Badge>
                </div>
              ))}
              {complaints.length === 0 && <p className="text-muted-foreground text-center py-8">No complaints yet</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
