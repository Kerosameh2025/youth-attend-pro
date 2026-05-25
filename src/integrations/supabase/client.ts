import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://tnixjvoohwfsahcmhgcs.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuaXhqdm9vaHdmc2FoY21oZ2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NzY0NzgsImV4cCI6MjA5NTA1MjQ3OH0.y1w8Zv5Qlf0gvougoc7gZpFubK4q3iBFzk6yyW9wglQ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

/**
 * A second, isolated Supabase client used ONLY when the super admin needs to
 * create a new servant account. Using a separate client prevents the
 * resulting signUp() session from overriding the admin's current session in
 * the main `supabase` client above.
 */
export const supabaseSecondary = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

/** Domain used to synthesize an email from a servant's username for Supabase Auth. */
export const SERVANT_EMAIL_DOMAIN = "servants.church.local";
export const usernameToEmail = (username: string) =>
  `${username.trim().toLowerCase()}@${SERVANT_EMAIL_DOMAIN}`;

export type Profile = {
  id: string;
  full_name: string | null;
  username: string | null;
  role: "super_admin" | "servant";
  perm_add_student: boolean;
  perm_edit_student: boolean;
  perm_view_phones: boolean;
  perm_take_attendance: boolean;
};

export type Student = {
  id: string;
  code: string;
  name: string;
  age: number | null;
  phones: string[];
  address: string | null;
  school: string | null;
  father_job: string | null;
  notes: string | null;
  photo_path: string | null;
  created_at: string;
};

export type FridaySession = {
  id: string;
  session_date: string;
};

export type Attendance = {
  id: string;
  session_id: string;
  student_id: string;
  present: boolean;
};
