import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Calendar, ChevronLeft, Trash2 } from "lucide-react";
import { supabase, type FridaySession } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/attendance/")({
  component: () => (
    <RequireAuth>
      <AttendancePage />
    </RequireAuth>
  ),
});

function AttendancePage() {
  const { t, lang } = useI18n();
  const { profile } = useAuth();
  const isAdmin = profile?.role === "super_admin";
  const [sessions, setSessions] = useState<FridaySession[]>([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<FridaySession | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("friday_sessions").select("*").order("session_date", { ascending: false });
    setSessions((data as FridaySession[]) ?? []);
  };

  useEffect(() => { load(); }, []);

  const generate = async () => {
    if (!from || !to) return;
    setBusy(true);
    const fridays: string[] = [];
    const start = new Date(from);
    const end = new Date(to);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (d.getDay() === 5) fridays.push(d.toISOString().slice(0, 10));
    }
    if (fridays.length === 0) {
      setBusy(false);
      return toast.error(lang === "ar" ? "لا توجد أيام جمعة في الفترة" : "No Fridays in range");
    }
    const { error } = await supabase
      .from("friday_sessions")
      .upsert(fridays.map((session_date) => ({ session_date })), { onConflict: "session_date" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${fridays.length} ${t("sessions")}`);
    load();
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

  const monthLabel = (d: string) =>
    new Date(d).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
      year: "numeric", month: "long",
    });

  const grouped = useMemo(() => {
    const map = new Map<string, FridaySession[]>();
    for (const s of sessions) {
      const key = s.session_date.slice(0, 7); // YYYY-MM
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries()); // already sorted desc since sessions are sorted desc
  }, [sessions]);

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    const { error } = await supabase.from("friday_sessions").delete().eq("id", toDelete.id);
    setDeleting(false);
    if (error) { toast.error(error.message); return; }
    setToDelete(null);
    toast.success(lang === "ar" ? "تم حذف الجلسة" : "Session deleted");
    load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("attendance")}</h1>

      {isAdmin && (
        <Card>
          <CardHeader><CardTitle>{t("generate_sessions")}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="space-y-1.5">
                <Label>{t("from_date")}</Label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("to_date")}</Label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
              <Button onClick={generate} disabled={busy || !from || !to}>
                {busy ? t("loading") : t("generate")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">{t("sessions")}</h2>
        {sessions.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">{t("no_sessions")}</p>
        ) : (
          <div className="space-y-8">
            {grouped.map(([key, items]) => (
              <section key={key}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="h-px flex-1 bg-border" />
                  <h3 className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">
                    {monthLabel(items[0].session_date)}
                  </h3>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((s) => (
                    <div
                      key={s.id}
                      className="group relative p-4 rounded-xl border bg-card hover:bg-accent transition-colors flex items-center gap-3"
                    >
                      <Link
                        to="/attendance/$sessionId"
                        params={{ sessionId: s.id }}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                          <Calendar className="size-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold truncate">{fmt(s.session_date)}</div>
                        </div>
                        <ChevronLeft className="size-4 text-muted-foreground rtl:rotate-180" />
                      </Link>
                      {isAdmin && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 transition text-destructive hover:text-destructive"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setToDelete(s); }}
                          aria-label={t("delete")}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete_session")}</AlertDialogTitle>
            <AlertDialogDescription>{t("confirm_delete_session")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={(e) => { e.preventDefault(); confirmDelete(); }}
            >
              {deleting ? t("loading") : t("yes_delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
