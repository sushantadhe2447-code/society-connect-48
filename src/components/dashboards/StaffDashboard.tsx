import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Clock, Wrench, ListChecks } from "lucide-react";
import { toast } from "sonner";

export function StaffDashboard() {
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);

  const fetchTasks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("complaints")
      .select("*")
      .eq("assigned_to", user.id)
      .order("created_at", { ascending: false });
    if (data) setTasks(data);
  };

  useEffect(() => { fetchTasks(); }, [user]);

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "resolved") updates.resolved_at = new Date().toISOString();
    const { error } = await supabase.from("complaints").update(updates).eq("id", id);
    if (error) toast.error("Failed to update");
    else { toast.success("Status updated"); fetchTasks(); }
  };

  const stats = {
    total: tasks.length,
    assigned: tasks.filter((t) => t.status === "assigned").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    resolved: tasks.filter((t) => t.status === "resolved" || t.status === "closed").length,
  };

  const statCards = [
    { title: "Total Assigned", value: stats.total, icon: ListChecks, border: "border-l-primary" },
    { title: "New Tasks", value: stats.assigned, icon: Clock, border: "border-l-warning" },
    { title: "In Progress", value: stats.inProgress, icon: Wrench, border: "border-l-info" },
    { title: "Completed", value: stats.resolved, icon: CheckCircle2, border: "border-l-success" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold">Welcome, {profile?.full_name || "Staff"}</h1>
        <p className="text-muted-foreground">Your assigned maintenance tasks</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-heading">Assigned Tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="p-4 rounded-lg bg-secondary space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-muted-foreground">{task.complaint_number}</span>
                    <Badge variant="outline" className="text-xs capitalize">{task.category}</Badge>
                    <Badge variant="outline" className="text-xs capitalize">{task.priority}</Badge>
                  </div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                  {task.wing && <p className="text-xs text-muted-foreground mt-1">Wing {task.wing}, Flat {task.flat_number}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Update status:</span>
                <Select value={task.status} onValueChange={(val) => updateStatus(task.id, val)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
          {tasks.length === 0 && <p className="text-muted-foreground text-center py-8">No tasks assigned yet</p>}
        </CardContent>
      </Card>
    </div>
  );
}
