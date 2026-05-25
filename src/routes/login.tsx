import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase, usernameToEmail } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Languages, Moon, Sun, Church, Mail, Lock, User as UserIcon,
  CheckCircle2, XCircle, AlertCircle, ShieldCheck, ArrowLeft,
} from "lucide-react";
import { useTheme } from "@/lib/theme";
import { getDeviceInfo } from "@/lib/device-info";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    reason: typeof s.reason === "string" ? (s.reason as string) : undefined,
  }),
  component: LoginPage,
});

function friendlyAuthError(msg: string, lang: "ar" | "en", mode: "servant" | "admin") {
  const m = msg.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials") || m.includes("invalid_credentials")) {
    if (mode === "servant") {
      return lang === "ar"
        ? "اسم المستخدم أو كلمة المرور غير صحيحة"
        : "Incorrect username or password";
    }
    return lang === "ar" ? "كلمة المرور غير صحيحة، يرجى المحاولة مجدداً" : "Incorrect password, please try again";
  }
  if (m.includes("user not found") || m.includes("not_found") || m.includes("no user")) {
    return lang === "ar" ? "البريد الإلكتروني غير مسجل" : "Email is not registered";
  }
  if (m.includes("email not confirmed")) {
    return lang === "ar" ? "البريد الإلكتروني لم يتم تأكيده بعد" : "Email not confirmed yet";
  }
  return msg;
}

function LoginPage() {
  const { t, toggleLang, lang } = useI18n();
  const { theme, toggle } = useTheme();
  const { session } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"servant" | "admin">("servant");

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Show inactivity toast once when redirected here
  const inactivityShown = useRef(false);
  useEffect(() => {
    if (search.reason === "inactivity" && !inactivityShown.current) {
      inactivityShown.current = true;
      toast.error(t("inactivity_signed_out"), {
        icon: <AlertCircle className="size-5 text-amber-500" />,
        className: "!border-amber-500/40 !bg-amber-500/5",
      });
      navigate({ to: "/login", search: {} as any, replace: true });
    }
  }, [search.reason, t, navigate]);

  if (session) navigate({ to: "/" });

  const required = lang === "ar" ? "هذا الحقل مطلوب" : "This field is required";

  const validate = () => {
    const e: Record<string, string> = {};
    if (mode === "servant") {
      if (!username.trim()) e.username = required;
    } else {
      if (!email.trim()) e.email = required;
    }
    if (!password.trim()) e.password = required;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const loginEmail = mode === "servant" ? usernameToEmail(username) : email.trim();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });
    if (error) {
      setLoading(false);
      toast.error(friendlyAuthError(error.message, lang, mode), {
        icon: <XCircle className="size-5 text-destructive" />,
        className: "!border-destructive/40 !bg-destructive/5",
      });
      return;
    }

    // For admin mode, ensure the account actually is super_admin
    if (mode === "admin" && data.user) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();
      if (prof?.role !== "super_admin") {
        await supabase.auth.signOut();
        setLoading(false);
        toast.error(t("no_permission_login"), {
          icon: <XCircle className="size-5 text-destructive" />,
          className: "!border-destructive/40 !bg-destructive/5",
        });
        return;
      }
    }

    // Record login activity (RLS allows insert for own id)
    if (data.user) {
      void supabase.from("servant_logins").insert({
        servant_id: data.user.id,
        device_info: getDeviceInfo(),
      });
    }

    setLoading(false);
    toast.success(lang === "ar" ? "تم تسجيل الدخول بنجاح" : "Signed in successfully", {
      icon: <CheckCircle2 className="size-5 text-emerald-500" />,
      className: "!border-emerald-500/40 !bg-emerald-500/5",
    });
    navigate({ to: "/" });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background text-foreground p-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero opacity-95" />
      <div className="absolute inset-0 bg-pattern-cross text-white" />
      <div className="absolute -top-32 -end-32 size-96 rounded-full bg-gold/20 blur-3xl" />
      <div className="absolute -bottom-32 -start-32 size-96 rounded-full bg-white/10 blur-3xl" />

      <div className="absolute top-4 end-4 flex gap-1 z-10">
        <Button variant="ghost" size="icon" onClick={toggleLang} className="rounded-full text-white hover:bg-white/10 hover:text-white">
          <Languages className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={toggle} className="rounded-full text-white hover:bg-white/10 hover:text-white">
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
      </div>

      <div className="relative w-full max-w-md animate-fade-in-up">
        <div className="flex flex-col items-center mb-6">
          <div className="size-16 rounded-2xl bg-gradient-gold flex items-center justify-center shadow-gold mb-3">
            <Church className="size-8 text-[oklch(0.2_0.04_260)]" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t("app_title")}</h1>
          <p className="text-sm text-white/70 mt-1">{t("app_subtitle")}</p>
        </div>

        <div className="rounded-3xl bg-card/95 backdrop-blur-xl border border-white/10 shadow-elegant p-6 md:p-8">
          <div className="flex items-center gap-2 mb-1">
            {mode === "admin" && (
              <button
                type="button"
                onClick={() => { setMode("servant"); setErrors({}); }}
                className="rounded-full p-1 hover:bg-accent/60 transition-colors"
                aria-label={t("back_to_servant")}
              >
                <ArrowLeft className="size-4 rtl:rotate-180" />
              </button>
            )}
            <h2 className="text-xl font-bold">
              {mode === "servant" ? t("servant_login") : t("admin_login")}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            {mode === "servant"
              ? lang === "ar" ? "أدخل اسم المستخدم وكلمة المرور" : "Enter your username and password"
              : lang === "ar" ? "تسجيل دخول المسؤول بالبريد الإلكتروني" : "Sign in with admin email"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate key={mode}>
            {mode === "servant" ? (
              <Field
                id="username" label={t("username")} icon={<UserIcon className="size-4" />}
                value={username} onChange={setUsername} error={errors.username}
                autoComplete="username"
              />
            ) : (
              <Field
                id="email" label={t("email")} icon={<Mail className="size-4" />}
                type="email" value={email} onChange={setEmail} error={errors.email}
                autoComplete="email"
              />
            )}
            <Field
              id="password" label={t("password")} icon={<Lock className="size-4" />}
              type="password" value={password} onChange={setPassword} error={errors.password}
              autoComplete="current-password"
            />
            <Button type="submit" className="w-full h-11 bg-gradient-primary hover:opacity-95 shadow-elegant text-base font-semibold" disabled={loading}>
              {loading ? t("loading") : t("login")}
            </Button>

            {mode === "servant" && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => { setMode("admin"); setErrors({}); setPassword(""); }}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold transition-colors group"
                >
                  <ShieldCheck className="size-3.5 group-hover:scale-110 transition-transform" />
                  <span className="underline-offset-4 group-hover:underline">{t("admin_login")}</span>
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({
  id, label, icon, type = "text", value, onChange, error, autoComplete,
}: {
  id: string; label: string; icon: React.ReactNode; type?: string;
  value: string; onChange: (v: string) => void; error?: string; autoComplete?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <span className="absolute inset-y-0 start-3 flex items-center text-muted-foreground pointer-events-none">{icon}</span>
        <Input
          id={id} type={type} value={value} autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className={`h-11 ps-10 ${error ? "border-destructive focus-visible:ring-destructive/40" : ""}`}
        />
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive animate-fade-in-up">
          <AlertCircle className="size-3.5" />
          {error}
        </p>
      )}
    </div>
  );
}
