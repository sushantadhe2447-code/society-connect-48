import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2, Clock, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const statusColors: Record<string, string> = {
  submitted: "bg-info text-info-foreground",
  assigned: "bg-warning text-warning-foreground",
  in_progress: "bg-primary text-primary-foreground",
  resolved: "bg-success text-success-foreground",
  closed: "bg-muted text-muted-foreground",
};

const CHART_COLORS = ["hsl(174,62%,38%)", "hsl(38,92%,50%)", "hsl(210,80%,55%)", "hsl(152,55%,42%)", "hsl(0,72%,55%)"];

export function ResidentDashboard() {
  const { user, profile } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("complaints").select("*").eq("resident_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setComplaints(data);
    });
    supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(3).then(({ data }) => {
      if (data) setAnnouncements(data);
    });
  }, [user]);

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => ["submitted", "assigned", "in_progress"].includes(c.status)).length,
    resolved: complaints.filter((c) => c.status === "resolved" || c.status === "closed").length,
    critical: complaints.filter((c) => c.priority === "critical" || c.priority === "high").length,
  };

  const statusData = Object.entries(
    complaints.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name: name.replace("_", " "), value }));

  const statCards = [
    { title: "Total Complaints", value: stats.total, icon: FileText, className: "border-l-4 border-l-primary" },
    { title: "Pending", value: stats.pending, icon: Clock, className: "border-l-4 border-l-warning" },
    { title: "Resolved", value: stats.resolved, icon: CheckCircle2, className: "border-l-4 border-l-success" },
    { title: "High Priority", value: stats.critical, icon: AlertTriangle, className: "border-l-4 border-l-destructive" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold">Welcome back, {profile?.full_name || "Resident"}</h1>
        <p className="text-muted-foreground">
          {profile?.wing && profile?.flat_number ? `Wing ${profile.wing}, Flat ${profile.flat_number}` : "Your complaint dashboard"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className={`shadow-card ${stat.className}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-heading font-bold">{stat.value}</p>
              </div>
              <stat.icon className="w-8 h-8 text-muted-foreground/40" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-heading">Complaint Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-12">No complaints yet. Create one to get started!</p>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-heading">Recent Announcements</CardTitle>
          </CardHeader>
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
      </div>

      {complaints.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-heading">Recent Complaints</CardTitle>
          </CardHeader>
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
