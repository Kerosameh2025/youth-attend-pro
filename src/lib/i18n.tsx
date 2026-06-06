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
  search_in: { ar: "بحث في", en: "Search in" },
  comprehensive_search: { ar: "بحث شامل", en: "All fields" },
  sort_by: { ar: "ترتيب حسب", en: "Sort by" },
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
  import: { ar: "استيراد", en: "Import" },
  export: { ar: "تصدير", en: "Export" },
  export_excel: { ar: "تصدير Excel", en: "Export Excel" },
  export_pdf: { ar: "تصدير PDF", en: "Export PDF" },
  import_students: { ar: "استيراد الطلاب", en: "Import Students" },
  upload_file: { ar: "اختر ملف Excel أو CSV", en: "Choose Excel or CSV file" },
  column_mapping: { ar: "مطابقة الأعمدة", en: "Column Mapping" },
  column_mapping_desc: { ar: "تم اكتشاف الأعمدة تلقائياً، يمكنك التعديل إذا لزم", en: "Columns auto-detected, adjust if needed" },
  preview: { ar: "معاينة", en: "Preview" },
  import_now: { ar: "بدء الاستيراد", en: "Start Import" },
  rows_detected: { ar: "صف تم اكتشافه", en: "rows detected" },
  imported_success: { ar: "تم الاستيراد بنجاح", en: "Imported successfully" },
  not_mapped: { ar: "غير مرتبط", en: "Not mapped" },
  overview: { ar: "نظرة عامة", en: "Overview" },
  attendance_trend: { ar: "اتجاه الحضور", en: "Attendance Trend" },
  attendance_rate: { ar: "نسبة الحضور", en: "Attendance Rate" },
  recent_sessions: { ar: "الجلسات الأخيرة", en: "Recent Sessions" },
  top_absent: { ar: "الأكثر غياباً", en: "Most Absent" },
  total_sessions: { ar: "إجمالي الجلسات", en: "Total Sessions" },
  avg_attendance: { ar: "متوسط الحضور", en: "Avg Attendance" },
  no_data: { ar: "لا توجد بيانات", en: "No data" },
  absent_times: { ar: "مرات الغياب", en: "Absences" },
  username: { ar: "اسم المستخدم", en: "Username" },
  servant_login: { ar: "تسجيل دخول الخادم", en: "Servant Login" },
  admin_login: { ar: "تسجيل دخول كمسؤول عام", en: "Sign in as Super Admin" },
  back_to_servant: { ar: "العودة لتسجيل دخول الخادم", en: "Back to servant login" },
  add_servant: { ar: "إضافة خادم", en: "Add Servant" },
  create: { ar: "إنشاء", en: "Create" },
  servant_created: { ar: "تم إنشاء حساب الخادم بنجاح", en: "Servant account created" },
  username_taken: { ar: "اسم المستخدم مستخدم بالفعل", en: "Username already taken" },
  username_invalid: { ar: "اسم المستخدم يجب أن يكون أحرف إنجليزية وأرقام فقط", en: "Username must be letters/numbers only" },
  username_not_found: { ar: "اسم المستخدم غير موجود", en: "Username not found" },
  no_permission_login: { ar: "هذا الحساب ليس حساب مسؤول عام", en: "This account is not a super admin" },
  // Phase 3 — activity & inactivity
  last_login: { ar: "آخر تسجيل دخول", en: "Last login" },
  never_logged_in: { ar: "لم يسجل دخول بعد", en: "Never signed in" },
  total_logins: { ar: "إجمالي الدخول", en: "Total logins" },
  login_history: { ar: "سجل تسجيل الدخول", en: "Login History" },
  no_login_history: { ar: "لا يوجد سجل دخول", en: "No login history" },
  device_mobile: { ar: "جوال", en: "Mobile" },
  device_desktop: { ar: "حاسوب", en: "Desktop" },
  inactivity_signed_out: {
    ar: "تم تسجيل خروجك تلقائياً بسبب عدم النشاط",
    en: "You were signed out automatically due to inactivity",
  },
  close: { ar: "إغلاق", en: "Close" },
  // Phase 4 — servant CRUD
  edit_servant: { ar: "تعديل الخادم", en: "Edit Servant" },
  delete_servant: { ar: "حذف الخادم", en: "Delete Servant" },
  confirm_delete_servant: { ar: "هل أنت متأكد من حذف هذا الخادم؟", en: "Are you sure you want to delete this servant?" },
  servant_updated: { ar: "تم تحديث بيانات الخادم", en: "Servant updated" },
  servant_deleted: { ar: "تم حذف الخادم", en: "Servant deleted" },
  password_reset_done: { ar: "تم تغيير كلمة المرور", en: "Password updated" },
  new_password: { ar: "كلمة المرور الجديدة", en: "New password" },
  leave_blank_keep: { ar: "اتركه فارغاً للإبقاء على الحالي", en: "Leave blank to keep current" },
  cannot_delete_self: { ar: "لا يمكنك حذف حسابك", en: "You cannot delete your own account" },
  // Phase 5 — UI polish
  change_photo: { ar: "تغيير الصورة", en: "Change Photo" },
  delete_photo: { ar: "حذف الصورة", en: "Delete Photo" },
  confirm_delete_photo: { ar: "هل تريد حذف صورة الطالب؟", en: "Remove the student photo?" },
  delete_session: { ar: "حذف الجلسة", en: "Delete Session" },
  confirm_delete_session: {
    ar: "تحذير: هل أنت متأكد من حذف هذه الجلسة؟ سيتم حذف جميع بيانات الحضور المرتبطة بها نهائياً",
    en: "Warning: are you sure you want to delete this session? All related attendance records will be permanently deleted.",
  },
  yes_delete: { ar: "نعم، احذف", en: "Yes, delete" },
  undo: { ar: "تراجع", en: "Undo" },
  restored: { ar: "تم الاسترجاع", en: "Restored" },
  // Phase 6 — Birth date & birthdays
  birth_date: { ar: "تاريخ الميلاد", en: "Date of Birth" },
  pick_date: { ar: "اختر التاريخ", en: "Pick a date" },
  age_mismatch: { ar: "العمر غير متوافق مع تاريخ الميلاد", en: "Age doesn't match birth date" },
  auto_fix_age: { ar: "تصحيح العمر تلقائياً", en: "Auto-fix age" },
  birthdays: { ar: "أعياد الميلاد", en: "Birthdays" },
  no_birthdays_month: { ar: "لا توجد أعياد ميلاد في هذا الشهر", en: "No birthdays this month" },
  week_n: { ar: "الأسبوع", en: "Week" },
  turns_age: { ar: "يُتم", en: "turns" },
  years_old: { ar: "سنة", en: "years" },
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
