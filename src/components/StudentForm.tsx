import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, X, Upload, Trash2, Calendar as CalendarIcon, AlertTriangle, Wand2 } from "lucide-react";
import { format, parse, isValid, differenceInYears } from "date-fns";
import { supabase, type Student } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { compressAndUploadPhoto } from "@/lib/storage";
import { StudentAvatar } from "@/components/StudentAvatar";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Compute age from a birth date relative to today.
function ageFromBirth(d: Date): number {
  return differenceInYears(new Date(), d);
}

export function StudentForm({ initial, onDone }: { initial?: Student; onDone: () => void }) {
  const { t } = useI18n();
  const { session, profile } = useAuth();
  const isNew = !initial;
  const canEditCode =
    profile?.role === "super_admin" ||
    (isNew ? !!profile?.perm_add_student : !!profile?.perm_edit_student);
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
  const [birthDate, setBirthDate] = useState<string>(initial?.birth_date ?? ""); // YYYY-MM-DD
  const [birthInput, setBirthInput] = useState<string>(
    initial?.birth_date ? format(new Date(initial.birth_date), "dd/MM/yyyy") : ""
  );
  const [calOpen, setCalOpen] = useState(false);

  const birthDateObj = useMemo(() => {
    if (!birthDate) return null;
    const d = new Date(birthDate);
    return isValid(d) ? d : null;
  }, [birthDate]);

  const expectedAge = birthDateObj ? ageFromBirth(birthDateObj) : null;
  const ageMismatch =
    expectedAge !== null && age !== "" && Number(age) !== expectedAge;

  const setBirthFromDate = (d: Date | undefined) => {
    if (!d) {
      setBirthDate("");
      setBirthInput("");
      return;
    }
    setBirthDate(format(d, "yyyy-MM-dd"));
    setBirthInput(format(d, "dd/MM/yyyy"));
    setAge(String(ageFromBirth(d)));
  };

  const onBirthTextChange = (v: string) => {
    setBirthInput(v);
    // Try parse dd/MM/yyyy
    const parsed = parse(v, "dd/MM/yyyy", new Date());
    if (isValid(parsed) && parsed.getFullYear() > 1900 && parsed <= new Date()) {
      setBirthDate(format(parsed, "yyyy-MM-dd"));
      setAge(String(ageFromBirth(parsed)));
    } else if (v === "") {
      setBirthDate("");
    }
  };

  // Auto-generate next available code when adding a new student
  useEffect(() => {
    if (!isNew) return;
    let cancelled = false;
    (async () => {
      const { count } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });
      if (cancelled || count == null) return;
      let next = count + 1;
      // Skip codes that already exist (handles gaps / pre-existing duplicates)
      while (!cancelled) {
        const { data } = await supabase
          .from("students")
          .select("id")
          .eq("code", String(next))
          .maybeSingle();
        if (!data) break;
        next++;
      }
      if (!cancelled) setCode((prev) => prev || String(next));
    })();
    return () => { cancelled = true; };
  }, [isNew]);

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
    const codeTrim = code.trim();
    if (!codeTrim) return toast.error(t("code"));
    setSaving(true);
    // Duplicate code check
    const { data: existing } = await supabase
      .from("students")
      .select("id")
      .eq("code", codeTrim)
      .maybeSingle();
    if (existing && existing.id !== initial?.id) {
      setSaving(false);
      return toast.error(t("code_exists") || "Code already exists");
    }
    const payload = {
      code: codeTrim,
      name: name.trim(),
      age: age ? Number(age) : null,
      phones: phones.map((p) => p.trim()).filter(Boolean),
      address: address || null,
      school: school || null,
      father_job: fatherJob || null,
      notes: notes || null,
      photo_path: photoPath,
      birth_date: birthDate || null,
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
      <div className="flex items-center gap-4 flex-wrap">
        <StudentAvatar path={photoPath} name={name || "?"} size={80} enlargeable />
        <div className="flex gap-2 flex-wrap">
          <Label htmlFor="photo" className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-background hover:bg-accent text-sm">
            <Upload className="size-4" />
            {uploading ? t("loading") : photoPath ? t("change_photo") : t("photo")}
          </Label>
          <input
            id="photo"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handlePhoto(e.target.files?.[0] || null)}
          />
          {photoPath && (
            <Button type="button" variant="outline" size="sm" onClick={() => setConfirmDeletePhoto(true)}>
              <Trash2 className="size-4" /> {t("delete_photo")}
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={confirmDeletePhoto} onOpenChange={setConfirmDeletePhoto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete_photo")}</AlertDialogTitle>
            <AlertDialogDescription>{t("confirm_delete_photo")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { setPhotoPath(null); setConfirmDeletePhoto(false); toast.success(t("saved")); }}
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>{t("code")} *</Label>
          <Input required value={code} onChange={(e) => setCode(e.target.value)} readOnly={!canEditCode} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("name")} *</Label>
          <Input required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("birth_date")}</Label>
          <div className="flex gap-2">
            <Input
              dir="ltr"
              placeholder="dd/mm/yyyy"
              value={birthInput}
              onChange={(e) => onBirthTextChange(e.target.value)}
              className="flex-1"
            />
            <Popover open={calOpen} onOpenChange={setCalOpen}>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" size="icon" aria-label={t("pick_date")}>
                  <CalendarIcon className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={birthDateObj ?? undefined}
                  onSelect={(d) => { setBirthFromDate(d); setCalOpen(false); }}
                  captionLayout="dropdown"
                  fromYear={1990}
                  toYear={new Date().getFullYear()}
                  disabled={(d) => d > new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>{t("age")}</Label>
          <Input type="number" min={1} max={100} value={age} onChange={(e) => setAge(e.target.value)} />
          {ageMismatch && (
            <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 mt-1">
              <AlertTriangle className="size-3.5 shrink-0" />
              <span className="flex-1">{t("age_mismatch")}</span>
              <button
                type="button"
                onClick={() => expectedAge !== null && setAge(String(expectedAge))}
                className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
              >
                <Wand2 className="size-3" />
                {t("auto_fix_age")}
              </button>
            </div>
          )}
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
