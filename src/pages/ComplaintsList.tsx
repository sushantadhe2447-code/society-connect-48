import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Search, Star } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const statusColors: Record<string, string> = {
  submitted: "bg-info text-info-foreground",
  assigned: "bg-warning text-warning-foreground",
  in_progress: "bg-primary text-primary-foreground",
  resolved: "bg-success text-success-foreground",
  closed: "bg-muted text-muted-foreground",
};

const priorityColors: Record<string, string> = {
  low: "border-success text-success",
  medium: "border-info text-info",
  high: "border-warning text-warning",
  critical: "border-destructive text-destructive",
};

export default function ComplaintsList() {
  const { user, role } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");

  const fetchComplaints = async () => {
    if (!user) return;
    let query = supabase.from("complaints").select("*").order("created_at", { ascending: false });
    if (role === "resident") query = query.eq("resident_id", user.id);
    if (role === "maintenance_staff") query = query.eq("assigned_to", user.id);
    const { data } = await query;
    if (data) setComplaints(data);
  };

  const fetchStaff = async () => {
    if (role !== "admin") return;
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "maintenance_staff");
    if (!roles?.length) return;
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", roles.map((r) => r.user_id));
    if (profiles) setStaff(profiles);
  };

  useEffect(() => { fetchComplaints(); fetchStaff(); }, [user, role]);

  const assignToStaff = async (complaintId: string, staffId: string) => {
    const { error } = await supabase.from("complaints").update({
      assigned_to: staffId,
      status: "assigned" as any,
      assigned_at: new Date().toISOString(),
    }).eq("id", complaintId);
    if (error) toast.error("Failed to assign");
    else { toast.success("Assigned successfully"); fetchComplaints(); }
  };

  const closeComplaint = async (complaintId: string) => {
    const { error } = await supabase.from("complaints").update({
      status: "closed" as any,
      closed_at: new Date().toISOString(),
      rating,
      rating_comment: ratingComment,
    }).eq("id", complaintId);
    if (error) toast.error("Failed to close");
    else { toast.success("Complaint closed with rating"); setSelectedComplaint(null); fetchComplaints(); }
  };

  const filtered = complaints.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (categoryFilter !== "all" && c.category !== categoryFilter) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.complaint_number.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-heading font-bold">
        {role === "admin" ? "All Complaints" : role === "maintenance_staff" ? "Assigned Tasks" : "My Complaints"}
      </h1>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by title or ID..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {["water", "electricity", "security", "cleanliness", "plumbing", "elevator", "parking", "noise", "other"].map((c) => (
              <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((c) => (
          <Card key={c.id} className="shadow-card hover:shadow-elevated transition-shadow">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs text-muted-foreground">{c.complaint_number}</span>
                    <Badge variant="outline" className={`text-xs capitalize ${priorityColors[c.priority]}`}>{c.priority}</Badge>
                    <Badge variant="outline" className="text-xs capitalize">{c.category}</Badge>
                  </div>
                  <p className="font-heading font-semibold">{c.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-1">{c.description}</p>
                  {c.wing && <p className="text-xs text-muted-foreground">Wing {c.wing}, Flat {c.flat_number}</p>}
                  <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge className={statusColors[c.status]}>{c.status.replace("_", " ")}</Badge>

                  {role === "admin" && c.status === "submitted" && staff.length > 0 && (
                    <Select onValueChange={(staffId) => assignToStaff(c.id, staffId)}>
                      <SelectTrigger className="w-32 text-xs"><SelectValue placeholder="Assign to" /></SelectTrigger>
                      <SelectContent>
                        {staff.map((s) => (
                          <SelectItem key={s.user_id} value={s.user_id}>{s.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {role === "resident" && c.status === "resolved" && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => { setSelectedComplaint(c); setRating(0); setRatingComment(""); }}>
                          <Star className="w-4 h-4 mr-1" /> Rate & Close
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Rate Resolution</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="flex gap-1 justify-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button key={star} onClick={() => setRating(star)}>
                                <Star className={`w-8 h-8 ${star <= rating ? "fill-warning text-warning" : "text-muted-foreground/30"}`} />
                              </button>
                            ))}
                          </div>
                          <Textarea placeholder="Optional feedback..." value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} />
                          <Button className="w-full gradient-primary text-primary-foreground" onClick={() => closeComplaint(c.id)} disabled={rating === 0}>
                            Submit Rating & Close
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  {c.rating && (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: c.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-warning text-warning" />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card className="shadow-card">
            <CardContent className="p-8 text-center text-muted-foreground">No complaints found</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
