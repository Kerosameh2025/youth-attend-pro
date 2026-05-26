import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  supabase, supabaseSecondary, usernameToEmail, type Profile,
} from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  UserPlus, ShieldCheck, User as UserIcon, CheckCircle2,
  Clock, Smartphone, Monitor, History, LogIn,
  Pencil, Trash2, KeyRound, UserPlus2, FilePenLine, Phone, ClipboardCheck,
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

const PERM_ICONS: Record<typeof PERMS[number], React.ComponentType<any>> = {
  perm_add_student: UserPlus2,
  perm_edit_student: FilePenLine,
  perm_view_phones: Phone,
  perm_take_attendance: ClipboardCheck,
};

type LoginRow = {
  id: string;
  servant_id: string;
  logged_in_at: string;
  device_info: { type?: string; ua?: string; platform?: string; lang?: string } | null;
};

function ServantsPage() {
  const { t, lang } = useI18n();
  const { session } = useAuth();
  const currentUserId = session?.currentUserId;
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [logins, setLogins] = useState<LoginRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [historyOf, setHistoryOf] = useState<Profile | null>(null);
  const [editOf, setEditOf] = useState<Profile | null>(null);
  const [deleteOf, setDeleteOf] = useState<Profile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: profs, error: pErr }, { data: lg, error: lErr }] = await Promise.all([
      supabase.from("profiles").select("*").order("full_name"),
      supabase.from("servant_logins").select("*").order("logged_in_at", { ascending: false }),
    ]);
    if (pErr) toast.error(pErr.message);
    if (lErr && lErr.code !== "PGRST116") console.warn("servant_logins:", lErr.message);
    setProfiles((profs as Profile[]) ?? []);
    setLogins((lg as LoginRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const statsByUser = useMemo(() => {
    const map = new Map<string, { count: number; last?: string }>();
    for (const r of logins) {
      const cur = map.get(r.servant_id) ?? { count: 0, last: undefined };
      cur.count += 1;
      if (!cur.last || r.logged_in_at > cur.last) cur.last = r.logged_in_at;
      map.set(r.servant_id, cur);
    }
    return map;
  }, [logins]);

  const historyRows = useMemo(
    () => (historyOf ? logins.filter((l) => l.servant_id === historyOf.id) : []),
    [logins, historyOf],
  );

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

  const doDelete = async () => {
    if (!deleteOf) return;
    if (deleteOf.id === currentUserId) {
      toast.error(t("cannot_delete_self"));
      return;
    }
    setDeleting(true);
    const { error } = await supabase.rpc("admin_delete_servant", { p_servant_id: deleteOf.id });
    setDeleting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("servant_deleted"), {
      icon: <CheckCircle2 className="size-5 text-emerald-500" />,
      className: "!border-emerald-500/40 !bg-emerald-500/5",
    });
    setDeleteOf(null);
    load();
  };

  const fmtDateTime = (iso?: string) => {
    if (!iso) return t("never_logged_in");
    const d = new Date(iso);
    return d.toLocaleString(lang === "ar" ? "ar-EG" : "en-US", {
      dateStyle: "medium", timeStyle: "short",
    });
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
          {profiles.map((p) => {
            const stats = statsByUser.get(p.id);
            const isAdmin = p.role === "super_admin";
            return (
              <Card key={p.id} className="shadow-soft hover:shadow-elegant transition-all">
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
                <CardContent className="space-y-3">
                  {/* Permission badges */}
                  {!isAdmin && (
                    <div className="flex flex-wrap gap-1.5">
                      {PERMS.map((k) => {
                        const Icon = PERM_ICONS[k];
                        const on = (p as any)[k];
                        return (
                          <Badge
                            key={k}
                            variant={on ? "default" : "outline"}
                            className={`gap-1 ${on ? "bg-gradient-primary" : "opacity-60"}`}
                          >
                            <Icon className="size-3" />
                            <span className="text-[10px]">{t(k as any)}</span>
                          </Badge>
                        );
                      })}
                    </div>
                  )}

                  {/* Activity row */}
                  <div
                    className="flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2 cursor-pointer hover:bg-muted/60 transition-colors"
                    onClick={() => setHistoryOf(p)}
                  >
                    <div className="flex items-center gap-2 text-xs min-w-0">
                      <Clock className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">{t("last_login")}:</span>
                      <span className="truncate font-medium">{fmtDateTime(stats?.last)}</span>
                    </div>
                    <Badge variant="secondary" className="gap-1 shrink-0">
                      <LogIn className="size-3" />
                      {stats?.count ?? 0}
                    </Badge>
                  </div>

                  {/* Quick permission toggles */}
                  {PERMS.map((k) => (
                    <div key={k} className="flex items-center justify-between text-sm">
                      <span>{t(k as any)}</span>
                      <Switch
                        checked={isAdmin || (p as any)[k]}
                        disabled={isAdmin}
                        onCheckedChange={(v) => updatePerm(p.id, k, v)}
                      />
                    </div>
                  ))}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      variant="outline" size="sm" className="flex-1"
                      onClick={() => setHistoryOf(p)}
                    >
                      <History className="size-3.5 me-1" />
                      {t("login_history")}
                    </Button>
                    <Button
                      variant="outline" size="sm" className="flex-1"
                      onClick={() => setEditOf(p)}
                    >
                      <Pencil className="size-3.5 me-1" />
                      {t("edit")}
                    </Button>
                    <Button
                      variant="destructive" size="sm"
                      disabled={p.id === currentUserId}
                      onClick={() => setDeleteOf(p)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Login history */}
      <Dialog open={!!historyOf} onOpenChange={(o) => { if (!o) setHistoryOf(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="size-5 text-gold" />
              {t("login_history")}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <span className="font-medium text-foreground">
                {historyOf?.full_name || "—"}
              </span>
              {historyOf?.username && (
                <span className="text-xs font-mono">@{historyOf.username}</span>
              )}
              <Badge variant="secondary" className="gap-1 ms-auto">
                <LogIn className="size-3" />
                {historyRows.length}
              </Badge>
            </DialogDescription>
          </DialogHeader>

          {historyRows.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              {t("no_login_history")}
            </div>
          ) : (
            <ol className="relative ms-3 border-s border-border/60 space-y-4 py-2">
              {historyRows.map((r) => {
                const isMobile = (r.device_info?.type ?? "") === "mobile";
                return (
                  <li key={r.id} className="ms-4">
                    <span className="absolute -start-1.5 size-3 rounded-full bg-gradient-gold shadow-gold ring-2 ring-background" />
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <time className="text-sm font-medium">{fmtDateTime(r.logged_in_at)}</time>
                      <Badge variant="outline" className="gap-1">
                        {isMobile
                          ? <Smartphone className="size-3" />
                          : <Monitor className="size-3" />}
                        {isMobile ? t("device_mobile") : t("device_desktop")}
                      </Badge>
                    </div>
                    {r.device_info?.ua && (
                      <p className="text-[10px] text-muted-foreground mt-1 truncate font-mono">
                        {r.device_info.ua}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryOf(null)}>{t("close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit servant */}
      <Dialog open={!!editOf} onOpenChange={(o) => { if (!o) setEditOf(null); }}>
        {editOf && (
          <EditServantDialog
            profile={editOf}
            lang={lang}
            onSaved={() => { setEditOf(null); load(); }}
          />
        )}
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteOf} onOpenChange={(o) => { if (!o) setDeleteOf(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="size-5 text-destructive" />
              {t("delete_servant")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirm_delete_servant")}
              {deleteOf && (
                <div className="mt-3 rounded-lg border bg-muted/30 px-3 py-2 text-foreground">
                  <div className="font-medium">{deleteOf.full_name}</div>
                  {deleteOf.username && (
                    <div className="text-xs font-mono text-muted-foreground">@{deleteOf.username}</div>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); doDelete(); }}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? t("loading") : t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EditServantDialog({
  profile, lang, onSaved,
}: { profile: Profile; lang: "ar" | "en"; onSaved: () => void }) {
  const { t } = useI18n();
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [username, setUsername] = useState(profile.username ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [perms, setPerms] = useState({
    perm_add_student: !!profile.perm_add_student,
    perm_edit_student: !!profile.perm_edit_student,
    perm_view_phones: !!profile.perm_view_phones,
    perm_take_attendance: !!profile.perm_take_attendance,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setError(null);
    const uname = username.trim().toLowerCase();

    if (!fullName.trim() || !uname) {
      setError(lang === "ar" ? "الاسم واسم المستخدم مطلوبان" : "Name and username are required");
      return;
    }
    if (!/^[a-z0-9_.-]{3,32}$/.test(uname)) {
      setError(t("username_invalid"));
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setError(lang === "ar" ? "كلمة المرور يجب ألا تقل عن 6 أحرف" : "Password must be at least 6 characters");
      return;
    }

    setSaving(true);

    const { error: updErr } = await supabase.rpc("admin_update_servant", {
      p_servant_id: profile.id,
      p_full_name: fullName.trim(),
      p_username: uname,
      p_perm_add_student: perms.perm_add_student,
      p_perm_edit_student: perms.perm_edit_student,
      p_perm_view_phones: perms.perm_view_phones,
      p_perm_take_attendance: perms.perm_take_attendance,
    });
    if (updErr) {
      setSaving(false);
      const msg = updErr.message.includes("username taken") ? t("username_taken") : updErr.message;
      setError(msg);
      return;
    }

    if (newPassword) {
      const { error: pwErr } = await supabase.rpc("admin_reset_servant_password", {
        p_servant_id: profile.id,
        p_new_password: newPassword,
      });
      if (pwErr) {
        setSaving(false);
        setError(pwErr.message);
        return;
      }
    }

    setSaving(false);
    toast.success(newPassword ? t("password_reset_done") : t("servant_updated"), {
      icon: <CheckCircle2 className="size-5 text-emerald-500" />,
      className: "!border-emerald-500/40 !bg-emerald-500/5",
    });
    onSaved();
  };

  return (
    <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Pencil className="size-5 text-gold" />
          {t("edit_servant")}
        </DialogTitle>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="edit_full_name">{t("full_name")}</Label>
          <Input id="edit_full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit_username">{t("username")}</Label>
          <Input
            id="edit_username" value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="off" dir="ltr" className="font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit_password" className="flex items-center gap-1.5">
            <KeyRound className="size-3.5" />
            {t("new_password")}
          </Label>
          <Input
            id="edit_password" type="password" value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            placeholder={t("leave_blank_keep")}
          />
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
            {saving ? t("loading") : t("save")}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
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

    const { data: existing } = await supabase
      .from("profiles").select("id").eq("username", uname).maybeSingle();
    if (existing) {
      setSaving(false);
      setError(t("username_taken"));
      return;
    }

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

    await supabaseSecondary.auth.signOut();

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
