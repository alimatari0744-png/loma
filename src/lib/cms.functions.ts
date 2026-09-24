import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

type CmsPayload =
  | { accessToken: string; kind: "json"; json: string }
  | { accessToken: string; kind: "file"; path: string; contentType: string; base64: string };

const CMS_BUCKET = "loma-cms";
const CMS_DATA_PATH = "site-data.json";

function getAdminEmail() {
  return (process.env.VITE_ADMIN_EMAIL || "74abonaif@gmail.com").trim().toLowerCase();
}

function getEnv() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const anon = process.env.VITE_SUPABASE_ANON_KEY || "";
  const secret = process.env.SUPABASE_SECRET_KEY || "";
  return { url, anon, secret };
}

export const saveRemoteCms = createServerFn({ method: "POST" })
  .validator((input: CmsPayload) => input)
  .handler(async ({ data }) => {
    const { url, anon, secret } = getEnv();
    if (!url || !anon) {
      return { ok: false as const, error: "إعدادات Supabase غير مكتملة على الخادم" };
    }
    if (!data.accessToken) {
      return { ok: false as const, error: "يجب تسجيل الدخول كمدير أولاً" };
    }

    const authClient = createClient(url, anon);
    const { data: userData, error: userError } = await authClient.auth.getUser(data.accessToken);
    if (userError || !userData.user?.email || userData.user.email.toLowerCase() !== getAdminEmail()) {
      return { ok: false as const, error: "هذا الحساب غير مصرح له بتعديل المتجر" };
    }

    const key = secret || anon;
    const storage = createClient(url, key, {
      global: { headers: secret ? {} : { Authorization: `Bearer ${data.accessToken}` } },
    });

    if (data.kind === "json") {
      const { error } = await storage.storage
        .from(CMS_BUCKET)
        .upload(CMS_DATA_PATH, new Blob([data.json], { type: "application/json" }), {
          upsert: true,
          contentType: "application/json",
        });
      if (error) return { ok: false as const, error: error.message };
      return { ok: true as const };
    }

    const bytes = Buffer.from(data.base64, "base64");
    const { error } = await storage.storage.from(CMS_BUCKET).upload(data.path, bytes, {
      upsert: true,
      contentType: data.contentType,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });
