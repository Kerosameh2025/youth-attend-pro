import { Link, useNavigate } from "@tanstack/react-router";
import { Moon, Sun, Languages, LogOut, Users, Calendar, UserCog, Home } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const { t, toggleLang, lang } = useI18n();
  const { theme, toggle } = useTheme();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const isAdmin = profile?.role === "super_admin";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="font-bold text-lg truncate">
            {t("app_title")}
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" icon={<Home className="size-4" />}>{t("dashboard_home")}</NavLink>
            <NavLink to="/students" icon={<Users className="size-4" />}>{t("students")}</NavLink>
            <NavLink to="/attendance" icon={<Calendar className="size-4" />}>{t("attendance")}</NavLink>
            {isAdmin && (
              <NavLink to="/servants" icon={<UserCog className="size-4" />}>{t("servants")}</NavLink>
            )}
          </nav>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggleLang} title={t("language")}>
              <Languages className="size-4" />
              <span className="sr-only">{lang === "ar" ? "EN" : "AR"}</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={toggle} title={t("theme")}>
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={async () => {
                await signOut();
                navigate({ to: "/login" });
              }}
              title={t("logout")}
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
        {/* Mobile nav */}
        <nav className="md:hidden border-t flex items-center justify-around py-2">
          <NavLink to="/" icon={<Home className="size-4" />}>{t("dashboard_home")}</NavLink>
          <NavLink to="/students" icon={<Users className="size-4" />}>{t("students")}</NavLink>
          <NavLink to="/attendance" icon={<Calendar className="size-4" />}>{t("attendance")}</NavLink>
          {isAdmin && <NavLink to="/servants" icon={<UserCog className="size-4" />}>{t("servants")}</NavLink>}
        </nav>
      </header>
      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

function NavLink({ to, children, icon }: { to: string; children: ReactNode; icon: ReactNode }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
      activeProps={{ className: "bg-accent text-accent-foreground font-semibold" }}
      activeOptions={{ exact: to === "/" }}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}
