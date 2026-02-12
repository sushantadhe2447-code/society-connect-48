import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { FileText, TrendingUp, Clock, CheckCircle2 } from "lucide-react";

const COLORS = ["hsl(174,62%,38%)", "hsl(38,92%,50%)", "hsl(210,80%,55%)", "hsl(152,55%,42%)", "hsl(0,72%,55%)", "hsl(280,60%,50%)"];

export default function AnalyticsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("complaints").select("*").then(({ data }) => {
      if (data) setComplaints(data);
    });
  }, []);

  const categoryData = Object.entries(
    complaints.reduce((acc, c) => { acc[c.category] = (acc[c.category] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const statusData = Object.entries(
    complaints.reduce((acc, c) => { acc[c.status] = (acc[c.status] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name: name.replace("_", " "), value }));

  const wingData = Object.entries(
    complaints.reduce((acc, c) => { const w = c.wing || "Unknown"; acc[w] = (acc[w] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name: `Wing ${name}`, value }));

  const priorityData = Object.entries(
    complaints.reduce((acc, c) => { acc[c.priority] = (acc[c.priority] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const avgResolutionDays = (() => {
    const resolved = complaints.filter((c) => c.resolved_at);
    if (!resolved.length) return "N/A";
    const avg = resolved.reduce((sum, c) => {
      return sum + (new Date(c.resolved_at).getTime() - new Date(c.created_at).getTime()) / (1000 * 60 * 60 * 24);
    }, 0) / resolved.length;
    return avg.toFixed(1) + " days";
  })();

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-heading font-bold">Analytics</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card border-l-4 border-l-primary"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Total Complaints</p><p className="text-3xl font-heading font-bold">{complaints.length}</p></CardContent></Card>
        <Card className="shadow-card border-l-4 border-l-success"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Resolved</p><p className="text-3xl font-heading font-bold">{complaints.filter(c => c.status === "resolved" || c.status === "closed").length}</p></CardContent></Card>
        <Card className="shadow-card border-l-4 border-l-warning"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Pending</p><p className="text-3xl font-heading font-bold">{complaints.filter(c => c.status === "submitted").length}</p></CardContent></Card>
        <Card className="shadow-card border-l-4 border-l-info"><CardContent className="p-4"><p className="text-sm text-muted-foreground">Avg Resolution</p><p className="text-3xl font-heading font-bold">{avgResolutionDays}</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-heading">By Category</CardTitle></CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categoryData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(174,62%,38%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-12">No data</p>}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-heading">By Status</CardTitle></CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                    {statusData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-12">No data</p>}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-heading">By Wing</CardTitle></CardHeader>
          <CardContent>
            {wingData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={wingData}>
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(152,55%,42%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-12">No data</p>}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-heading">By Priority</CardTitle></CardHeader>
          <CardContent>
            {priorityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={priorityData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label>
                    {priorityData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-12">No data</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
