import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, CalendarCheck2, ShieldCheck, ArrowLeft, ArrowRight,
  Sparkles, CheckCircle2, XCircle, TrendingUp, Percent, CalendarRange, UserX,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/")({
  component: Index,
});

type TrendPoint = { date: string; present: number; absent: number; rate: number };
type AbsentTop = { name: string; absent: number };

function Index() {
  const { session, loading, profile } = useAuth();
  const { t, lang } = useI18n();

  const [stats, setStats] = useState({ students: 0, sessions: 0, avgRate: 0, lastPresent: 0, lastTotal: 0 });
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [topAbsent, setTopAbsent] = useState<AbsentTop[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    (async () => {
      setDataLoading(true);
      const [{ data: students }, { data: sessions }, { data: attendance }] = await Promise.all([
        supabase.from("students").select("id,name"),
        supabase.from("friday_sessions").select("*").order("session_date", { ascending: true }),
        supabase.from("attendance").select("session_id,student_id,present"),
      ]);
      const studentList = students ?? [];
      const sessionList = (sessions ?? []) as { id: string; session_date: string }[];
      const att = (attendance ?? []) as { session_id: string; student_id: string; present: boolean }[];
      const total = studentList.length;

      const points: TrendPoint[] = sessionList.slice(-10).map((s) => {
        const sa = att.filter((a) => a.session_id === s.id);
        const present = sa.filter((a) => a.present).length;
        const absent = Math.max(0, total - present);
        const rate = total ? Math.round((present / total) * 100) : 0;
        const d = new Date(s.session_date);
        return {
          date: d.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { month: "short", day: "numeric" }),
          present, absent, rate,
        };
      });

      const avgRate = points.length ? Math.round(points.reduce((a, p) => a + p.rate, 0) / points.length) : 0;
      const last = points[points.length - 1];

      // Top absent students
      const absentMap = new Map<string, number>();
      const presentBySession = new Map<string, Set<string>>();
      att.forEach((a) => {
        if (a.present) {
          if (!presentBySession.has(a.session_id)) presentBySession.set(a.session_id, new Set());
          presentBySession.get(a.session_id)!.add(a.student_id);
        }
      });
      studentList.forEach((s) => {
        let absent = 0;
        sessionList.forEach((sess) => {
          if (!presentBySession.get(sess.id)?.has(s.id)) absent++;
        });
        if (absent > 0) absentMap.set(s.name, absent);
      });
      const top = Array.from(absentMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, absent]) => ({ name, absent }));

      setStats({
        students: total,
        sessions: sessionList.length,
        avgRate,
        lastPresent: last?.present ?? 0,
        lastTotal: total,
      });
      setTrend(points);
      setTopAbsent(top);
      setDataLoading(false);
    })();
  }, [session, lang]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-3">
          <div className="size-2 rounded-full bg-gold animate-pulse" />
          <div className="size-2 rounded-full bg-gold animate-pulse [animation-delay:150ms]" />
          <div className="size-2 rounded-full bg-gold animate-pulse [animation-delay:300ms]" />
        </div>
      </div>
    );
  }
  if (!session) return <Navigate to="/login" />;

  const isAdmin = profile?.role === "super_admin";
  const Arrow = lang === "ar" ? ArrowLeft : ArrowRight;

  const cards = [
    {
      title: t("students"), desc: lang === "ar" ? "إدارة بيانات الطلاب والصور" : "Manage student records and photos",
      href: "/students", icon: Users,
      bar: "linear-gradient(90deg, oklch(0.55 0.18 265), oklch(0.32 0.1 260))",
      iconBg: "oklch(0.55 0.18 265 / 0.12)", iconColor: "oklch(0.45 0.18 265)",
    },
    {
      title: t("attendance"), desc: lang === "ar" ? "تسجيل الحضور وتوليد الجلسات" : "Take attendance and generate sessions",
      href: "/attendance", icon: CalendarCheck2,
      bar: "linear-gradient(90deg, oklch(0.78 0.13 80), oklch(0.62 0.15 60))",
      iconBg: "oklch(0.78 0.13 80 / 0.18)", iconColor: "oklch(0.55 0.15 70)",
    },
    ...(isAdmin ? [{
      title: t("servants"), desc: lang === "ar" ? "إدارة الخدام والصلاحيات" : "Manage servants and permissions",
      href: "/servants", icon: ShieldCheck,
      bar: "linear-gradient(90deg, oklch(0.55 0.15 200), oklch(0.38 0.12 220))",
      iconBg: "oklch(0.55 0.15 200 / 0.14)", iconColor: "oklch(0.45 0.15 210)",
    }] : []),
  ];

  const pieData = [
    { name: t("present_count"), value: stats.lastPresent, color: "oklch(0.65 0.16 150)" },
    { name: t("absent_count"), value: Math.max(0, stats.lastTotal - stats.lastPresent), color: "oklch(0.62 0.2 25)" },
  ];

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-hero text-white shadow-elegant">
          <div className="absolute inset-0 bg-pattern-cross text-white" />
          <div className="absolute -top-24 -end-24 size-72 rounded-full bg-gold/20 blur-3xl" />
          <div className="absolute -bottom-24 -start-24 size-72 rounded-full bg-white/10 blur-3xl" />
          <div className="relative p-6 md:p-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-xs font-medium text-gold border border-gold/30">
              <Sparkles className="size-3.5" />
              {profile?.role === "super_admin" ? t("super_admin") : t("servant")}
            </div>
            <h1 className="mt-4 text-2xl md:text-4xl font-bold tracking-tight">
              {t("welcome")}{profile?.full_name ? "، " + profile.full_name : ""}
            </h1>
            <p className="mt-2 text-white/75 max-w-xl text-sm md:text-base">
              {lang === "ar"
                ? "منصة متابعة حضور خدمة الكنيسة — الصف الثاني الإعدادي."
                : "Church service attendance platform for Grade 8."}
            </p>
          </div>
        </section>

        {/* KPI Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <KPI icon={Users} label={t("total_students")} value={stats.students} tone="indigo" />
          <KPI icon={CalendarRange} label={t("total_sessions")} value={stats.sessions} tone="gold" />
          <KPI icon={Percent} label={t("avg_attendance")} value={`${stats.avgRate}%`} tone="emerald" />
          <KPI icon={TrendingUp} label={t("attendance_rate")} value={`${trend[trend.length - 1]?.rate ?? 0}%`} tone="rose" />
        </section>

        {/* Charts */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-bold">{t("attendance_trend")}</h2>
                <p className="text-xs text-muted-foreground">{t("recent_sessions")}</p>
              </div>
              <TrendingUp className="size-5 text-gold" />
            </div>
            <div className="h-64">
              {dataLoading || trend.length === 0 ? (
                <EmptyChart label={t("no_data")} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend}>
                    <defs>
                      <linearGradient id="gPresent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.65 0.16 150)" stopOpacity={0.7} />
                        <stop offset="100%" stopColor="oklch(0.65 0.16 150)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gAbsent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.62 0.2 25)" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="oklch(0.62 0.2 25)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                    <Area type="monotone" dataKey="present" stroke="oklch(0.55 0.16 150)" fill="url(#gPresent)" strokeWidth={2} name={t("present_count")} />
                    <Area type="monotone" dataKey="absent" stroke="oklch(0.6 0.2 25)" fill="url(#gAbsent)" strokeWidth={2} name={t("absent_count")} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
            <h2 className="font-bold mb-1">{t("attendance_rate")}</h2>
            <p className="text-xs text-muted-foreground mb-2">{lang === "ar" ? "آخر جلسة" : "Latest session"}</p>
            <div className="h-64">
              {stats.lastTotal === 0 ? (
                <EmptyChart label={t("no_data")} />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                      {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </section>

        {/* Top absent */}
        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold">{t("top_absent")}</h2>
              <p className="text-xs text-muted-foreground">{lang === "ar" ? "الطلاب الأكثر تغيباً عن الجلسات" : "Students with most absences"}</p>
            </div>
            <UserX className="size-5 text-destructive" />
          </div>
          <div className="h-56">
            {topAbsent.length === 0 ? (
              <EmptyChart label={t("no_data")} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topAbsent} layout="vertical" margin={{ left: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                  <Bar dataKey="absent" fill="oklch(0.62 0.2 25)" radius={[0, 8, 8, 0]} name={t("absent_times")} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* Quick actions */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {cards.map((c, i) => (
            <Link
              key={c.href} to={c.href}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-soft hover:shadow-elegant hover:-translate-y-1 transition-all duration-300"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: c.bar }} />
              <div className="size-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                   style={{ background: c.iconBg, color: c.iconColor }}>
                <c.icon className="size-6" />
              </div>
              <h3 className="mt-4 font-bold text-lg">{c.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{c.desc}</p>
              <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gold group-hover:gap-2.5 transition-all">
                <span>{lang === "ar" ? "فتح" : "Open"}</span>
                <Arrow className="size-4" />
              </div>
            </Link>
          ))}
        </section>

        {/* Permissions */}
        <section className="rounded-2xl border border-border/60 bg-card p-5 md:p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-base">{t("permissions")}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === "ar" ? "الصلاحيات تُمنح بواسطة المسؤول العام." : "Permissions granted by super admin."}
              </p>
            </div>
            <ShieldCheck className="size-5 text-gold" />
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            <PermRow label={t("perm_add_student")} on={isAdmin || !!profile?.perm_add_student} />
            <PermRow label={t("perm_edit_student")} on={isAdmin || !!profile?.perm_edit_student} />
            <PermRow label={t("perm_view_phones")} on={isAdmin || !!profile?.perm_view_phones} />
            <PermRow label={t("perm_take_attendance")} on={isAdmin || !!profile?.perm_take_attendance} />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function KPI({ icon: Icon, label, value, tone }: {
  icon: typeof Users; label: string; value: number | string; tone: "indigo" | "gold" | "emerald" | "rose";
}) {
  const tones = {
    indigo: "from-indigo-500/15 to-indigo-500/0 text-indigo-500",
    gold: "from-gold/20 to-gold/0 text-gold",
    emerald: "from-emerald-500/15 to-emerald-500/0 text-emerald-500",
    rose: "from-rose-500/15 to-rose-500/0 text-rose-500",
  } as const;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
      <div className={`absolute inset-0 bg-gradient-to-br ${tones[tone]}`} />
      <div className="relative flex items-start justify-between gap-2">
        <div>
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold mt-1">{value}</div>
        </div>
        <Icon className={`size-5 ${tones[tone].split(" ").pop()}`} />
      </div>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return <div className="h-full flex items-center justify-center text-sm text-muted-foreground">{label}</div>;
}

function PermRow({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5">
      <span className="text-sm font-medium">{label}</span>
      {on
        ? <CheckCircle2 className="size-4 text-emerald-500" />
        : <XCircle className="size-4 text-muted-foreground" />}
    </div>
  );
}
