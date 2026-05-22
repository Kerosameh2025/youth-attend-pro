import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Languages, Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { t, toggleLang } = useI18n();
  const { theme, toggle } = useTheme();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (session) {
    navigate({ to: "/" });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(t("welcome"));
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <div className="absolute top-4 end-4 flex gap-1">
        <Button variant="ghost" size="icon" onClick={toggleLang}><Languages className="size-4" /></Button>
        <Button variant="ghost" size="icon" onClick={toggle}>
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">{t("app_title")}</CardTitle>
          <p className="text-center text-sm text-muted-foreground">{t("app_subtitle")}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("loading") : t("login")}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t("no_account")}{" "}
              <Link to="/signup" className="text-primary font-medium hover:underline">{t("signup")}</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
