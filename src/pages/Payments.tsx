import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CreditCard, CheckCircle2, Clock, IndianRupee } from "lucide-react";

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const formatMonth = (m: string) => {
  const [year, month] = m.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

export default function PaymentsPage() {
  const { user, role } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [showPay, setShowPay] = useState(false);
  const [form, setForm] = useState({ amount: "2000", month: currentMonth(), payment_method: "online" });
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [residents, setResidents] = useState<any[]>([]);

  const fetchPayments = async () => {
    if (!user) return;
    if (role === "admin") {
      const { data } = await supabase.from("maintenance_payments").select("*").order("created_at", { ascending: false });
      if (data) setAllPayments(data);
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "resident");
      if (roles?.length) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, wing, flat_number").in("user_id", roles.map((r) => r.user_id));
        if (profiles) setResidents(profiles);
      }
    } else {
      const { data } = await supabase.from("maintenance_payments").select("*").eq("user_id", user.id).order("month", { ascending: false });
      if (data) setPayments(data);
    }
  };

  useEffect(() => { fetchPayments(); }, [user, role]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    // Check if already paid for this month
    const existing = payments.find((p) => p.month === form.month && p.status === "paid");
    if (existing) {
      toast.error("Already paid for this month");
      return;
    }
    const { error } = await supabase.from("maintenance_payments").insert({
      user_id: user.id,
      amount: parseFloat(form.amount),
      month: form.month,
      status: "paid",
      paid_at: new Date().toISOString(),
      payment_method: form.payment_method,
      transaction_id: `TXN-${Date.now()}`,
    });
    if (error) toast.error("Payment failed");
    else { toast.success("Payment recorded successfully!"); setShowPay(false); fetchPayments(); }
  };

  const getResidentName = (userId: string) => {
    const r = residents.find((res) => res.user_id === userId);
    return r ? `${r.full_name} (Wing ${r.wing || "-"}, Flat ${r.flat_number || "-"})` : userId;
  };

  const isPaidThisMonth = payments.some((p) => p.month === currentMonth() && p.status === "paid");

  if (role === "admin") {
    const totalCollected = allPayments.filter((p) => p.status === "paid").reduce((sum, p) => sum + Number(p.amount), 0);
    const thisMonthPayments = allPayments.filter((p) => p.month === currentMonth() && p.status === "paid");

    return (
      <div className="space-y-4 animate-fade-in">
        <h1 className="text-2xl font-heading font-bold">Maintenance Payments</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="shadow-card border-l-4 border-l-success">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Collected</p>
              <p className="text-2xl font-heading font-bold flex items-center"><IndianRupee className="w-5 h-5" />{totalCollected.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-l-4 border-l-primary">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-2xl font-heading font-bold">{thisMonthPayments.length} paid</p>
            </CardContent>
          </Card>
          <Card className="shadow-card border-l-4 border-l-warning">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-heading font-bold">{Math.max(0, residents.length - thisMonthPayments.length)} residents</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-heading">Payment History</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {allPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary text-sm">
                <div>
                  <p className="font-medium">{getResidentName(p.user_id)}</p>
                  <p className="text-xs text-muted-foreground">{formatMonth(p.month)} · {p.payment_method}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold flex items-center"><IndianRupee className="w-3 h-3" />{Number(p.amount).toLocaleString()}</span>
                  <Badge className="bg-success text-success-foreground">Paid</Badge>
                </div>
              </div>
            ))}
            {allPayments.length === 0 && <p className="text-muted-foreground text-center py-4">No payments recorded</p>}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold">Maintenance Payments</h1>
        {!isPaidThisMonth && (
          <Dialog open={showPay} onOpenChange={setShowPay}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground"><CreditCard className="w-4 h-4 mr-2" /> Pay Now</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Pay Maintenance</DialogTitle></DialogHeader>
              <form onSubmit={handlePay} className="space-y-4 py-2">
                <div className="space-y-2"><Label>Month</Label><Input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} required /></div>
                <div className="space-y-2"><Label>Amount (₹)</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full gradient-primary text-primary-foreground">Confirm Payment</Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {isPaidThisMonth ? (
        <Card className="shadow-card border-l-4 border-l-success">
          <CardContent className="p-6 flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-success" />
            <div>
              <p className="font-heading font-semibold">Payment up to date!</p>
              <p className="text-sm text-muted-foreground">You've paid maintenance for {formatMonth(currentMonth())}.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-card border-l-4 border-l-warning">
          <CardContent className="p-6 flex items-center gap-3">
            <Clock className="w-8 h-8 text-warning" />
            <div>
              <p className="font-heading font-semibold">Payment due</p>
              <p className="text-sm text-muted-foreground">Maintenance for {formatMonth(currentMonth())} is pending.</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card">
        <CardHeader><CardTitle className="font-heading">Payment History</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary text-sm">
              <div>
                <p className="font-medium">{formatMonth(p.month)}</p>
                <p className="text-xs text-muted-foreground">{p.payment_method} · {p.transaction_id}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold flex items-center"><IndianRupee className="w-3 h-3" />{Number(p.amount).toLocaleString()}</span>
                <Badge className={p.status === "paid" ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}>{p.status}</Badge>
              </div>
            </div>
          ))}
          {payments.length === 0 && <p className="text-muted-foreground text-center py-4">No payment history</p>}
        </CardContent>
      </Card>
    </div>
  );
}
