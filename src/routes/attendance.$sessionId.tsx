import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, FileSpreadsheet, FileText } from "lucide-react";
import { supabase, type Student, type FridaySession, type Attendance } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { StudentAvatar } from "@/components/StudentAvatar";
import { exportToExcel, exportToPDF } from "@/lib/export";

export const Route = createFileRoute("/attendance/$sessionId")({
  component: () => (
    <RequireAuth>
      <SessionCheckIn />
    </RequireAuth>
  ),
});

function SessionCheckIn() {
  const { sessionId } = Route.useParams();
  const { t, lang } = useI18n();
  const { profile, session: authSession } = useAuth();
  const canTake = profile?.role === "super_admin" || profile?.perm_take_attendance;

  const [session, setSession] = useState<FridaySession | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [att, setAtt] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: s }, { data: ss }, { data: aa }] = await Promise.all([
      supabase.from("friday_sessions").select("*").eq("id", sessionId).maybeSingle(),
      supabase.from("students").select("*").order("name"),
      supabase.from("attendance").select("*").eq("session_id", sessionId),
    ]);
    setSession(s as FridaySession);
    setStudents((ss as Student[]) ?? []);
    const map: Record<string, boolean> = {};
    (aa as Attendance[] | null)?.forEach((a) => { map[a.student_id] = a.present; });
    setAtt(map);
    setLoading(false);
  };

  useEffect(() => { load(); }, [sessionId]);

  const toggle = async (studentId: string, present: boolean) => {
    if (!canTake) return toast.error(t("no_permission"));
    setAtt((prev) => ({ ...prev, [studentId]: present }));
    const { error } = await supabase
      .from("attendance")
      .upsert(
        {
          session_id: sessionId,
          student_id: studentId,
          present,
          marked_by: authSession?.user.id,
          marked_at: new Date().toISOString(),
        },
        { onConflict: "session_id,student_id" }
      );
    if (error) {
      toast.error(error.message);
      setAtt((prev) => ({ ...prev, [studentId]: !present }));
    }
  };

  const presentCount = Object.values(att).filter(Boolean).length;
  const absentCount = students.length - presentCount;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link to="/attendance"><ArrowRight className="size-4 rtl:rotate-180" /></Link>
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold">{t("take_attendance")}</h1>
          {session && (
            <p className="text-sm text-muted-foreground">
              {new Date(session.session_date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="grid grid-cols-3 gap-2 flex-1 min-w-[260px]">
          <Stat label={t("total_students")} value={students.length} />
          <Stat label={t("present_count")} value={presentCount} className="text-green-600" />
          <Stat label={t("absent_count")} value={absentCount} className="text-red-600" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            const rows = students.map((s) => ({
              code: s.code, name: s.name,
              status: att[s.id] ? t("present") : t("absent"),
            }));
            exportToExcel(rows, `attendance-${session?.session_date ?? "session"}.xlsx`, "Attendance");
            toast.success(t("saved"));
          }} disabled={!students.length}>
            <FileSpreadsheet className="size-4" /> {t("export_excel")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => {
            exportToPDF({
              title: t("take_attendance"),
              subtitle: session ? new Date(session.session_date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "",
              lang, dir: lang === "ar" ? "rtl" : "ltr",
              columns: [
                { key: "code", label: t("code") },
                { key: "name", label: t("name") },
                { key: "status", label: lang === "ar" ? "الحالة" : "Status" },
              ],
              rows: students.map((s) => ({
                code: s.code, name: s.name,
                status: att[s.id] ? t("present") : t("absent"),
              })),
            });
          }} disabled={!students.length}>
            <FileText className="size-4" /> {t("export_pdf")}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">{t("loading")}</div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">{t("no_students")}</div>
      ) : (
        <div className="space-y-2">
          {students.map((s) => {
            const present = !!att[s.id];
            return (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                <StudentAvatar path={s.photo_path} name={s.name} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{s.name}</div>
                  <div className="text-xs text-muted-foreground">#{s.code}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${present ? "text-green-600" : "text-muted-foreground"}`}>
                    {present ? t("present") : t("absent")}
                  </span>
                  <Switch checked={present} onCheckedChange={(v) => toggle(s.id, v)} disabled={!canTake} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className="p-3 rounded-lg border bg-card text-center">
      <div className={`text-2xl font-bold ${className ?? ""}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
