import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Lang = "ar" | "en";
type Dict = Record<string, { ar: string; en: string }>;

const dict: Dict = {
  app_title: { ar: "حضور خدمة الكنيسة", en: "Church Service Attendance" },
  app_subtitle: { ar: "الصف الثاني الإعدادي", en: "Grade 8" },
  login: { ar: "تسجيل الدخول", en: "Login" },
  signup: { ar: "إنشاء حساب", en: "Sign Up" },
  logout: { ar: "تسجيل الخروج", en: "Logout" },
  email: { ar: "البريد الإلكتروني", en: "Email" },
  password: { ar: "كلمة المرور", en: "Password" },
  full_name: { ar: "الاسم بالكامل", en: "Full Name" },
  no_account: { ar: "ليس لديك حساب؟", en: "Don't have an account?" },
  have_account: { ar: "لديك حساب بالفعل؟", en: "Already have an account?" },
  students: { ar: "الطلاب", en: "Students" },
  attendance: { ar: "الحضور", en: "Attendance" },
  servants: { ar: "الخدام", en: "Servants" },
  add_student: { ar: "إضافة طالب", en: "Add Student" },
  edit: { ar: "تعديل", en: "Edit" },
  delete: { ar: "حذف", en: "Delete" },
  save: { ar: "حفظ", en: "Save" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  back: { ar: "رجوع", en: "Back" },
  code: { ar: "الكود", en: "Code" },
  name: { ar: "الاسم", en: "Name" },
  age: { ar: "العمر", en: "Age" },
  phones: { ar: "أرقام التليفون", en: "Phone Numbers" },
  add_phone: { ar: "إضافة رقم", en: "Add Number" },
  address: { ar: "العنوان", en: "Address" },
  school: { ar: "المدرسة", en: "School" },
  father_job: { ar: "وظيفة الأب", en: "Father's Job" },
  notes: { ar: "ملاحظات", en: "Notes" },
  photo: { ar: "الصورة الشخصية", en: "Profile Photo" },
  upload: { ar: "رفع", en: "Upload" },
  generate_sessions: { ar: "توليد جلسات الجمعة", en: "Generate Friday Sessions" },
  from_date: { ar: "من تاريخ", en: "From date" },
  to_date: { ar: "إلى تاريخ", en: "To date" },
  generate: { ar: "توليد", en: "Generate" },
  sessions: { ar: "الجلسات", en: "Sessions" },
  no_sessions: { ar: "لا توجد جلسات بعد", en: "No sessions yet" },
  no_students: { ar: "لا يوجد طلاب", en: "No students" },
  no_servants: { ar: "لا يوجد خدام", en: "No servants" },
  take_attendance: { ar: "تسجيل الحضور", en: "Take Attendance" },
  present: { ar: "حاضر", en: "Present" },
  absent: { ar: "غائب", en: "Absent" },
  permissions: { ar: "الصلاحيات", en: "Permissions" },
  perm_add_student: { ar: "إضافة طالب", en: "Add student" },
  perm_edit_student: { ar: "تعديل طالب", en: "Edit student" },
  perm_view_phones: { ar: "عرض أرقام التليفون", en: "View phones" },
  perm_take_attendance: { ar: "تسجيل الحضور", en: "Take attendance" },
  role: { ar: "الدور", en: "Role" },
  super_admin: { ar: "مسؤول عام", en: "Super Admin" },
  servant: { ar: "خادم", en: "Servant" },
  saved: { ar: "تم الحفظ", en: "Saved" },
  error: { ar: "حدث خطأ", en: "Error" },
  search: { ar: "بحث...", en: "Search..." },
  language: { ar: "اللغة", en: "Language" },
  theme: { ar: "الوضع", en: "Theme" },
  welcome: { ar: "أهلاً وسهلاً", en: "Welcome" },
  loading: { ar: "جاري التحميل...", en: "Loading..." },
  confirm_delete: { ar: "هل أنت متأكد من الحذف؟", en: "Are you sure you want to delete?" },
  dashboard_home: { ar: "الرئيسية", en: "Home" },
  no_permission: { ar: "ليس لديك صلاحية للوصول", en: "You don't have permission to access this" },
  session_date: { ar: "تاريخ الجلسة", en: "Session Date" },
  total_students: { ar: "إجمالي الطلاب", en: "Total Students" },
  present_count: { ar: "عدد الحاضرين", en: "Present" },
  absent_count: { ar: "عدد الغائبين", en: "Absent" },
  hidden: { ar: "محجوب", en: "Hidden" },
  optional: { ar: "اختياري", en: "optional" },
  no_phone: { ar: "لا يوجد رقم", en: "No phone" },
};

type Ctx = {
  lang: Lang;
  dir: "rtl" | "ltr";
  t: (key: keyof typeof dict) => string;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = (localStorage.getItem("lang") as Lang) || "ar";
    setLangState(stored);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    if (typeof window !== "undefined") localStorage.setItem("lang", lang);
  }, [lang]);

  const value: Ctx = {
    lang,
    dir: lang === "ar" ? "rtl" : "ltr",
    t: (key) => dict[key]?.[lang] ?? String(key),
    setLang: setLangState,
    toggleLang: () => setLangState((l) => (l === "ar" ? "en" : "ar")),
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be inside I18nProvider");
  return ctx;
}
