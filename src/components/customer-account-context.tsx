import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createCustomer,
  findCustomerByPhone,
  loadCustomerSession,
  loadCustomers,
  saveCustomerSession,
  saveCustomers,
  type CustomerProfile,
} from "@/lib/customer-account";

type ProfilePatch = Partial<
  Pick<CustomerProfile, "name" | "phone" | "email" | "city" | "district" | "address" | "password">
>;

type CustomerAccountValue = {
  ready: boolean;
  customer: CustomerProfile | null;
  register: (input: {
    name: string;
    phone: string;
    password: string;
    email?: string;
    city?: string;
    district?: string;
    address?: string;
  }) => { ok: true } | { ok: false; error: string };
  login: (phone: string, password: string) => { ok: true } | { ok: false; error: string };
  logout: () => void;
  updateProfile: (patch: ProfilePatch) => { ok: true } | { ok: false; error: string };
};

const CustomerAccountContext = createContext<CustomerAccountValue | undefined>(undefined);

export function CustomerAccountProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const list = loadCustomers();
    setCustomers(list);
    const session = loadCustomerSession();
    if (session && list.some((item) => item.id === session.customerId)) {
      setCustomerId(session.customerId);
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: CustomerProfile[]) => {
    setCustomers(next);
    saveCustomers(next);
  }, []);

  const setSession = useCallback((id: string | null) => {
    setCustomerId(id);
    saveCustomerSession(id ? { customerId: id } : null);
  }, []);

  const customer = useMemo(
    () => customers.find((item) => item.id === customerId) ?? null,
    [customers, customerId],
  );

  const value = useMemo<CustomerAccountValue>(
    () => ({
      ready,
      customer,
      register: (input) => {
        const name = input.name.trim();
        const phone = input.phone.trim();
        const password = input.password.trim();
        if (!name || !phone || !password) {
          return { ok: false, error: "أكملي الاسم والجوال وكلمة المرور" };
        }
        if (password.length < 4) {
          return { ok: false, error: "كلمة المرور يجب أن تكون 4 أحرف على الأقل" };
        }
        if (findCustomerByPhone(customers, phone)) {
          return { ok: false, error: "هذا الجوال مسجّل مسبقًا" };
        }
        const profile = createCustomer(input);
        persist([...customers, profile]);
        setSession(profile.id);
        return { ok: true };
      },
      login: (phone, password) => {
        const found = findCustomerByPhone(customers, phone);
        if (!found || found.password !== password.trim()) {
          return { ok: false, error: "الجوال أو كلمة المرور غير صحيحة" };
        }
        setSession(found.id);
        return { ok: true };
      },
      logout: () => setSession(null),
      updateProfile: (patch) => {
        if (!customer) return { ok: false, error: "يجب تسجيل الدخول أولًا" };
        const nextPhone = patch.phone?.trim() ?? customer.phone;
        if (patch.phone) {
          const clash = findCustomerByPhone(customers, nextPhone);
          if (clash && clash.id !== customer.id) {
            return { ok: false, error: "هذا الجوال مستخدم لحساب آخر" };
          }
        }
        if (patch.password !== undefined && patch.password.trim() && patch.password.trim().length < 4) {
          return { ok: false, error: "كلمة المرور يجب أن تكون 4 أحرف على الأقل" };
        }
        const updated: CustomerProfile = {
          ...customer,
          name: patch.name?.trim() ?? customer.name,
          phone: nextPhone.replace(/\s+/g, ""),
          email: patch.email?.trim() ?? customer.email,
          city: patch.city?.trim() ?? customer.city,
          district: patch.district?.trim() ?? customer.district,
          address: patch.address?.trim() ?? customer.address,
          password: patch.password?.trim() ? patch.password.trim() : customer.password,
        };
        persist(customers.map((item) => (item.id === customer.id ? updated : item)));
        return { ok: true };
      },
    }),
    [customer, customers, persist, ready, setSession],
  );

  return (
    <CustomerAccountContext.Provider value={value}>{children}</CustomerAccountContext.Provider>
  );
}

export function useCustomerAccount() {
  const context = useContext(CustomerAccountContext);
  if (!context) throw new Error("useCustomerAccount must be used within CustomerAccountProvider");
  return context;
}
