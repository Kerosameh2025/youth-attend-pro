import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Church, User, Mail, Lock, AlertCircle, CheckCircle2, XCircle, Languages, Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const { t, toggleLang, lang } = useI18n();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const required = lang === "ar" ? "هذا الحقل مطلوب" : "This field is required";

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = required;
    if (!email.trim()) e.email = required;
    if (!password.trim()) e.password = required;
    else if (password.length < 6) e.password = lang === "ar" ? "كلمة المرور يجب ألا تقل عن 6 أحرف" : "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: name },
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message, {
        icon: <XCircle className="size-5 text-destructive" />,
        className: "!border-destructive/40 !bg-destructive/5",
      });
      return;
    }
    toast.success(lang === "ar" ? "تم إنشاء الحساب بنجاح" : "Account created successfully", {
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
          <h2 className="text-xl font-bold mb-1">{t("signup")}</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {lang === "ar" ? "أنشئ حسابك الجديد للبدء" : "Create your account to get started"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Field id="name" label={t("full_name")} icon={<User className="size-4" />} value={name} onChange={setName} error={errors.name} />
            <Field id="email" label={t("email")} icon={<Mail className="size-4" />} type="email" value={email} onChange={setEmail} error={errors.email} />
            <Field id="password" label={t("password")} icon={<Lock className="size-4" />} type="password" value={password} onChange={setPassword} error={errors.password} />
            <Button type="submit" className="w-full h-11 bg-gradient-primary hover:opacity-95 shadow-elegant text-base font-semibold" disabled={loading}>
              {loading ? t("loading") : t("signup")}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t("have_account")}{" "}
              <Link to="/login" className="text-gold font-semibold hover:underline underline-offset-4">{t("login")}</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({
  id, label, icon, type = "text", value, onChange, error,
}: { id: string; label: string; icon: React.ReactNode; type?: string; value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <div className="relative">
        <span className="absolute inset-y-0 start-3 flex items-center text-muted-foreground pointer-events-none">{icon}</span>
        <Input
          id={id} type={type} value={value}
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
