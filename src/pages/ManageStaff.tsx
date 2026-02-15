import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Users, Trash2, Pencil } from "lucide-react";

const assignmentTypes = [
  "Gardener", "Garbage Collector", "Security Guard", "Sweeper", "Plumber",
  "Electrician", "Lift Operator", "Watchman", "Housekeeping", "Other",
];

const scheduleOptions = ["Daily", "Weekly", "Monthly", "On Demand"];

export default function ManageStaffPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ staff_user_id: "", assignment_type: "", description: "", schedule: "Daily", wing: "" });

  const fetchStaff = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "maintenance_staff");
    if (!roles?.length) { setStaff([]); return; }
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, phone").in("user_id", roles.map((r) => r.user_id));
    if (profiles) setStaff(profiles);
  };

  const fetchAssignments = async () => {
    const { data } = await supabase.from("staff_assignments").select("*").order("created_at", { ascending: false });
    if (data) setAssignments(data);
  };

  useEffect(() => { fetchStaff(); fetchAssignments(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("staff_assignments").insert({
      staff_user_id: form.staff_user_id,
      assignment_type: form.assignment_type,
      description: form.description,
      schedule: form.schedule.toLowerCase(),
      wing: form.wing || null,
      assigned_by: user.id,
    });
    if (error) toast.error("Failed to create assignment");
    else {
      toast.success("Staff assigned successfully");
      setShowCreate(false);
      setForm({ staff_user_id: "", assignment_type: "", description: "", schedule: "Daily", wing: "" });
      fetchAssignments();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("staff_assignments").update({ status }).eq("id", id);
    if (error) toast.error("Failed to update");
    else { toast.success("Status updated"); fetchAssignments(); }
  };

  const deleteAssignment = async (id: string) => {
    const { error } = await supabase.from("staff_assignments").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Assignment removed"); fetchAssignments(); }
  };

  const getStaffName = (userId: string) => staff.find((s) => s.user_id === userId)?.full_name || "Unknown";

  const statusColor: Record<string, string> = {
    active: "bg-success text-success-foreground",
    completed: "bg-muted text-muted-foreground",
    cancelled: "bg-destructive text-destructive-foreground",
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Manage Staff</h1>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> Assign Worker</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Assign Worker</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Staff Member</Label>
                <Select value={form.staff_user_id} onValueChange={(v) => setForm({ ...form, staff_user_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                  <SelectContent>
                    {staff.map((s) => (
                      <SelectItem key={s.user_id} value={s.user_id}>{s.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assignment Type</Label>
                <Select value={form.assignment_type} onValueChange={(v) => setForm({ ...form, assignment_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {assignmentTypes.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Schedule</Label>
                <Select value={form.schedule} onValueChange={(v) => setForm({ ...form, schedule: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {scheduleOptions.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Wing (optional)</Label><Input value={form.wing} onChange={(e) => setForm({ ...form, wing: e.target.value })} placeholder="e.g. A, B" /></div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the work..." /></div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={!form.staff_user_id || !form.assignment_type}>Assign</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Staff Members List */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="font-heading">Staff Members ({staff.length})</CardTitle></CardHeader>
        <CardContent>
          {staff.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {staff.map((s) => (
                <div key={s.user_id} className="p-3 rounded-lg bg-secondary flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-semibold">
                    {s.full_name?.charAt(0)?.toUpperCase() || "S"}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{s.full_name}</p>
                    {s.phone && <p className="text-xs text-muted-foreground">{s.phone}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No staff members registered yet</p>
          )}
        </CardContent>
      </Card>

      {/* Assignments List */}
      <Card className="shadow-card">
        <CardHeader><CardTitle className="font-heading">Work Assignments</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {assignments.map((a) => (
            <div key={a.id} className="p-4 rounded-lg bg-secondary space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{a.assignment_type}</h4>
                  <Badge className={statusColor[a.status] || "bg-muted text-muted-foreground"}>{a.status}</Badge>
                  <Badge variant="outline" className="text-xs capitalize">{a.schedule}</Badge>
                  {a.wing && <Badge variant="outline" className="text-xs">Wing {a.wing}</Badge>}
                </div>
                <div className="flex items-center gap-1">
                  {a.status === "active" && (
                    <Select onValueChange={(v) => updateStatus(a.id, v)}>
                      <SelectTrigger className="w-28 text-xs h-7"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteAssignment(a.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Assigned to: <span className="font-medium text-foreground">{getStaffName(a.staff_user_id)}</span></p>
              {a.description && <p className="text-sm text-muted-foreground">{a.description}</p>}
            </div>
          ))}
          {assignments.length === 0 && <p className="text-muted-foreground text-center py-4">No assignments yet</p>}
        </CardContent>
      </Card>
    </div>
  );
}
