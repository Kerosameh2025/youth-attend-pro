import { useState } from "react";
import { toast } from "sonner";
import { Plus, X, Upload, Trash2 } from "lucide-react";
import { supabase, type Student } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { compressAndUploadPhoto } from "@/lib/storage";
import { StudentAvatar } from "@/components/StudentAvatar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function StudentForm({ initial, onDone }: { initial?: Student; onDone: () => void }) {
  const { t } = useI18n();
  const { session } = useAuth();
  const [code, setCode] = useState(initial?.code ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [age, setAge] = useState<string>(initial?.age?.toString() ?? "");
  const [phones, setPhones] = useState<string[]>(initial?.phones?.length ? initial.phones : [""]);
  const [address, setAddress] = useState(initial?.address ?? "");
  const [school, setSchool] = useState(initial?.school ?? "");
  const [fatherJob, setFatherJob] = useState(initial?.father_job ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [photoPath, setPhotoPath] = useState(initial?.photo_path ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDeletePhoto, setConfirmDeletePhoto] = useState(false);

  const handlePhoto = async (file: File | null) => {
    if (!file) return;
    if (!code.trim()) return toast.error(t("code"));
    setUploading(true);
    try {
      const path = await compressAndUploadPhoto(file, code);
      setPhotoPath(path);
      toast.success(t("saved"));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      code: code.trim(),
      name: name.trim(),
      age: age ? Number(age) : null,
      phones: phones.map((p) => p.trim()).filter(Boolean),
      address: address || null,
      school: school || null,
      father_job: fatherJob || null,
      notes: notes || null,
      photo_path: photoPath,
    };
    const q = initial
      ? supabase.from("students").update(payload).eq("id", initial.id)
      : supabase.from("students").insert({ ...payload, created_by: session?.user.id });
    const { error } = await q;
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(t("saved"));
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-4 bg-card p-4 md:p-6 rounded-xl border">
      <div className="flex items-center gap-4">
        <StudentAvatar path={photoPath} name={name || "?"} size={80} />
        <div>
          <Label htmlFor="photo" className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-background hover:bg-accent">
            <Upload className="size-4" />
            {uploading ? t("loading") : t("photo")}
          </Label>
          <input
            id="photo"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handlePhoto(e.target.files?.[0] || null)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{t("code")} *</Label>
          <Input required value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("name")} *</Label>
          <Input required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("age")}</Label>
          <Input type="number" min={5} max={20} value={age} onChange={(e) => setAge(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("school")}</Label>
          <Input value={school ?? ""} onChange={(e) => setSchool(e.target.value)} />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <Label>{t("address")}</Label>
          <Input value={address ?? ""} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("father_job")}</Label>
          <Input value={fatherJob ?? ""} onChange={(e) => setFatherJob(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("phones")}</Label>
        {phones.map((p, i) => (
          <div key={i} className="flex gap-2">
            <Input
              dir="ltr"
              value={p}
              onChange={(e) => setPhones(phones.map((x, j) => (i === j ? e.target.value : x)))}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => setPhones(phones.filter((_, j) => j !== i))}>
              <X className="size-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => setPhones([...phones, ""])}>
          <Plus className="size-4" /> {t("add_phone")}
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label>{t("notes")}</Label>
        <Textarea rows={3} value={notes ?? ""} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onDone}>{t("cancel")}</Button>
        <Button type="submit" disabled={saving}>{saving ? t("loading") : t("save")}</Button>
      </div>
    </form>
  );
}
