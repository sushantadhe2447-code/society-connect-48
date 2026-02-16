import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Building2, Shield, Wrench, User, Mail, Lock, MapPin, Eye, EyeOff } from "lucide-react";
import societyBanner from "@/assets/society-banner.jpg";

const roleIcons = {
  resident: User,
  admin: Shield,
  maintenance_staff: Wrench,
};

const roleLabels = {
  resident: "Resident",
  admin: "Admin / Committee",
  maintenance_staff: "Maintenance Staff",
};

export default function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<string>("resident");
  const [wing, setWing] = useState("");
  const [flatNumber, setFlatNumber] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});

  const validate = (fields: { email?: boolean; password?: boolean; fullName?: boolean }) => {
    const newErrors: typeof errors = {};
    if (fields.email && !email.trim()) newErrors.email = "Email is required";
    if (fields.password && !password.trim()) newErrors.password = "Password is required";
    if (fields.fullName && !fullName.trim()) newErrors.fullName = "Full name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate({ email: true, password: true })) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Logged in successfully!");
      navigate("/dashboard");
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate({ email: true, password: true, fullName: true })) return;
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      toast.error(error.message);
    } else if (data.user) {
      if (wing || flatNumber) {
        await supabase.from("profiles").update({ wing, flat_number: flatNumber, full_name: fullName }).eq("user_id", data.user.id);
      }
      toast.success("Account created! You can now log in.");
      navigate("/dashboard");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Banner */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src={societyBanner}
          alt="GreenView Residency"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(210,30%,10%)] via-[hsl(210,30%,10%,0.6)] to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-12 text-primary-foreground">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-elevated">
              <Building2 className="w-7 h-7" />
            </div>
            <span className="text-2xl font-bold font-heading">GreenView Residency</span>
          </div>
          <h2 className="text-4xl font-bold font-heading leading-tight mb-3">
            GreenView Residency<br />Society Portal
          </h2>
          <p className="text-lg text-primary-foreground/70 font-body mb-2">Smart Society Management System</p>
          <div className="flex items-center gap-2 text-primary-foreground/60 text-sm">
            <MapPin className="w-4 h-4" />
            <span>Pune, Maharashtra</span>
          </div>
        </div>
      </div>

      {/* Right Form */}
      <div className="flex-1 flex items-center justify-center gradient-hero lg:bg-none lg:bg-background p-4 sm:p-8">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center shadow-elevated">
                <Building2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold font-heading text-primary-foreground">GreenView Residency</h1>
            </div>
            <p className="text-primary-foreground/70 text-sm font-body">Smart Society Management System</p>
          </div>

          {/* Desktop heading above card */}
          <div className="hidden lg:block mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold font-heading text-foreground">GreenView Residency</h1>
            </div>
            <p className="text-muted-foreground text-sm">Sign in to access your society portal</p>
          </div>

          <Card className="shadow-elevated border">
            <Tabs defaultValue="login">
              <CardHeader className="pb-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
              </CardHeader>

              <TabsContent value="login">
                <form onSubmit={handleLogin}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="you@example.com"
                          className="pl-9"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                        />
                      </div>
                      {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-9 pr-9"
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="remember"
                          checked={rememberMe}
                          onCheckedChange={(c) => setRememberMe(c === true)}
                        />
                        <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">Remember me</Label>
                      </div>
                      <button type="button" className="text-sm text-primary hover:underline font-medium">
                        Forgot password?
                      </button>
                    </div>
                    <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
                      {loading ? "Signing in..." : "Sign In"}
                    </Button>
                  </CardContent>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="signup-name"
                          placeholder="John Doe"
                          className="pl-9"
                          value={fullName}
                          onChange={(e) => { setFullName(e.target.value); setErrors((p) => ({ ...p, fullName: undefined })); }}
                        />
                      </div>
                      {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="signup-email" type="email" placeholder="you@example.com" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input id="signup-password" type="password" placeholder="••••••••" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={role} onValueChange={setRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(roleLabels).map(([value, label]) => {
                            const Icon = roleIcons[value as keyof typeof roleIcons];
                            return (
                              <SelectItem key={value} value={value}>
                                <div className="flex items-center gap-2">
                                  <Icon className="w-4 h-4" />
                                  <span>{label}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    {role === "resident" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="wing">Wing</Label>
                          <Input id="wing" placeholder="A" value={wing} onChange={(e) => setWing(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="flat">Flat No.</Label>
                          <Input id="flat" placeholder="101" value={flatNumber} onChange={(e) => setFlatNumber(e.target.value)} />
                        </div>
                      </div>
                    )}
                    <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
                      {loading ? "Creating account..." : "Create Account"}
                    </Button>
                  </CardContent>
                </form>
              </TabsContent>
            </Tabs>
          </Card>

          <p className="text-center text-xs text-muted-foreground lg:text-muted-foreground mt-6">
            © 2026 GreenView Residency, Pune. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
