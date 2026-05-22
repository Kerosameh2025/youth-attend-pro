import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StudentForm } from "@/components/StudentForm";
import { RequireAuth } from "@/components/RequireAuth";
import { useI18n } from "@/lib/i18n";
import { supabase, type Student } from "@/integrations/supabase/client";

export const Route = createFileRoute("/students/$id")({
  component: () => (
    <RequireAuth>
      <EditStudent />
    </RequireAuth>
  ),
});

function EditStudent() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [student, setStudent] = useState<Student | null>(null);

  useEffect(() => {
    supabase.from("students").select("*").eq("id", id).maybeSingle().then(({ data }) => {
      setStudent(data as Student | null);
    });
  }, [id]);

  if (!student) return <div className="text-center py-12 text-muted-foreground">{t("loading")}</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{t("edit")}: {student.name}</h1>
      <StudentForm initial={student} onDone={() => navigate({ to: "/students" })} />
    </div>
  );
}
