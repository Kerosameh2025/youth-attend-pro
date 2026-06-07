import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Upload, ArrowRight, FileSpreadsheet, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { parseSpreadsheet, smartMatch } from "@/lib/export";

export const Route = createFileRoute("/students/import")({
  component: () => (
    <RequireAuth>
      <ImportPage />
    </RequireAuth>
  ),
});

type FieldKey = "code" | "name" | "age" | "birth_date" | "phones" | "address" | "school" | "father_job" | "notes";

const FIELD_ALIASES: Record<FieldKey, { ar: string; en: string; aliases: string[] }> = {
  code:       { ar: "الكود", en: "Code", aliases: ["code", "id", "كود", "رقم", "no", "number", "م"] },
  name:       { ar: "الاسم", en: "Name", aliases: ["name", "fullname", "اسم", "الاسم", "student"] },
  age:        { ar: "العمر", en: "Age", aliases: ["age", "عمر", "السن", "سن"] },
  birth_date: { ar: "تاريخ الميلاد", en: "Birth Date", aliases: ["birth_date", "birthdate", "dob", "date_of_birth", "تاريخ الميلاد", "تاريخ ميلاد", "الميلاد", "تاريخالميلاد", "تاريخميلاد"] },
  phones:     { ar: "أرقام التليفون", en: "Phones", aliases: ["phone", "phones", "mobile", "tel", "telephone", "تليفون", "هاتف", "موبايل", "رقم"] },
  address:    { ar: "العنوان", en: "Address", aliases: ["address", "عنوان", "العنوان"] },
  school:     { ar: "المدرسة", en: "School", aliases: ["school", "مدرسة", "المدرسة"] },
  father_job: { ar: "وظيفة الأب", en: "Father's Job", aliases: ["father", "fatherjob", "job", "وظيفة", "الأب", "وظيفةالأب"] },
  notes:      { ar: "ملاحظات", en: "Notes", aliases: ["notes", "note", "comment", "ملاحظات", "ملاحظة"] },
};

/** Normalize a single Egyptian phone number to E.164 (+20XXXXXXXXXX). Returns null if invalid. */
function normalizeEgPhone(raw: string): string | null {
  let digits = String(raw).replace(/\D/g, "");
  if (!digits) return null;
  // strip country code if present
  if (digits.startsWith("0020")) digits = digits.slice(4);
  else if (digits.startsWith("20") && digits.length >= 12) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length !== 10) return null;
  if (!/^(10|11|12|15)/.test(digits)) return null;
  return `+20${digits}`;
}

/** Parse a date in DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY (also . separator, Excel serial). Returns YYYY-MM-DD or null. */
function parseBirthDate(raw: unknown): string | null {
  if (raw == null || raw === "") return null;
  // Excel numeric serial date
  if (typeof raw === "number" && Number.isFinite(raw)) {
    const ms = Math.round((raw - 25569) * 86400 * 1000);
    const d = new Date(ms);
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  const s = String(raw).trim();
  if (!s) return null;
  // YYYY-MM-DD or YYYY/MM/DD
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) {
    const [, y, mo, d] = m;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    const day = parseInt(d, 10), month = parseInt(mo, 10);
    if (day < 1 || day > 31 || month < 1 || month > 12) return null;
    return `${y}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return null;
}

function ageFromBirthDate(iso: string): number | null {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age >= 0 && age < 150 ? age : null;
}

function ImportPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const canAdd = profile?.role === "super_admin" || profile?.perm_add_student;

  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Record<FieldKey, string>>({} as Record<FieldKey, string>);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);

  if (!canAdd) {
    return <div className="text-center py-12 text-muted-foreground">{t("no_permission")}</div>;
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const { headers, rows } = await parseSpreadsheet(f);
      setHeaders(headers);
      setRows(rows);
      setFileName(f.name);
      // Smart mapping
      const map = {} as Record<FieldKey, string>;
      (Object.keys(FIELD_ALIASES) as FieldKey[]).forEach((k) => {
        const match = smartMatch(headers, [k, ...FIELD_ALIASES[k].aliases]);
        if (match) map[k] = match;
      });
      setMapping(map);
      toast.success(`${rows.length} ${t("rows_detected")}`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const startImport = async () => {
    if (!mapping.name && !mapping.code) {
      toast.error(lang === "ar" ? "يجب تحديد الاسم أو الكود على الأقل" : "Map Name or Code at minimum");
      return;
    }
    setImporting(true);
    try {
      let skippedPhones = 0;
      const toInsert = rows.map((r, idx) => {
        const phonesRaw = mapping.phones ? String(r[mapping.phones] ?? "") : "";
        const phoneParts = phonesRaw
          ? phonesRaw.split(/[,/|;\n]+/).map((p) => p.trim()).filter(Boolean)
          : [];
        const phones: string[] = [];
        for (const p of phoneParts) {
          const norm = normalizeEgPhone(p);
          if (norm) phones.push(norm);
          else skippedPhones++;
        }
        const birth_date = mapping.birth_date ? parseBirthDate(r[mapping.birth_date]) : null;
        const ageRaw = mapping.age ? r[mapping.age] : null;
        let age: number | null = ageRaw != null && ageRaw !== "" ? Number(ageRaw) : null;
        if ((age == null || !Number.isFinite(age)) && birth_date) age = ageFromBirthDate(birth_date);
        return {
          code: mapping.code ? String(r[mapping.code] ?? "").trim() || `AUTO-${Date.now()}-${idx}` : `AUTO-${Date.now()}-${idx}`,
          name: mapping.name ? String(r[mapping.name] ?? "").trim() : "",
          age: Number.isFinite(age as number) ? age : null,
          birth_date,
          phones,
          address: mapping.address ? String(r[mapping.address] ?? "").trim() || null : null,
          school: mapping.school ? String(r[mapping.school] ?? "").trim() || null : null,
          father_job: mapping.father_job ? String(r[mapping.father_job] ?? "").trim() || null : null,
          notes: mapping.notes ? String(r[mapping.notes] ?? "").trim() || null : null,
        };
      }).filter((r) => r.name);

      // Chunked insert
      const chunkSize = 200;
      let inserted = 0;
      for (let i = 0; i < toInsert.length; i += chunkSize) {
        const chunk = toInsert.slice(i, i + chunkSize);
        const { error } = await supabase.from("students").upsert(chunk, { onConflict: "code" });
        if (error) throw error;
        inserted += chunk.length;
      }
      toast.success(`${t("imported_success")} (${inserted})`);
      if (skippedPhones > 0) {
        toast.warning(
          lang === "ar"
            ? `تم تخطي ${skippedPhones} أرقام غير صحيحة`
            : `Skipped ${skippedPhones} invalid phone numbers`
        );
      }
      navigate({ to: "/students" });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setImporting(false);
    }
  };

  const previewRows = rows.slice(0, 5);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link to="/students"><ArrowRight className="size-4 rtl:rotate-180" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t("import_students")}</h1>
          <p className="text-sm text-muted-foreground">{lang === "ar" ? "استيراد من Excel أو CSV مع مطابقة ذكية للأعمدة" : "Import from Excel or CSV with smart column mapping"}</p>
        </div>
      </div>

      {/* Upload */}
      {!rows.length && (
        <label className="block rounded-2xl border-2 border-dashed border-border/60 bg-card p-10 text-center cursor-pointer hover:bg-accent/30 transition-colors">
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFile} />
          <FileSpreadsheet className="size-12 mx-auto text-gold" />
          <div className="mt-3 font-semibold">{t("upload_file")}</div>
          <div className="text-xs text-muted-foreground mt-1">.xlsx · .xls · .csv</div>
          <Button type="button" className="mt-4 pointer-events-none">
            <Upload className="size-4" /> {t("upload")}
          </Button>
        </label>
      )}

      {/* Mapping + preview */}
      {!!rows.length && (
        <>
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold">{t("column_mapping")}</h2>
                <p className="text-xs text-muted-foreground">{t("column_mapping_desc")}</p>
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="size-3.5" /> {fileName} — {rows.length} {t("rows_detected")}
                </p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(Object.keys(FIELD_ALIASES) as FieldKey[]).map((k) => (
                <div key={k} className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    {FIELD_ALIASES[k][lang]}
                    {(k === "name" || k === "code") && <span className="text-destructive"> *</span>}
                  </label>
                  <Select
                    value={mapping[k] ?? "__none__"}
                    onValueChange={(v) =>
                      setMapping((m) => {
                        const next = { ...m };
                        if (v === "__none__") delete next[k];
                        else next[k] = v;
                        return next;
                      })
                    }
                  >
                    <SelectTrigger><SelectValue placeholder={t("not_mapped")} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— {t("not_mapped")} —</SelectItem>
                      {headers.map((h) => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-soft overflow-hidden">
            <h2 className="font-bold mb-3">{t("preview")} ({previewRows.length} / {rows.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {(Object.keys(FIELD_ALIASES) as FieldKey[]).map((k) => (
                      <th key={k} className="px-2 py-2 text-start font-medium text-xs text-muted-foreground">
                        {FIELD_ALIASES[k][lang]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((r, i) => (
                    <tr key={i} className="border-b last:border-0">
                      {(Object.keys(FIELD_ALIASES) as FieldKey[]).map((k) => (
                        <td key={k} className="px-2 py-2 text-xs">
                          {mapping[k] ? String(r[mapping[k]] ?? "") : <span className="text-muted-foreground">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => { setRows([]); setHeaders([]); setMapping({} as Record<FieldKey, string>); }}>
              {t("cancel")}
            </Button>
            <Button onClick={startImport} disabled={importing}>
              {importing ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {t("import_now")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
