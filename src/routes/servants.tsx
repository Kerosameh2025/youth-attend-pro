import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  supabase, supabaseSecondary, usernameToEmail, type Profile,
} from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { RequireAuth } from "@/components/RequireAuth";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  UserPlus, ShieldCheck, User as UserIcon, CheckCircle2,
  Clock, Smartphone, Monitor, History, LogIn,
} from "lucide-react";

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
  const { t, lang } = useI18n();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

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
    if (error) { toast.error(error.message); load(); }
  };

  const updateRole = async (id: string, role: "super_admin" | "servant") => {
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, role } : p)));
    const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
    if (error) { toast.error(error.message); load(); }
    else toast.success(t("saved"));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="size-6 text-gold" />
          {t("servants")}
        </h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary shadow-elegant">
              <UserPlus className="size-4 me-2" />
              {t("add_servant")}
            </Button>
          </DialogTrigger>
          <AddServantDialog onCreated={() => { setOpen(false); load(); }} lang={lang} />
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">{t("loading")}</div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">{t("no_servants")}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profiles.map((p) => (
            <Card key={p.id} className="shadow-soft hover:shadow-elegant transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="size-9 rounded-lg bg-gradient-gold/30 flex items-center justify-center shrink-0">
                      <UserIcon className="size-4 text-gold" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-base">{p.full_name || p.id.slice(0, 8)}</div>
                      {p.username && (
                        <div className="text-xs text-muted-foreground truncate font-mono">@{p.username}</div>
                      )}
                    </div>
                  </div>
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

function AddServantDialog({ onCreated, lang }: { onCreated: () => void; lang: "ar" | "en" }) {
  const { t } = useI18n();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [perms, setPerms] = useState({
    perm_add_student: false,
    perm_edit_student: false,
    perm_view_phones: false,
    perm_take_attendance: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError(null);

    const uname = username.trim().toLowerCase();
    if (!fullName.trim() || !uname || !password) {
      setError(lang === "ar" ? "جميع الحقول مطلوبة" : "All fields are required");
      return;
    }
    if (!/^[a-z0-9_.-]{3,32}$/.test(uname)) {
      setError(t("username_invalid"));
      return;
    }
    if (password.length < 6) {
      setError(lang === "ar" ? "كلمة المرور يجب ألا تقل عن 6 أحرف" : "Password must be at least 6 characters");
      return;
    }

    setSaving(true);

    // Pre-check that username is free
    const { data: existing } = await supabase
      .from("profiles").select("id").eq("username", uname).maybeSingle();
    if (existing) {
      setSaving(false);
      setError(t("username_taken"));
      return;
    }

    // Use a SECONDARY supabase client so admin's session is not replaced.
    const { data, error: signErr } = await supabaseSecondary.auth.signUp({
      email: usernameToEmail(uname),
      password,
      options: { data: { full_name: fullName.trim(), username: uname, role: "servant" } },
    });

    if (signErr || !data.user) {
      setSaving(false);
      setError(signErr?.message ?? "Signup failed");
      return;
    }

    // Sign the new user out of the secondary client (cleanup)
    await supabaseSecondary.auth.signOut();

    // The trigger creates the profile row. Update perms via the admin's session.
    const { error: updErr } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        username: uname,
        role: "servant",
        ...perms,
      })
      .eq("id", data.user.id);

    setSaving(false);
    if (updErr) { setError(updErr.message); return; }

    toast.success(t("servant_created"), {
      icon: <CheckCircle2 className="size-5 text-emerald-500" />,
      className: "!border-emerald-500/40 !bg-emerald-500/5",
    });
    onCreated();
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <UserPlus className="size-5 text-gold" />
          {t("add_servant")}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="full_name">{t("full_name")}</Label>
          <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="username">{t("username")}</Label>
          <Input
            id="username" value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="off"
            dir="ltr"
            className="font-mono"
            placeholder="e.g. mina_g8"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">{t("password")}</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
        </div>

        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <div className="text-xs font-semibold text-muted-foreground">{t("permissions")}</div>
          {(Object.keys(perms) as (keyof typeof perms)[]).map((k) => (
            <div key={k} className="flex items-center justify-between text-sm">
              <span>{t(k as any)}</span>
              <Switch
                checked={perms[k]}
                onCheckedChange={(v) => setPerms((p) => ({ ...p, [k]: v }))}
              />
            </div>
          ))}
        </div>

        {error && (
          <div className="text-xs text-destructive bg-destructive/5 border border-destructive/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button type="submit" className="bg-gradient-primary shadow-elegant" disabled={saving}>
            {saving ? t("loading") : t("create")}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
