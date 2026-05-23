import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { AppShell } from "@/components/AppShell";
import { Users, CalendarCheck2, ShieldCheck, ArrowLeft, ArrowRight, Sparkles, CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { session, loading, profile } = useAuth();
  const { t, lang } = useI18n();

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

  const cards: Array<{
    title: string; desc: string; href: string; icon: typeof Users;
    bar: string; iconBg: string; iconColor: string;
  }> = [
    {
      title: t("students"),
      desc: lang === "ar" ? "إدارة بيانات الطلاب والصور وأرقام التواصل" : "Manage student records, photos and contact info",
      href: "/students", icon: Users,
      bar: "linear-gradient(90deg, oklch(0.55 0.18 265), oklch(0.32 0.1 260))",
      iconBg: "oklch(0.55 0.18 265 / 0.12)", iconColor: "oklch(0.45 0.18 265)",
    },
    {
      title: t("attendance"),
      desc: lang === "ar" ? "تسجيل حضور الجمعة وتوليد الجلسات تلقائياً" : "Take Friday attendance and auto-generate sessions",
      href: "/attendance", icon: CalendarCheck2,
      bar: "linear-gradient(90deg, oklch(0.78 0.13 80), oklch(0.62 0.15 60))",
      iconBg: "oklch(0.78 0.13 80 / 0.18)", iconColor: "oklch(0.55 0.15 70)",
    },
    ...(isAdmin ? [{
      title: t("servants"),
      desc: lang === "ar" ? "إدارة الخدام وضبط صلاحيات كل خادم" : "Manage servants and configure permissions",
      href: "/servants", icon: ShieldCheck,
      bar: "linear-gradient(90deg, oklch(0.55 0.15 200), oklch(0.38 0.12 220))",
      iconBg: "oklch(0.55 0.15 200 / 0.14)", iconColor: "oklch(0.45 0.15 210)",
    }] : []),
  ];

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Hero banner */}
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
                ? "منصة متابعة حضور خدمة الكنيسة — الصف الثاني الإعدادي. تابع طلابك، سجّل الحضور، وأدر الخدام بسهولة."
                : "Church service attendance platform for Grade 8. Track students, record attendance, and manage servants with ease."}
            </p>
          </div>
        </section>

        {/* Stat cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {cards.map((c, i) => (
            <Link
              key={c.href}
              to={c.href}
              className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-soft hover:shadow-elegant hover:-translate-y-1 transition-all duration-300"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: c.bar }} />
              <div
                className="size-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ background: c.iconBg, color: c.iconColor }}
              >
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

        {/* Permissions panel */}
        <section className="rounded-2xl border border-border/60 bg-card p-5 md:p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-base">{t("permissions")}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lang === "ar" ? "الصلاحيات تُمنح بواسطة المسؤول العام." : "Permissions are granted by the super admin."}
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

function PermRow({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5">
      <span className="text-sm font-medium">{label}</span>
      {on ? (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-4" />
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
          <XCircle className="size-4" />
        </span>
      )}
    </div>
  );
}
