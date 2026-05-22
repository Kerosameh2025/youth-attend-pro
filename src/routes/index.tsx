import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Calendar, UserCog } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { session, loading, profile } = useAuth();
  const { t, lang } = useI18n();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        {t("loading")}
      </div>
    );
  }
  if (!session) return <Navigate to="/login" />;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            {t("welcome")}, {profile?.full_name || ""}
          </h1>
          <p className="text-muted-foreground mt-1">
            {profile?.role === "super_admin" ? t("super_admin") : t("servant")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DashCard icon={<Users />} title={t("students")} href="/students" />
          <DashCard icon={<Calendar />} title={t("attendance")} href="/attendance" />
          {profile?.role === "super_admin" && (
            <DashCard icon={<UserCog />} title={t("servants")} href="/servants" />
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("permissions")}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <PermRow label={t("perm_add_student")} on={profile?.role === "super_admin" || !!profile?.perm_add_student} />
            <PermRow label={t("perm_edit_student")} on={profile?.role === "super_admin" || !!profile?.perm_edit_student} />
            <PermRow label={t("perm_view_phones")} on={profile?.role === "super_admin" || !!profile?.perm_view_phones} />
            <PermRow label={t("perm_take_attendance")} on={profile?.role === "super_admin" || !!profile?.perm_take_attendance} />
            <p className="text-xs text-muted-foreground mt-2">
              {lang === "ar" ? "الصلاحيات تُمنح بواسطة المسؤول العام." : "Permissions are granted by the super admin."}
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function DashCard({ icon, title, href }: { icon: React.ReactNode; title: string; href: string }) {
  return (
    <a
      href={href}
      className="block p-6 rounded-xl border bg-card hover:bg-accent transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          {icon}
        </div>
        <div className="font-semibold">{title}</div>
      </div>
    </a>
  );
}

function PermRow({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="flex items-center justify-between border-b last:border-0 py-1.5">
      <span>{label}</span>
      <span className={on ? "text-green-600 font-medium" : "text-muted-foreground"}>
        {on ? "✓" : "—"}
      </span>
    </div>
  );
}
