import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { mapProfile, type CustomerProfile, type ProfileRow } from "@/lib/customer-account";
import { getSiteUrl, getSupabase, translateAuthError } from "@/lib/supabase";

type ProfilePatch = Partial<Pick<CustomerProfile, "name" | "phone" | "city" | "district" | "address">>;

type AuthResult = { ok: true; message?: string } | { ok: false; error: string };

type CustomerAccountValue = {
  ready: boolean;
  customer: CustomerProfile | null;
  emailConfirmed: boolean;
  register: (input: {
    name: string;
    email: string;
    phone: string;
    password: string;
    city?: string;
    district?: string;
    address?: string;
  }) => Promise<AuthResult>;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateProfile: (patch: ProfilePatch) => Promise<AuthResult>;
  changePassword: (password: string) => Promise<AuthResult>;
  requestPasswordReset: (email: string) => Promise<AuthResult>;
  resendConfirmation: (email: string) => Promise<AuthResult>;
};

const CustomerAccountContext = createContext<CustomerAccountValue | undefined>(undefined);

function profileFromUser(user: User): CustomerProfile {
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    name: String(meta.name ?? ""),
    phone: String(meta.phone ?? ""),
    email: user.email ?? "",
    city: String(meta.city ?? ""),
    district: String(meta.district ?? ""),
    address: String(meta.address ?? ""),
    createdAt: user.created_at ?? new Date().toISOString(),
  };
}

async function syncProfileRow(user: User, profile: CustomerProfile) {
  try {
    await getSupabase().from("profiles").upsert({
      id: user.id,
      name: profile.name,
      phone: profile.phone,
      email: profile.email,
      city: profile.city,
      district: profile.district,
      address: profile.address,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Table is optional until schema.sql is applied in the dashboard.
  }
}

export function CustomerAccountProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [ready, setReady] = useState(false);

  const loadProfile = useCallback(async (user: User) => {
    setEmailConfirmed(Boolean(user.email_confirmed_at));
    let profile = profileFromUser(user);

    const { data } = await getSupabase().from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (data) {
      profile = mapProfile(data as ProfileRow, user.email ?? "");
    } else {
      await syncProfileRow(user, profile);
    }

    setCustomer(profile);
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    let mounted = true;

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!mounted) return;
        if (data.session?.user) {
          try {
            await loadProfile(data.session.user);
          } catch {
            setCustomer(profileFromUser(data.session.user));
          }
        } else {
          setCustomer(null);
          setEmailConfirmed(false);
        }
      })
      .finally(() => {
        if (mounted) setReady(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session?.user) {
        setCustomer(null);
        setEmailConfirmed(false);
        return;
      }
      try {
        await loadProfile(session.user);
      } catch {
        setCustomer(profileFromUser(session.user));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const value = useMemo<CustomerAccountValue>(
    () => ({
      ready,
      customer,
      emailConfirmed,
      register: async (input) => {
        const name = input.name.trim();
        const email = input.email.trim().toLowerCase();
        const password = input.password;
        const phone = input.phone.trim();
        if (!name || !email || !password) {
          return { ok: false, error: "أكملي الاسم والبريد وكلمة المرور" };
        }
        if (password.length < 6) {
          return { ok: false, error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" };
        }
        const { data, error } = await getSupabase().auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${getSiteUrl()}/auth/callback`,
            data: {
              name,
              phone,
              city: input.city?.trim() ?? "",
              district: input.district?.trim() ?? "",
              address: input.address?.trim() ?? "",
            },
          },
        });
        if (error) return { ok: false, error: translateAuthError(error.message) };
        if (data.user && !data.session) {
          return { ok: true, message: "تم إنشاء الحساب. تفقدي بريدك واضغطي رابط التأكيد قبل تسجيل الدخول." };
        }
        return { ok: true, message: "تم إنشاء الحساب وتسجيل الدخول." };
      },
      login: async (email, password) => {
        const { error } = await getSupabase().auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) return { ok: false, error: translateAuthError(error.message) };
        return { ok: true };
      },
      logout: async () => {
        await getSupabase().auth.signOut();
        setCustomer(null);
        setEmailConfirmed(false);
      },
      updateProfile: async (patch) => {
        if (!customer) return { ok: false, error: "يجب تسجيل الدخول أولًا" };
        const next = {
          name: patch.name?.trim() ?? customer.name,
          phone: patch.phone?.trim() ?? customer.phone,
          city: patch.city?.trim() ?? customer.city,
          district: patch.district?.trim() ?? customer.district,
          address: patch.address?.trim() ?? customer.address,
        };
        const { data, error } = await getSupabase().auth.updateUser({ data: next });
        if (error || !data.user) return { ok: false, error: translateAuthError(error?.message) };
        const profile = profileFromUser(data.user);
        setCustomer(profile);
        await syncProfileRow(data.user, profile);
        return { ok: true };
      },
      changePassword: async (password) => {
        if (password.trim().length < 6) {
          return { ok: false, error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" };
        }
        const { error } = await getSupabase().auth.updateUser({ password: password.trim() });
        if (error) return { ok: false, error: translateAuthError(error.message) };
        return { ok: true };
      },
      requestPasswordReset: async (email) => {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed) return { ok: false, error: "أدخلي البريد الإلكتروني" };
        const { error } = await getSupabase().auth.resetPasswordForEmail(trimmed, {
          redirectTo: `${getSiteUrl()}/auth/reset`,
        });
        if (error) return { ok: false, error: translateAuthError(error.message) };
        return { ok: true, message: "أرسلنا رابط استعادة كلمة المرور إلى بريدك." };
      },
      resendConfirmation: async (email) => {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed) return { ok: false, error: "أدخلي البريد الإلكتروني" };
        const { error } = await getSupabase().auth.resend({
          type: "signup",
          email: trimmed,
          options: { emailRedirectTo: `${getSiteUrl()}/auth/callback` },
        });
        if (error) return { ok: false, error: translateAuthError(error.message) };
        return { ok: true, message: "أُعيد إرسال رسالة التأكيد إلى بريدك." };
      },
    }),
    [customer, emailConfirmed, ready],
  );

  return <CustomerAccountContext.Provider value={value}>{children}</CustomerAccountContext.Provider>;
}

export function useCustomerAccount() {
  const context = useContext(CustomerAccountContext);
  if (!context) throw new Error("useCustomerAccount must be used within CustomerAccountProvider");
  return context;
}
