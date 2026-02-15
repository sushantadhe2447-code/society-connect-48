import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bell, Check, AlertTriangle, Info, CheckCircle, Send, Plus } from "lucide-react";
import { toast } from "sonner";

const typeIcons: Record<string, any> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  complaint: Bell,
};

export default function NotificationsPage() {
  const { user, role } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);
  const [showSend, setShowSend] = useState(false);
  const [sendForm, setSendForm] = useState({ title: "", message: "", type: "info", target: "all" });

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setNotifications(data);
  };

  const fetchResidents = async () => {
    if (role !== "admin" && role !== "maintenance_staff") return;
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "resident");
    if (!roles?.length) return;
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, wing, flat_number").in("user_id", roles.map((r) => r.user_id));
    if (profiles) setResidents(profiles);
  };

  useEffect(() => { fetchNotifications(); fetchResidents(); }, [user, role]);

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    fetchNotifications();
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    toast.success("All marked as read");
    fetchNotifications();
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    let targetUsers: string[] = [];
    if (sendForm.target === "all") {
      targetUsers = residents.map((r) => r.user_id);
    } else {
      targetUsers = [sendForm.target];
    }

    if (targetUsers.length === 0) {
      toast.error("No recipients found");
      return;
    }

    const notifications = targetUsers.map((uid) => ({
      user_id: uid,
      title: sendForm.title,
      message: sendForm.message,
      type: sendForm.type,
    }));

    const { error } = await supabase.from("notifications").insert(notifications);
    if (error) toast.error("Failed to send notification");
    else {
      toast.success(`Notification sent to ${targetUsers.length} user(s)`);
      setShowSend(false);
      setSendForm({ title: "", message: "", type: "info", target: "all" });
    }
  };

  const canSend = role === "admin" || role === "maintenance_staff";

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Notifications</h1>
        <div className="flex gap-2">
          {canSend && (
            <Dialog open={showSend} onOpenChange={setShowSend}>
              <DialogTrigger asChild>
                <Button className="gradient-primary text-primary-foreground"><Send className="w-4 h-4 mr-2" /> Send Notification</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Send Notification</DialogTitle></DialogHeader>
                <form onSubmit={handleSendNotification} className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Recipient</Label>
                    <Select value={sendForm.target} onValueChange={(v) => setSendForm({ ...sendForm, target: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Residents</SelectItem>
                        {residents.map((r) => (
                          <SelectItem key={r.user_id} value={r.user_id}>
                            {r.full_name} {r.wing ? `(Wing ${r.wing}, Flat ${r.flat_number})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={sendForm.type} onValueChange={(v) => setSendForm({ ...sendForm, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Info</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Title</Label><Input value={sendForm.title} onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })} required /></div>
                  <div className="space-y-2"><Label>Message</Label><Textarea value={sendForm.message} onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })} required /></div>
                  <Button type="submit" className="w-full gradient-primary text-primary-foreground">Send Notification</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <Check className="w-4 h-4 mr-1" /> Mark all read
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {notifications.map((n) => {
          const Icon = typeIcons[n.type] || Bell;
          return (
            <Card key={n.id} className={`shadow-card transition-all ${!n.is_read ? "border-l-4 border-l-primary bg-primary/5" : ""}`}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${!n.is_read ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.is_read ? "font-semibold" : ""}`}>{n.title}</p>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
                {!n.is_read && (
                  <Button variant="ghost" size="sm" onClick={() => markAsRead(n.id)}>
                    <Check className="w-4 h-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
        {notifications.length === 0 && (
          <Card className="shadow-card">
            <CardContent className="p-8 text-center text-muted-foreground">No notifications</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
