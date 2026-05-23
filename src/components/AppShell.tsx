import { Link, useNavigate } from "@tanstack/react-router";
import { Moon, Sun, Languages, LogOut, Users, CalendarCheck2, ShieldCheck, LayoutDashboard, Menu, X, Church } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const { t, toggleLang, lang } = useI18n();
  const { theme, toggle } = useTheme();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = profile?.role === "super_admin";

  const links = [
    { to: "/", label: t("dashboard_home"), icon: LayoutDashboard, exact: true },
    { to: "/students", label: t("students"), icon: Users, exact: false },
    { to: "/attendance", label: t("attendance"), icon: CalendarCheck2, exact: false },
    ...(isAdmin ? [{ to: "/servants", label: t("servants"), icon: ShieldCheck, exact: false }] : []),
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-card/80 border-b border-border/60 shadow-soft">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="size-9 rounded-xl bg-gradient-primary text-gold flex items-center justify-center shadow-elegant group-hover:scale-105 transition-transform">
              <Church className="size-5" />
            </div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="font-bold text-sm">{t("app_title")}</span>
              <span className="text-[10px] text-muted-foreground">{t("app_subtitle")}</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} icon={<l.icon className="size-4" />} exact={l.exact}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggleLang} title={t("language")} className="rounded-full">
              <Languages className="size-4" />
              <span className="sr-only">{lang === "ar" ? "EN" : "AR"}</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={toggle} title={t("theme")} className="rounded-full">
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hidden sm:inline-flex hover:text-destructive"
              onClick={async () => { await signOut(); navigate({ to: "/login" }); }}
              title={t("logout")}
            >
              <LogOut className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-full"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="menu"
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile drawer */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-[max-height,opacity] duration-300 border-t border-border/60",
            menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <nav className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} icon={<l.icon className="size-4" />} exact={l.exact} onClick={() => setMenuOpen(false)} block>
                {l.label}
              </NavLink>
            ))}
            <button
              onClick={async () => { setMenuOpen(false); await signOut(); navigate({ to: "/login" }); }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="size-4" />
              <span>{t("logout")}</span>
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 md:py-8 animate-fade-in-up">{children}</main>

      <footer className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        {t("app_title")} · {new Date().getFullYear()}
      </footer>
    </div>
  );
}

function NavLink({
  to, children, icon, exact, onClick, block,
}: { to: string; children: ReactNode; icon: ReactNode; exact?: boolean; onClick?: () => void; block?: boolean }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-all duration-200",
        block && "w-full"
      )}
      activeProps={{
        className: "!text-foreground bg-accent/80 shadow-soft [&_.nav-indicator]:opacity-100 [&_.nav-indicator]:scale-x-100",
      }}
      activeOptions={{ exact }}
    >
      {icon}
      <span>{children}</span>
      <span className="nav-indicator absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-gold rounded-full opacity-0 scale-x-0 origin-center transition-all duration-300" />
    </Link>
  );
}
