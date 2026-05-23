import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Languages, Moon, Sun, Church, Mail, Lock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function friendlyAuthError(msg: string, lang: "ar" | "en") {
  const m = msg.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials") || m.includes("invalid_credentials")) {
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  if (session) navigate({ to: "/" });

  const validate = () => {
    const e: typeof errors = {};
    const required = lang === "ar" ? "هذا الحقل مطلوب" : "This field is required";
    if (!email.trim()) e.email = required;
    if (!password.trim()) e.password = required;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      const msg = friendlyAuthError(error.message, lang);
      toast.error(msg, {
        icon: <XCircle className="size-5 text-destructive" />,
        className: "!border-destructive/40 !bg-destructive/5",
      });
      return;
    }
    toast.success(lang === "ar" ? "تم تسجيل الدخول بنجاح" : "Signed in successfully", {
      icon: <CheckCircle2 className="size-5 text-emerald-500" />,
      className: "!border-emerald-500/40 !bg-emerald-500/5",
    });
    navigate({ to: "/" });
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background text-foreground p-4 overflow-hidden">
      {/* Background flourish */}
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
          <h2 className="text-xl font-bold mb-1">{t("login")}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {lang === "ar" ? "أدخل بياناتك للمتابعة" : "Enter your credentials to continue"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Field
              id="email" label={t("email")} icon={<Mail className="size-4" />}
              type="email" value={email} onChange={setEmail} error={errors.email}
              autoComplete="email"
            />
            <Field
              id="password" label={t("password")} icon={<Lock className="size-4" />}
              type="password" value={password} onChange={setPassword} error={errors.password}
              autoComplete="current-password"
            />
            <Button type="submit" className="w-full h-11 bg-gradient-primary hover:opacity-95 shadow-elegant text-base font-semibold" disabled={loading}>
              {loading ? t("loading") : t("login")}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t("no_account")}{" "}
              <Link to="/signup" className="text-gold font-semibold hover:underline underline-offset-4">{t("signup")}</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({
  id, label, icon, type, value, onChange, error, autoComplete,
}: {
  id: string; label: string; icon: React.ReactNode; type: string;
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
