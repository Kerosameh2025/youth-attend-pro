import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StudentForm } from "@/components/StudentForm";
import { RequireAuth } from "@/components/RequireAuth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/students/new")({
  component: () => (
    <RequireAuth>
      <NewStudent />
    </RequireAuth>
  ),
});

function NewStudent() {
  const navigate = useNavigate();
  const { t } = useI18n();
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{t("add_student")}</h1>
      <StudentForm onDone={() => navigate({ to: "/students" })} />
    </div>
  );
}
