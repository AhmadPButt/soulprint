import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Loader2, UserPlus, Eye, EyeOff, CheckCircle2, Key, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

// Master admin email — shown with Crown badge
const MASTER_ADMIN_EMAIL = "ahmad@erranza.ai";

interface AdminUser {
  user_id: string;
  email: string;
  name: string;
  created_at: string;
  role: string;
}

export function AdminsTab() {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [form, setForm] = useState({ secretKey: "", name: "", email: "", role: "admin" });
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    loadAdmins();
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) setCurrentUserId(session.user.id);
  };

  const loadAdmins = async () => {
    try {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("user_id, id, role")
        .in("role", ["admin", "moderator"]);

      if (error) throw error;

      const users: AdminUser[] = [];
      for (const role of roles || []) {
        const { data: respondent } = await supabase
          .from("respondents")
          .select("email, name, created_at")
          .eq("user_id", role.user_id)
          .maybeSingle();

        users.push({
          user_id: role.user_id,
          email: respondent?.email || "Unknown",
          name: respondent?.name || (role.role === "admin" ? "Admin" : "Moderator"),
          created_at: respondent?.created_at || new Date().toISOString(),
          role: role.role,
        });
      }

      // Sort: master admin first, then admins, then moderators
      users.sort((a, b) => {
        if (a.email === MASTER_ADMIN_EMAIL) return -1;
        if (b.email === MASTER_ADMIN_EMAIL) return 1;
        if (a.role === "admin" && b.role !== "admin") return -1;
        if (b.role === "admin" && a.role !== "admin") return 1;
        return 0;
      });

      setAdmins(users);
    } catch (err) {
      console.error("Error loading admins:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!form.secretKey.trim()) {
      toast({ title: "Secret key required", variant: "destructive" });
      return;
    }
    setRegistering(true);
    try {
      const { data, error } = await supabase.functions.invoke("register-admin", {
        body: {
          secret_key: form.secretKey,
          admin_name: form.name,
          admin_email: form.email,
          role: form.role,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: `${form.role === "admin" ? "Admin" : "Moderator"} registered successfully`, description: "Role has been granted." });
      setForm({ secretKey: "", name: "", email: "", role: "admin" });
      setShowForm(false);
      await loadAdmins();
    } catch (err: any) {
      toast({
        title: "Registration failed",
        description: err.message || "Invalid secret key or unauthorized.",
        variant: "destructive",
      });
    } finally {
      setRegistering(false);
    }
  };

  const getRoleBadge = (user: AdminUser) => {
    const isMaster = user.email === MASTER_ADMIN_EMAIL;
    if (isMaster) {
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-300 gap-1">
          <Crown className="h-3 w-3" /> Master Admin
        </Badge>
      );
    }
    if (user.role === "admin") {
      return <Badge className="bg-primary/20 text-primary">Admin</Badge>;
    }
    return <Badge className="bg-sky-100 text-sky-700 border-sky-200">Moderator</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Admins & Moderators */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                System Administrators & Moderators ({admins.length})
              </CardTitle>
              <CardDescription>Users with elevated access to the Erranza Panel.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)} className="gap-2">
              <UserPlus className="h-4 w-4" />
              {showForm ? "Cancel" : "Add User"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {admins.length === 0 ? (
            <p className="text-muted-foreground text-sm">No administrators found.</p>
          ) : (
            admins.map((admin) => {
              const isMaster = admin.email === MASTER_ADMIN_EMAIL;
              return (
                <div
                  key={admin.user_id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isMaster ? "border-amber-200 bg-amber-50/50" : "border-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isMaster ? "bg-amber-100" : "bg-primary/10"}`}>
                      {isMaster ? <Crown className="h-4 w-4 text-amber-600" /> : <Shield className="h-4 w-4 text-primary" />}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{admin.name}</p>
                      <p className="text-xs text-muted-foreground">{admin.email}</p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5">
                        Since {new Date(admin.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {admin.user_id === currentUserId && (
                      <Badge variant="outline" className="text-xs text-primary border-primary/30 bg-primary/5">You</Badge>
                    )}
                    {getRoleBadge(admin)}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Register Form */}
      {showForm && (
        <Card className="border-primary/20 bg-accent/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              Register New Admin / Moderator
            </CardTitle>
            <CardDescription>
              Grants the selected role to your currently logged-in account using the admin secret key.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  placeholder="e.g. Ahmad Butt"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="name@erranza.ai"
                  value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role to Grant</Label>
              <Select value={form.role} onValueChange={(v) => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-primary" /> Admin — Full access
                    </div>
                  </SelectItem>
                  <SelectItem value="moderator">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-sky-500" /> Moderator — Travelers, Support & Destinations only
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Admin Secret Key <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder="Enter the admin secret key"
                  value={form.secretKey}
                  onChange={(e) => setForm(f => ({ ...f, secretKey: e.target.value }))}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Grants the selected role to your currently logged-in account.</p>
            </div>
            <Separator />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleRegister} disabled={registering} className="gap-2">
                {registering ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Registering...</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4" /> Grant Access</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Reference */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-muted-foreground">Role Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            {[
              { role: "Master Admin", desc: "Full access + cannot be removed. Designated for Ahmad Butt.", color: "bg-amber-100 text-amber-800 border-amber-300" },
              { role: "Admin", desc: "Full access: travelers, destinations, analytics, support, algorithm, system settings.", color: "bg-primary/20 text-primary" },
              { role: "Moderator", desc: "Limited: Travelers, Support, and Destinations only. Cannot access analytics, algorithm, or admin settings.", color: "bg-sky-100 text-sky-700 border-sky-200" },
            ].map(({ role, desc, color }) => (
              <div key={role} className="flex items-start gap-3">
                <Badge className={`${color} shrink-0 mt-0.5`}>{role}</Badge>
                <p className="text-muted-foreground text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
