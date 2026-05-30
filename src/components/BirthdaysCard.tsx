import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Cake, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

type S = { id: string; name: string; birth_date: string | null };

const AR_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];
const EN_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const AR_WEEK_ORDINAL = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس"];

export function BirthdaysCard() {
  const { t, lang } = useI18n();
  const today = new Date();
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() }); // 0-indexed month
  const [students, setStudents] = useState<S[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("students")
        .select("id,name,birth_date")
        .not("birth_date", "is", null);
      setStudents((data ?? []) as S[]);
    })();
  }, []);

  const monthName = (lang === "ar" ? AR_MONTHS : EN_MONTHS)[cursor.month];
  const header = lang === "ar"
    ? `${monthName} - شهر ${cursor.month + 1} - ${cursor.year}`
    : `${monthName} - Month ${cursor.month + 1} - ${cursor.year}`;

  // Build weeks (Saturday → Friday) covering the month
  const weeks = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const last = new Date(cursor.year, cursor.month + 1, 0);
    const out: { start: Date; end: Date; entries: { s: S; date: Date; turning: number }[] }[] = [];
    // Find first Saturday on or before the 1st
    const cur = new Date(first);
    const dayDiff = (cur.getDay() - 6 + 7) % 7; // 6 = Saturday
    cur.setDate(cur.getDate() - dayDiff);
    while (cur <= last) {
      const start = new Date(cur);
      const end = new Date(cur);
      end.setDate(end.getDate() + 6);
      out.push({ start, end, entries: [] });
      cur.setDate(cur.getDate() + 7);
    }

    // Assign students whose birthday-this-month falls in a week
    students.forEach((s) => {
      if (!s.birth_date) return;
      const bd = new Date(s.birth_date);
      if (bd.getMonth() !== cursor.month) return;
      const occur = new Date(cursor.year, cursor.month, bd.getDate());
      const turning = cursor.year - bd.getFullYear();
      for (const w of out) {
        if (occur >= w.start && occur <= w.end) {
          w.entries.push({ s, date: occur, turning });
          break;
        }
      }
    });

    out.forEach((w) => w.entries.sort((a, b) => a.date.getTime() - b.date.getTime()));
    return out.filter((w) => w.end.getMonth() === cursor.month || w.start.getMonth() === cursor.month);
  }, [cursor, students]);

  const visibleWeeks = weeks.filter((w) => w.entries.length > 0);
  const totalBirthdays = visibleWeeks.reduce((a, w) => a + w.entries.length, 0);

  const nav = (dir: -1 | 1) => {
    setCursor((c) => {
      const m = c.month + dir;
      if (m < 0) return { year: c.year - 1, month: 11 };
      if (m > 11) return { year: c.year + 1, month: 0 };
      return { year: c.year, month: m };
    });
  };

  // Build a week label based on the in-month days
  const weekLabel = (w: typeof weeks[number], ordinalIdx: number) => {
    const inStart = w.start.getMonth() === cursor.month ? w.start.getDate() : 1;
    const lastDay = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const inEnd = w.end.getMonth() === cursor.month ? w.end.getDate() : lastDay;
    if (lang === "ar") {
      const ord = AR_WEEK_ORDINAL[ordinalIdx] ?? String(ordinalIdx + 1);
      return `${t("week_n")} ${ord} (${inStart} - ${inEnd} ${monthName})`;
    }
    return `Week ${ordinalIdx + 1} (${inStart} - ${inEnd} ${monthName})`;
  };

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-xl flex items-center justify-center bg-gold/15 text-gold shrink-0">
            <Cake className="size-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold truncate">{t("birthdays")}</h2>
            <p className="text-xs text-muted-foreground truncate">{header}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => nav(-1)}
            className="size-8 rounded-lg border border-border/60 hover:bg-accent inline-flex items-center justify-center"
            aria-label="prev"
          >
            <ChevronRight className="size-4 rtl:hidden" />
            <ChevronLeft className="size-4 hidden rtl:inline" />
          </button>
          <button
            type="button"
            onClick={() => nav(1)}
            className="size-8 rounded-lg border border-border/60 hover:bg-accent inline-flex items-center justify-center"
            aria-label="next"
          >
            <ChevronLeft className="size-4 rtl:hidden" />
            <ChevronRight className="size-4 hidden rtl:inline" />
          </button>
        </div>
      </div>

      {totalBirthdays === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          {t("no_birthdays_month")}
        </div>
      ) : (
        <div className="space-y-5">
          {visibleWeeks.map((w, idx) => {
            // Find ordinal among ALL weeks (not just visible) for consistent labels
            const allIdx = weeks.indexOf(w);
            return (
              <div key={idx} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-semibold text-muted-foreground px-2">
                    {weekLabel(w, allIdx)}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <ul className="space-y-2">
                  {w.entries.map(({ s, date, turning }) => (
                    <li
                      key={s.id}
                      className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/50 px-3.5 py-2.5"
                    >
                      <Gift className="size-4 text-gold shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{s.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {date.getDate()} {monthName} · {t("turns_age")} {turning} {t("years_old")}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
