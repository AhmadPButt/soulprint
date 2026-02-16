import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Loader2 } from "lucide-react";

interface AdminUser {
  user_id: string;
  email: string;
  created_at: string;
}

export function AdminsTab() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("user_id, id")
        .eq("role", "admin");

      if (error) throw error;

      // Get emails from respondents table for each admin user
      const adminUsers: AdminUser[] = [];
      for (const role of roles || []) {
        const { data: respondent } = await supabase
          .from("respondents")
          .select("email, created_at")
          .eq("user_id", role.user_id)
          .maybeSingle();

        adminUsers.push({
          user_id: role.user_id,
          email: respondent?.email || "Unknown",
          created_at: respondent?.created_at || new Date().toISOString(),
        });
      }

      setAdmins(adminUsers);
    } catch (err) {
      console.error("Error loading admins:", err);
    } finally {
      setLoading(false);
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          System Administrators ({admins.length})
        </CardTitle>
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
                  <p className="font-medium text-sm">{admin.email}</p>
                  <p className="text-xs text-muted-foreground">
                    ID: {admin.user_id.substring(0, 8)}...
                  </p>
                </div>
              </div>
              <Badge className="bg-primary/20 text-primary">Admin</Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
