import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Calendar, MapPin, Plus, Users, Pencil, Trash2 } from "lucide-react";

export default function EventsPage() {
  const { user, role } = useAuth();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [rsvps, setRsvps] = useState<Record<string, string>>({});
  const [rsvpCounts, setRsvpCounts] = useState<Record<string, number>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [editMeeting, setEditMeeting] = useState<any>(null);
  const [form, setForm] = useState({ title: "", description: "", meeting_date: "", location: "" });

  const fetchData = async () => {
    const { data } = await supabase.from("meetings").select("*").order("meeting_date", { ascending: true });
    if (data) setMeetings(data);

    // Fetch RSVP counts for all meetings
    const { data: allRsvps } = await supabase.from("meeting_rsvps").select("meeting_id, status");
    if (allRsvps) {
      const counts: Record<string, number> = {};
      allRsvps.forEach((r) => {
        if (r.status === "attending") {
          counts[r.meeting_id] = (counts[r.meeting_id] || 0) + 1;
        }
      });
      setRsvpCounts(counts);
    }

    if (user) {
      const { data: rsvpData } = await supabase.from("meeting_rsvps").select("meeting_id, status").eq("user_id", user.id);
      if (rsvpData) {
        const map: Record<string, string> = {};
        rsvpData.forEach((r) => { map[r.meeting_id] = r.status; });
        setRsvps(map);
      }
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleRsvp = async (meetingId: string, status: string) => {
    if (!user) return;
    const { error } = await supabase.from("meeting_rsvps").upsert({
      meeting_id: meetingId,
      user_id: user.id,
      status,
    }, { onConflict: "meeting_id,user_id" });
    if (error) toast.error("Failed to RSVP");
    else { toast.success("RSVP updated"); fetchData(); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("meetings").insert({
      ...form,
      created_by: user.id,
    });
    if (error) toast.error("Failed to create event");
    else { toast.success("Event created"); setShowCreate(false); setForm({ title: "", description: "", meeting_date: "", location: "" }); fetchData(); }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editMeeting) return;
    const { error } = await supabase.from("meetings").update({
      title: form.title,
      description: form.description,
      meeting_date: form.meeting_date,
      location: form.location,
    }).eq("id", editMeeting.id);
    if (error) toast.error("Failed to update event");
    else { toast.success("Event updated"); setEditMeeting(null); fetchData(); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("meetings").delete().eq("id", id);
    if (error) toast.error("Failed to delete event");
    else { toast.success("Event deleted"); fetchData(); }
  };

  const openEdit = (m: any) => {
    setForm({ title: m.title, description: m.description || "", meeting_date: m.meeting_date?.slice(0, 16) || "", location: m.location || "" });
    setEditMeeting(m);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Events & Meetings</h1>
        {role === "admin" && (
          <Dialog open={showCreate} onOpenChange={(v) => { setShowCreate(v); if (v) setForm({ title: "", description: "", meeting_date: "", location: "" }); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> New Event</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Event</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 py-2">
                <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Date & Time</Label><Input type="datetime-local" value={form.meeting_date} onChange={(e) => setForm({ ...form, meeting_date: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
                <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                <Button type="submit" className="w-full gradient-primary text-primary-foreground">Create Event</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editMeeting} onOpenChange={(v) => { if (!v) setEditMeeting(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Event</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 py-2">
            <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Date & Time</Label><Input type="datetime-local" value={form.meeting_date} onChange={(e) => setForm({ ...form, meeting_date: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground">Update Event</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {meetings.map((m) => {
          const isPast = new Date(m.meeting_date) < new Date();
          return (
            <Card key={m.id} className={`shadow-card ${isPast ? "opacity-60" : ""}`}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <h3 className="font-heading font-semibold text-lg">{m.title}</h3>
                  <div className="flex items-center gap-2">
                    {isPast ? <Badge variant="outline">Past</Badge> : <Badge className="bg-success text-success-foreground">Upcoming</Badge>}
                    {role === "admin" && (
                      <>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(m)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(m.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </>
                    )}
                  </div>
                </div>
                {m.description && <p className="text-sm text-muted-foreground">{m.description}</p>}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(m.meeting_date).toLocaleString()}</span>
                  {m.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {m.location}</span>}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{rsvpCounts[m.id] || 0} attending</span>
                </div>
                {!isPast && (
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant={rsvps[m.id] === "attending" ? "default" : "outline"} onClick={() => handleRsvp(m.id, "attending")} className={rsvps[m.id] === "attending" ? "gradient-primary text-primary-foreground" : ""}>
                      Attending
                    </Button>
                    <Button size="sm" variant={rsvps[m.id] === "not_attending" ? "destructive" : "outline"} onClick={() => handleRsvp(m.id, "not_attending")}>
                      Not Attending
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {meetings.length === 0 && (
          <Card className="col-span-2 shadow-card">
            <CardContent className="p-8 text-center text-muted-foreground">No events scheduled</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
