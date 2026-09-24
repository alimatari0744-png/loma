import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export function getAdminEmail() {
  return ((import.meta.env.VITE_ADMIN_EMAIL as string | undefined) || "74abonaif@gmail.com")
    .trim()
    .toLowerCase();
}

export function isAdminEmail(email?: string | null) {
  return Boolean(email && email.trim().toLowerCase() === getAdminEmail());
}

export function getSiteUrl() {
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }
  return (import.meta.env.VITE_SITE_URL as string | undefined) || "https://loma-kappa.vercel.app";
}

let browserClient: SupabaseClient | null = null;

export function getSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("مفاتيح Supabase غير مضبوطة");
  }
  if (browserClient) return browserClient;
  browserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });
  return browserClient;
}

export function translateAuthError(message?: string | null) {
  const text = (message ?? "").toLowerCase();
  if (!text) return "حدث خطأ غير متوقع. حاولي مرة أخرى.";
  if (text.includes("invalid login credentials")) return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  if (text.includes("email not confirmed")) return "يجب تأكيد البريد الإلكتروني أولًا من الرسالة المرسلة لك.";
  if (text.includes("user already registered") || text.includes("already been registered")) {
    return "هذا البريد مسجّل مسبقًا. ادخلي أو استعيدي كلمة المرور.";
  }
  if (text.includes("password should be") || text.includes("password is known")) {
    return "كلمة المرور ضعيفة. استخدمي 6 أحرف على الأقل.";
  }
  if (text.includes("unable to validate email") || text.includes("invalid email")) {
    return "صيغة البريد الإلكتروني غير صحيحة.";
  }
  if (text.includes("rate limit") || text.includes("for security purposes") || text.includes("over_request")) {
    return "طلبات كثيرة. انتظري قليلًا ثم أعيدي المحاولة.";
  }
  if (text.includes("same password") || text.includes("should be different")) {
    return "اختاري كلمة مرور مختلفة عن الحالية.";
  }
  if (text.includes("expired") || text.includes("invalid or has expired")) {
    return "انتهت صلاحية الرابط. اطلبي رابطًا جديدًا.";
  }
  return message ?? "حدث خطأ غير متوقع. حاولي مرة أخرى.";
}
