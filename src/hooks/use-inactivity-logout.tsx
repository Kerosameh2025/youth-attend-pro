import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/lib/i18n";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

const IDLE_MS = 60 * 60 * 1000;      // 60 minutes
const WARN_BEFORE_MS = 2 * 60 * 1000; // 2 minutes warning
const TICK_MS = 1000;

export function InactivityGuard() {
  const { profile, signOut } = useAuth();
  const { lang } = useI18n();
  const navigate = useNavigate();
  const [showWarn, setShowWarn] = useState(false);
  const [remaining, setRemaining] = useState(WARN_BEFORE_MS);
  const lastActivityRef = useRef<number>(Date.now());
  const tickRef = useRef<number | null>(null);

  const isServant = profile?.role === "servant";

  // Track user activity
  useEffect(() => {
    if (!isServant) return;
    const reset = () => {
      lastActivityRef.current = Date.now();
      if (showWarn) setShowWarn(false);
    };
    const events: (keyof WindowEventMap)[] = [
      "mousedown", "mousemove", "keydown", "touchstart", "scroll", "click",
    ];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    return () => events.forEach((e) => window.removeEventListener(e, reset));
  }, [isServant, showWarn]);

  // Tick to evaluate idle state
  useEffect(() => {
    if (!isServant) return;
    const tick = () => {
      const idle = Date.now() - lastActivityRef.current;
      const untilLogout = IDLE_MS - idle;
      if (untilLogout <= 0) {
        // Auto sign out
        void (async () => {
          await signOut();
          navigate({ to: "/login", search: { reason: "inactivity" } as any });
        })();
        return;
      }
      if (untilLogout <= WARN_BEFORE_MS) {
        setShowWarn(true);
        setRemaining(untilLogout);
      }
    };
    tickRef.current = window.setInterval(tick, TICK_MS) as unknown as number;
    return () => { if (tickRef.current) window.clearInterval(tickRef.current); };
  }, [isServant, signOut, navigate]);

  if (!isServant) return null;

  const handleStay = () => {
    lastActivityRef.current = Date.now();
    setShowWarn(false);
  };
  const handleLogoutNow = async () => {
    setShowWarn(false);
    await signOut();
    navigate({ to: "/login" });
  };

  const secs = Math.max(0, Math.ceil(remaining / 1000));
  const mm = Math.floor(secs / 60);
  const ss = (secs % 60).toString().padStart(2, "0");

  const title = lang === "ar"
    ? "ستيم تسجيل خروجك تلقائياً خلال دقيقتين"
    : "You will be signed out automatically in 2 minutes";
  const desc = lang === "ar"
    ? "هل تريد الاستمرار في الجلسة؟"
    : "Do you want to continue your session?";
  const stay = lang === "ar" ? "نعم، استمر" : "Yes, continue";
  const out = lang === "ar" ? "تسجيل خروج الآن" : "Sign out now";

  return (
    <Dialog open={showWarn} onOpenChange={(o) => { if (!o) handleStay(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-500" />
            {title}
          </DialogTitle>
          <DialogDescription>{desc}</DialogDescription>
        </DialogHeader>
        <div className="text-center py-2">
          <div className="text-4xl font-mono font-bold tabular-nums text-amber-500">
            {mm}:{ss}
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleLogoutNow}>{out}</Button>
          <Button onClick={handleStay} className="bg-gradient-primary shadow-elegant">{stay}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
