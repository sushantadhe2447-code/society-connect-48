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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Megaphone, Plus, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function AnnouncementsPage() {
  const { user, role } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [editAnnouncement, setEditAnnouncement] = useState<any>(null);
  const [form, setForm] = useState({ title: "", content: "", is_emergency: false });
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
    if (data) setAnnouncements(data);
    setLoading(false);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("announcements").insert({ ...form, created_by: user.id });
    if (error) { toast.error("Failed to create"); return; }

    // Notify all residents
    const { data: residents } = await supabase.from("user_roles").select("user_id").eq("role", "resident");
    if (residents?.length) {
      const notifs = residents.map((r) => ({
        user_id: r.user_id,
        title: form.is_emergency ? "🚨 Emergency Notice" : "New Announcement",
        message: form.title,
        type: "announcement",
      }));
      await supabase.from("notifications").insert(notifs);
    }

    toast.success("Announcement posted!");
    setShowCreate(false);
    setForm({ title: "", content: "", is_emergency: false });
    fetchAnnouncements();
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAnnouncement) return;
    const { error } = await supabase.from("announcements").update({ title: form.title, content: form.content, is_emergency: form.is_emergency }).eq("id", editAnnouncement.id);
    if (error) toast.error("Failed to update");
    else { toast.success("Announcement updated"); setEditAnnouncement(null); fetchAnnouncements(); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Announcement deleted"); fetchAnnouncements(); }
  };

  const openEdit = (a: any) => {
    setForm({ title: a.title, content: a.content, is_emergency: a.is_emergency });
    setEditAnnouncement(a);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Announcements</h1>
        {role === "admin" && (
          <Dialog open={showCreate} onOpenChange={(v) => { setShowCreate(v); if (v) setForm({ title: "", content: "", is_emergency: false }); }}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground hover:opacity-90 transition-opacity"><Plus className="w-4 h-4 mr-2" /> New Announcement</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Announcement</DialogTitle></DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 py-2">
                <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Content</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required /></div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.is_emergency} onCheckedChange={(v) => setForm({ ...form, is_emergency: v })} />
                  <Label>Emergency Broadcast</Label>
                </div>
                <Button type="submit" className="w-full gradient-primary text-primary-foreground hover:opacity-90 transition-opacity">Post Announcement</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editAnnouncement} onOpenChange={(v) => { if (!v) setEditAnnouncement(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Announcement</DialogTitle></DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 py-2">
            <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Content</Label><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} required /></div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_emergency} onCheckedChange={(v) => setForm({ ...form, is_emergency: v })} />
              <Label>Emergency Broadcast</Label>
            </div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground hover:opacity-90 transition-opacity">Update Announcement</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        {announcements.map((a) => (
          <Card key={a.id} className={`shadow-card hover:shadow-elevated transition-shadow ${a.is_emergency ? "border-l-4 border-l-destructive" : ""}`}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${a.is_emergency ? "bg-destructive text-destructive-foreground" : "gradient-primary text-primary-foreground"}`}>
                  {a.is_emergency ? <AlertTriangle className="w-5 h-5" /> : <Megaphone className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-heading font-semibold">{a.title}</h3>
                    {a.is_emergency && <Badge className="bg-destructive text-destructive-foreground">Emergency</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(a.created_at).toLocaleString()}</p>
                </div>
                {role === "admin" && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-secondary transition-colors" onClick={() => openEdit(a)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10 transition-colors"><Trash2 className="w-3.5 h-3.5" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Announcement</AlertDialogTitle>
                          <AlertDialogDescription>Are you sure you want to delete "{a.title}"? This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(a.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {announcements.length === 0 && (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center">
              <Megaphone className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No announcements yet</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Announcements from the society admin will appear here.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
