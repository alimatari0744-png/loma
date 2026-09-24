import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabase, translateAuthError } from "@/lib/supabase";

export const Route = createFileRoute("/auth/reset")({
  head: () => ({
    meta: [
      { title: "تعيين كلمة المرور | لوما" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AuthResetPage,
});

function AuthResetPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");

    const finish = async () => {
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(translateAuthError(exchangeError.message));
          setReady(true);
          return;
        }
      }
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setError("رابط الاستعادة غير صالح أو منتهٍ. اطلبي رابطًا جديدًا من صفحة الدخول.");
      }
      setReady(true);
    };

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    void finish();
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    if (password !== confirm) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }
    setSaving(true);
    const { error: updateError } = await getSupabase().auth.updateUser({ password });
    setSaving(false);
    if (updateError) {
      setError(translateAuthError(updateError.message));
      return;
    }
    navigate({ to: "/account" });
  };

  return (
    <SiteShell>
      <section className="px-5 py-16 md:px-10">
        <div className="mx-auto w-full max-w-md">
          <p className="text-xs font-semibold text-gold">حساب لوما</p>
          <h1 className="mt-3 text-4xl font-semibold">تعيين كلمة مرور جديدة</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            اختاري كلمة مرور جديدة لحسابك ثم عودي لتسجيل الدخول.
          </p>

          {!ready ? (
            <p className="mt-8 text-sm text-muted-foreground">جارٍ التحقق من الرابط…</p>
          ) : (
            <form className="mt-8 space-y-4" onSubmit={submit}>
              <Input
                className="h-12 rounded-none"
                type="password"
                placeholder="كلمة المرور الجديدة"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                required
              />
              <Input
                className="h-12 rounded-none"
                type="password"
                placeholder="تأكيد كلمة المرور"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                autoComplete="new-password"
                required
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" variant="luxury" size="luxury" className="w-full rounded-none" disabled={saving}>
                {saving ? "جارٍ الحفظ…" : "حفظ كلمة المرور"}
              </Button>
              <Link to="/account" className="block text-center text-sm text-muted-foreground">
                العودة لتسجيل الدخول
              </Link>
            </form>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
