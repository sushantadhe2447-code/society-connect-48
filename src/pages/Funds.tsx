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
import { Plus, TrendingUp, TrendingDown, IndianRupee, Trash2 } from "lucide-react";

const categories = ["Maintenance", "Repairs", "Events", "Utilities", "Security", "Cleaning", "Gardening", "Miscellaneous"];

export default function FundsPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", type: "income", amount: "", description: "", category: "Maintenance" });

  const fetchEntries = async () => {
    const { data } = await supabase.from("society_funds").select("*").order("created_at", { ascending: false });
    if (data) setEntries(data);
  };

  useEffect(() => { fetchEntries(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("society_funds").insert({
      title: form.title,
      type: form.type,
      amount: parseFloat(form.amount),
      description: form.description,
      category: form.category,
      created_by: user.id,
    });
    if (error) toast.error("Failed to add entry");
    else { toast.success("Entry added"); setShowCreate(false); setForm({ title: "", type: "income", amount: "", description: "", category: "Maintenance" }); fetchEntries(); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("society_funds").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Entry removed"); fetchEntries(); }
  };

  const totalIncome = entries.filter((e) => e.type === "income").reduce((sum, e) => sum + Number(e.amount), 0);
  const totalExpense = entries.filter((e) => e.type === "expense").reduce((sum, e) => sum + Number(e.amount), 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Society Funds</h1>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> Add Entry</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Fund Entry</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Amount (₹)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground">Add Entry</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-card border-l-4 border-l-success">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Income</p>
            <p className="text-2xl font-heading font-bold flex items-center text-success"><IndianRupee className="w-5 h-5" />{totalIncome.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-l-4 border-l-destructive">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-heading font-bold flex items-center text-destructive"><IndianRupee className="w-5 h-5" />{totalExpense.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-l-4 border-l-primary">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Current Balance</p>
            <p className={`text-2xl font-heading font-bold flex items-center ${balance >= 0 ? "text-success" : "text-destructive"}`}><IndianRupee className="w-5 h-5" />{balance.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="font-heading">Transaction History</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {entries.map((e) => (
            <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary text-sm">
              <div className="flex items-center gap-3">
                {e.type === "income" ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
                <div>
                  <p className="font-medium">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{e.category} · {new Date(e.created_at).toLocaleDateString()}</p>
                  {e.description && <p className="text-xs text-muted-foreground">{e.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-semibold flex items-center ${e.type === "income" ? "text-success" : "text-destructive"}`}>
                  {e.type === "income" ? "+" : "-"}<IndianRupee className="w-3 h-3" />{Number(e.amount).toLocaleString()}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(e.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
          {entries.length === 0 && <p className="text-muted-foreground text-center py-4">No fund entries yet</p>}
        </CardContent>
      </Card>
    </div>
  );
}
