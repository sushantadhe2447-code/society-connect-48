import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, CheckCircle2, Clock, FileText, Building2,
  IndianRupee, Megaphone, Activity, CreditCard,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  submitted: "bg-info text-info-foreground",
  assigned: "bg-warning text-warning-foreground",
  in_progress: "bg-primary text-primary-foreground",
  resolved: "bg-success text-success-foreground",
  closed: "bg-muted text-muted-foreground",
};

const CHART_COLORS = ["hsl(174,62%,38%)", "hsl(38,92%,50%)", "hsl(210,80%,55%)", "hsl(152,55%,42%)", "hsl(0,72%,55%)"];

type RecentActivity = {
  id: string;
  type: "complaint" | "payment" | "announcement";
  title: string;
  subtitle: string;
  time: string;
};

export function ResidentDashboard() {
  const { user, profile } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [pendingDues, setPendingDues] = useState(0);
  const [noticeCount, setNoticeCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("complaints").select("*").eq("resident_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setComplaints(data);
    });
    supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(3).then(({ data }) => {
      if (data) {
        setAnnouncements(data);
        setNoticeCount(data.length);
      }
    });
    supabase.from("maintenance_payments").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "pending").then(({ count }) => setPendingDues(count || 0));

    buildActivityFeed();
  }, [user]);

  const buildActivityFeed = async () => {
    if (!user) return;
    const activities: RecentActivity[] = [];

    const { data: myComplaints } = await supabase
      .from("complaints").select("id, title, complaint_number, created_at, category")
      .eq("resident_id", user.id)
      .order("created_at", { ascending: false }).limit(3);

    myComplaints?.forEach((c) => {
      activities.push({ id: c.id, type: "complaint", title: `Complaint raised: ${c.title}`, subtitle: `#${c.complaint_number} · ${c.category}`, time: c.created_at });
    });

    const { data: myPayments } = await supabase
      .from("maintenance_payments").select("id, month, amount, paid_at")
      .eq("user_id", user.id).eq("status", "paid")
      .order("paid_at", { ascending: false }).limit(3);

    myPayments?.forEach((p) => {
      activities.push({ id: p.id, type: "payment", title: `Maintenance payment done`, subtitle: `₹${p.amount} · ${p.month}`, time: p.paid_at || "" });
    });

    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    setRecentActivity(activities.slice(0, 6));
  };

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => ["submitted", "assigned", "in_progress"].includes(c.status)).length,
    resolved: complaints.filter((c) => c.status === "resolved" || c.status === "closed").length,
    critical: complaints.filter((c) => c.priority === "critical" || c.priority === "high").length,
  };

  const statusData = Object.entries(
    complaints.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name: name.replace("_", " "), value }));

  const statCards = [
    { title: "My Complaints", value: stats.total, icon: FileText, border: "border-l-primary" },
    { title: "Pending", value: stats.pending, icon: Clock, border: "border-l-warning" },
    { title: "Maintenance Dues", value: pendingDues, icon: IndianRupee, border: "border-l-destructive" },
    { title: "Notices", value: noticeCount, icon: Megaphone, border: "border-l-info" },
  ];

  const activityIcon = (type: string) => {
    if (type === "complaint") return <FileText className="w-4 h-4 text-warning" />;
    if (type === "payment") return <CreditCard className="w-4 h-4 text-success" />;
    return <Megaphone className="w-4 h-4 text-info" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-heading font-bold">Welcome to TownCare Residency Society Portal</h1>
        </div>
        <p className="text-muted-foreground">
          Hello, <span className="font-medium text-foreground">{profile?.full_name || "Resident"}</span>
          {profile?.wing && profile?.flat_number ? ` · Wing ${profile.wing}, Flat ${profile.flat_number}` : ""}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-heading">Complaint Status</CardTitle></CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-12">No complaints yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-heading">Recent Announcements</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {announcements.length > 0 ? announcements.map((a) => (
              <div key={a.id} className="p-3 rounded-lg bg-secondary">
                <div className="flex items-center gap-2 mb-1">
                  {a.is_emergency && <Badge className="bg-destructive text-destructive-foreground text-xs">Emergency</Badge>}
                  <span className="font-medium text-sm">{a.title}</span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{a.content}</p>
              </div>
            )) : (
              <p className="text-muted-foreground text-center py-8">No announcements</p>
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

      {/* Recent complaints */}
      {complaints.length > 0 && (
        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-heading">Recent Complaints</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {complaints.slice(0, 5).map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-muted-foreground">{c.complaint_number}</span>
                    <span className="font-medium text-sm truncate">{c.title}</span>
                  </div>
                  <Badge className={statusColors[c.status]}>{c.status.replace("_", " ")}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
