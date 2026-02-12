import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, CheckCircle2, AlertTriangle, TrendingUp, Clock } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";

const CHART_COLORS = ["hsl(174,62%,38%)", "hsl(38,92%,50%)", "hsl(210,80%,55%)", "hsl(152,55%,42%)", "hsl(0,72%,55%)", "hsl(280,60%,50%)"];

export function AdminDashboard() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [staffCount, setStaffCount] = useState(0);
  const [residentCount, setResidentCount] = useState(0);

  useEffect(() => {
    supabase.from("complaints").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      if (data) setComplaints(data);
    });
    supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "maintenance_staff").then(({ count }) => setStaffCount(count || 0));
    supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "resident").then(({ count }) => setResidentCount(count || 0));
  }, []);

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
    { title: "Total Complaints", value: stats.total, icon: FileText, border: "border-l-primary" },
    { title: "New / Unassigned", value: stats.pending, icon: AlertTriangle, border: "border-l-warning" },
    { title: "In Progress", value: stats.inProgress, icon: Clock, border: "border-l-info" },
    { title: "Resolved", value: stats.resolved, icon: CheckCircle2, border: "border-l-success" },
    { title: "Residents", value: residentCount, icon: Users, border: "border-l-primary" },
    { title: "Staff Members", value: staffCount, icon: Users, border: "border-l-accent" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Society management overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className={`shadow-card border-l-4 ${stat.border}`}>
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
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="font-heading">Recent Complaints</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {complaints.slice(0, 8).map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">{c.complaint_number}</span>
                  <span className="font-medium">{c.title}</span>
                  <Badge variant="outline" className="text-xs capitalize">{c.category}</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs capitalize">{c.priority}</Badge>
                  <Badge className={`text-xs ${c.status === "submitted" ? "bg-warning text-warning-foreground" : c.status === "resolved" ? "bg-success text-success-foreground" : "bg-primary text-primary-foreground"}`}>
                    {c.status.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            ))}
            {complaints.length === 0 && <p className="text-muted-foreground text-center py-8">No complaints yet</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
