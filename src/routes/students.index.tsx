import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Search, Upload, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase, type Student } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StudentAvatar } from "@/components/StudentAvatar";
import { exportToExcel, exportToPDF } from "@/lib/export";

type SearchField = "name" | "code" | "phone" | "address" | "birth_date" | "father_job" | "age" | "school";
type SortField = "code" | "birth_date" | "school";

export const Route = createFileRoute("/students/")({
  component: () => (
    <RequireAuth>
      <StudentsPage />
    </RequireAuth>
  ),
});

function StudentsPage() {
  const { t, lang } = useI18n();
  const { profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [searchField, setSearchField] = useState<SearchField>(() => (localStorage.getItem("students:searchField") as SearchField) || "name");
  const [sortField, setSortField] = useState<SortField>(() => (localStorage.getItem("students:sortField") as SortField) || "code");

  useEffect(() => { localStorage.setItem("students:searchField", searchField); }, [searchField]);
  useEffect(() => { localStorage.setItem("students:sortField", sortField); }, [sortField]);
  const canAdd = profile?.role === "super_admin" || profile?.perm_add_student;
  const canEdit = profile?.role === "super_admin" || profile?.perm_edit_student;
  const canDelete = profile?.role === "super_admin";
  const canViewPhones = profile?.role === "super_admin" || profile?.perm_view_phones;

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .order("code", { ascending: true });
    if (error) toast.error(error.message);
    setStudents((data as Student[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!confirm(t("confirm_delete"))) return;
    const snapshot = students.find((s) => s.id === id);
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(t("saved"), {
      action: snapshot ? {
        label: t("undo"),
        onClick: async () => {
          const { id: _id, created_at: _c, ...rest } = snapshot as any;
          const { error: e2 } = await supabase.from("students").insert(rest);
          if (e2) return toast.error(e2.message);
          toast.success(t("restored"));
          load();
        },
      } : undefined,
    });
    load();
  };

  const matchesSearch = (s: Student) => {
    if (!q) return true;
    const needle = q.toLowerCase().trim();
    const fieldVal = (() => {
      switch (searchField) {
        case "name": return s.name;
        case "code": return s.code;
        case "phone": return (s.phones ?? []).join(" ");
        case "address": return s.address ?? "";
        case "birth_date": return s.birth_date ?? "";
        case "father_job": return s.father_job ?? "";
        case "age": return s.age != null ? String(s.age) : "";
        case "school": return s.school ?? "";
      }
    })();
    return (fieldVal ?? "").toString().toLowerCase().includes(needle);
  };

  const filtered = useMemo(() => {
    const arr = students.filter(matchesSearch);
    const sorted = [...arr].sort((a, b) => {
      if (sortField === "code") {
        const na = Number(a.code), nb = Number(b.code);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return a.code.localeCompare(b.code);
      }
      if (sortField === "birth_date") {
        return (a.birth_date ?? "").localeCompare(b.birth_date ?? "");
      }
      if (sortField === "school") {
        return (a.school ?? "").localeCompare(b.school ?? "", lang === "ar" ? "ar" : "en");
      }
      return 0;
    });
    return sorted;
  }, [students, q, searchField, sortField, lang]);


  

  const buildExportRows = () =>
    filtered.map((s) => ({
      code: s.code,
      name: s.name,
      age: s.age ?? "",
      phones: canViewPhones ? (s.phones ?? []).join(" / ") : "***",
      school: s.school ?? "",
      address: s.address ?? "",
      father_job: s.father_job ?? "",
      notes: s.notes ?? "",
    }));

  const onExportExcel = () => {
    exportToExcel(buildExportRows(), `students-${new Date().toISOString().slice(0,10)}.xlsx`, "Students");
    toast.success(t("saved"));
  };

  const onExportPDF = () => {
    exportToPDF({
      title: t("students"),
      subtitle: lang === "ar" ? "قائمة الطلاب" : "Students list",
      lang, dir: lang === "ar" ? "rtl" : "ltr",
      columns: [
        { key: "code", label: t("code") },
        { key: "name", label: t("name") },
        { key: "age", label: t("age") },
        { key: "phones", label: t("phones") },
        { key: "school", label: t("school") },
        { key: "address", label: t("address") },
      ],
      rows: buildExportRows(),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">{t("students")}</h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onExportExcel} disabled={!filtered.length}>
            <FileSpreadsheet className="size-4" /> {t("export_excel")}
          </Button>
          <Button variant="outline" size="sm" onClick={onExportPDF} disabled={!filtered.length}>
            <FileText className="size-4" /> {t("export_pdf")}
          </Button>
          {canAdd && (
            <>
              <Button asChild variant="outline" size="sm">
                <Link to="/students/import"><Upload className="size-4" /> {t("import")}</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/students/new"><Plus className="size-4" /> {t("add_student")}</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="size-4 absolute top-2.5 start-3 text-muted-foreground" />
        <Input className="ps-9" placeholder={t("search")} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">{t("loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">{t("no_students")}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((s) => (
            <div key={s.id} className="rounded-xl border bg-card p-4 flex gap-3">
              <StudentAvatar path={s.photo_path} name={s.name} size={64} enlargeable />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-mono text-muted-foreground">#{s.code}</span>
                </div>
                <div className="font-semibold truncate">{s.name}</div>
                <div className="text-sm text-muted-foreground truncate">{s.school || "—"}</div>
                <div className="text-sm text-muted-foreground truncate" dir="ltr">
                  {canViewPhones
                    ? s.phones?.[0] || t("no_phone")
                    : s.phones?.length ? `••• (${t("hidden")})` : t("no_phone")}
                </div>
                <div className="flex gap-1 mt-2">
                  {canEdit && (
                    <Button asChild size="sm" variant="outline">
                      <Link to="/students/$id" params={{ id: s.id }}><Pencil className="size-3" /> {t("edit")}</Link>
                    </Button>
                  )}
                  {canDelete && (
                    <Button size="sm" variant="ghost" onClick={() => remove(s.id)}>
                      <Trash2 className="size-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
