import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2, UserPlus, Eye, EyeOff, CheckCircle2, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

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
  const [form, setForm] = useState({ secretKey: "", name: "", email: "" });
  const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    loadAdmins();
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setCurrentUserId(session.user.id);
      const { data } = await supabase.rpc("has_role", { _user_id: session.user.id, _role: "admin" });
      setCurrentUserIsAdmin(!!data);
    }
  };

  const loadAdmins = async () => {
    try {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("user_id, id, role")
        .eq("role", "admin");

      if (error) throw error;

      const adminUsers: AdminUser[] = [];
      for (const role of roles || []) {
        const { data: respondent } = await supabase
          .from("respondents")
          .select("email, name, created_at")
          .eq("user_id", role.user_id)
          .maybeSingle();

        adminUsers.push({
          user_id: role.user_id,
          email: respondent?.email || "Unknown",
          name: respondent?.name || "Admin",
          created_at: respondent?.created_at || new Date().toISOString(),
          role: role.role,
        });
      }

      setAdmins(adminUsers);
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
        body: { secret_key: form.secretKey, admin_name: form.name, admin_email: form.email },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Admin registered successfully", description: "Role has been granted." });
      setForm({ secretKey: "", name: "", email: "" });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Admins */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                System Administrators ({admins.length})
              </CardTitle>
              <CardDescription>Users with elevated admin access to this panel.</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(!showForm)}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {showForm ? "Cancel" : "Add Admin"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {admins.length === 0 ? (
            <p className="text-muted-foreground text-sm">No administrators found.</p>
          ) : (
            admins.map((admin) => (
              <div
                key={admin.user_id}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-primary" />
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
                    <Badge variant="outline" className="text-xs text-primary border-primary/30 bg-primary/5">
                      You
                    </Badge>
                  )}
                  <Badge className="bg-primary/20 text-primary capitalize">{admin.role}</Badge>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Register Admin Form */}
      {showForm && (
        <Card className="border-primary/20 bg-accent/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              Register New Administrator
            </CardTitle>
            <CardDescription>
              Provide the admin secret key to grant admin access to your current account, or another user's account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-name">Display Name</Label>
              <Input
                id="admin-name"
                placeholder="e.g. Ahmad Al-Rashid"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@erranza.ai"
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret-key">Admin Secret Key <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Input
                  id="secret-key"
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
              <p className="text-xs text-muted-foreground">This grants admin access to your currently logged-in account.</p>
            </div>
            <Separator />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button onClick={handleRegister} disabled={registering} className="gap-2">
                {registering ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Registering...</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4" /> Grant Admin Access</>
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
              { role: "admin", desc: "Full access: travelers, destinations, analytics, support, system settings", color: "bg-primary/20 text-primary" },
              { role: "moderator", desc: "Limited: can view travelers and support, cannot modify system settings", color: "bg-amber-100 text-amber-700" },
              { role: "user", desc: "Standard traveler access to their own data and trips", color: "bg-secondary text-secondary-foreground" },
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
