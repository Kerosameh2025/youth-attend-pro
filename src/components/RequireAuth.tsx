import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import { AppShell } from "@/components/AppShell";
import type { ReactNode } from "react";

export function RequireAuth({ children, adminOnly }: { children: ReactNode; adminOnly?: boolean }) {
  const { session, loading, profile } = useAuth();
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        {t("loading")}
      </div>
    );
  }
  if (!session) return <Navigate to="/login" />;
  if (adminOnly && profile?.role !== "super_admin") {
    return (
      <AppShell>
        <div className="text-center py-12 text-muted-foreground">{t("no_permission")}</div>
      </AppShell>
    );
  }
  return <AppShell>{children}</AppShell>;
}
