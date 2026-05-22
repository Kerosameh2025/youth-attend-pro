import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase, type Profile } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { RequireAuth } from "@/components/RequireAuth";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/servants")({
  component: () => (
    <RequireAuth adminOnly>
      <ServantsPage />
    </RequireAuth>
  ),
});

const PERMS = [
  "perm_add_student",
  "perm_edit_student",
  "perm_view_phones",
  "perm_take_attendance",
] as const;

function ServantsPage() {
  const { t } = useI18n();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("profiles").select("*").order("full_name");
    if (error) toast.error(error.message);
    setProfiles((data as Profile[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updatePerm = async (id: string, key: string, value: boolean) => {
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, [key]: value } : p)));
    const { error } = await supabase.from("profiles").update({ [key]: value }).eq("id", id);
    if (error) {
      toast.error(error.message);
      load();
    }
  };

  const updateRole = async (id: string, role: "super_admin" | "servant") => {
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, role } : p)));
    const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
    if (error) {
      toast.error(error.message);
      load();
    } else {
      toast.success(t("saved"));
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("servants")}</h1>
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">{t("loading")}</div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">{t("no_servants")}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profiles.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span className="truncate">{p.full_name || p.id.slice(0, 8)}</span>
                  <select
                    className="text-xs border rounded px-2 py-1 bg-background"
                    value={p.role}
                    onChange={(e) => updateRole(p.id, e.target.value as any)}
                  >
                    <option value="servant">{t("servant")}</option>
                    <option value="super_admin">{t("super_admin")}</option>
                  </select>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {PERMS.map((k) => (
                  <div key={k} className="flex items-center justify-between text-sm">
                    <span>{t(k as any)}</span>
                    <Switch
                      checked={p.role === "super_admin" || (p as any)[k]}
                      disabled={p.role === "super_admin"}
                      onCheckedChange={(v) => updatePerm(p.id, k, v)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
