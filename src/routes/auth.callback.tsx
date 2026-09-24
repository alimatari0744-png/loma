import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/site-shell";
import { getSupabase, translateAuthError } from "@/lib/supabase";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "تأكيد الحساب | لوما" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      const supabase = getSupabase();
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const urlError = url.searchParams.get("error_description") || url.searchParams.get("error");

      if (urlError) {
        setError(translateAuthError(urlError));
        return;
      }

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(translateAuthError(exchangeError.message));
          return;
        }
      } else {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          setError("تعذر تأكيد الجلسة. جرّبي الرابط من البريد مرة أخرى.");
          return;
        }
      }

      navigate({ to: "/account" });
    };

    void run();
  }, [navigate]);

  return (
    <SiteShell>
      <section className="px-5 py-16 md:px-10">
        <div className="mx-auto max-w-md text-center">
          <p className="text-xs font-semibold text-gold">حساب لوما</p>
          <h1 className="mt-3 text-3xl font-semibold">{error ? "تعذر التأكيد" : "جارٍ تأكيد حسابك…"}</h1>
          {error ? (
            <p className="mt-4 text-sm leading-7 text-destructive">{error}</p>
          ) : (
            <p className="mt-4 text-sm leading-7 text-muted-foreground">سيتم نقلك إلى حسابك خلال لحظات.</p>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
