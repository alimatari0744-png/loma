import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/lib/products";
import { getProduct as findProduct, resolveCartKey as resolveKey } from "@/lib/products";
import { loadRemoteSiteData, persistSiteData, type PersistResult } from "@/lib/cms";
import {
  createDefaultSiteData,
  loadSiteData,
  saveSiteData,
  type Order,
  type OrderStatus,
  type SiteContent,
  type SiteData,
} from "@/lib/site-data";
import { getSupabase, isAdminEmail, translateAuthError } from "@/lib/supabase";

type AuthResult = { ok: true } | { ok: false; error: string };

type SiteStoreValue = {
  ready: boolean;
  saving: boolean;
  lastSavedAt: string | null;
  persistError: string | null;
  persistRemote: boolean;
  products: Product[];
  orders: Order[];
  content: SiteContent;
  isAdmin: boolean;
  loginAdmin: (email: string, password: string) => Promise<AuthResult>;
  logoutAdmin: () => void;
  setProducts: (products: Product[]) => Promise<PersistResult>;
  upsertProduct: (product: Product) => Promise<PersistResult>;
  deleteProduct: (id: number) => Promise<PersistResult>;
  setContent: (content: SiteContent) => Promise<PersistResult>;
  patchContent: (patch: Partial<SiteContent>) => Promise<PersistResult>;
  addOrder: (order: Omit<Order, "id" | "createdAt" | "status"> & { status?: OrderStatus }) => Promise<Order>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<PersistResult>;
  deleteOrder: (id: string) => Promise<PersistResult>;
  resetAll: () => Promise<PersistResult>;
  importData: (data: SiteData) => Promise<PersistResult>;
  exportData: () => SiteData;
  getProduct: (id: number) => Product | undefined;
  resolveCartKey: (key: number) => ReturnType<typeof resolveKey>;
};

const SiteStoreContext = createContext<SiteStoreValue | undefined>(undefined);

export function SiteStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SiteData>(() => createDefaultSiteData());
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [persistError, setPersistError] = useState<string | null>(null);
  const [persistRemote, setPersistRemote] = useState(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      const local = loadSiteData();
      const remote = await loadRemoteSiteData();
      if (cancelled) return;
      const next = remote ?? local;
      setData(next);
      if (remote) {
        try {
          saveSiteData(remote);
        } catch {
          /* ignore quota */
        }
        setPersistRemote(true);
      }
      const supabase = getSupabase();
      const { data: sessionData } = await supabase.auth.getSession();
      if (!cancelled) setIsAdmin(isAdminEmail(sessionData.session?.user?.email));
      setReady(true);
    };
    void boot();

    const {
      data: { subscription },
    } = getSupabase().auth.onAuthStateChange((_event, session) => {
      setIsAdmin(isAdminEmail(session?.user?.email));
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const commit = useCallback(async (next: SiteData): Promise<PersistResult> => {
    setData(next);
    dataRef.current = next;
    setSaving(true);
    const result = await persistSiteData(next);
    setSaving(false);
    setPersistRemote(result.remote);
    setPersistError(result.error ?? null);
    if (result.data) {
      setData(result.data);
      dataRef.current = result.data;
    }
    if (result.ok) setLastSavedAt(new Date().toISOString());
    return result;
  }, []);

  const update = useCallback(
    async (updater: (current: SiteData) => SiteData) => commit(updater(dataRef.current)),
    [commit],
  );

  const value = useMemo<SiteStoreValue>(
    () => ({
      ready,
      saving,
      lastSavedAt,
      persistError,
      persistRemote,
      products: data.products,
      orders: data.orders,
      content: data.content,
      isAdmin,
      loginAdmin: async (email, password) => {
        if (!email.trim() || !password) {
          return { ok: false, error: "أدخلي البريد وكلمة المرور" };
        }
        if (!isAdminEmail(email)) {
          return { ok: false, error: "هذا الحساب غير مصرح له بدخول لوحة التحكم" };
        }
        const { data: authData, error } = await getSupabase().auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error || !authData.user) {
          return { ok: false, error: translateAuthError(error?.message) };
        }
        if (!isAdminEmail(authData.user.email)) {
          await getSupabase().auth.signOut();
          return { ok: false, error: "هذا الحساب غير مصرح له بدخول لوحة التحكم" };
        }
        setIsAdmin(true);
        return { ok: true };
      },
      logoutAdmin: () => {
        void getSupabase().auth.signOut();
        setIsAdmin(false);
      },
      setProducts: (products) => update((current) => ({ ...current, products })),
      upsertProduct: (product) =>
        update((current) => {
          const index = current.products.findIndex((item) => item.id === product.id);
          const products = [...current.products];
          if (index >= 0) products[index] = product;
          else products.push(product);
          return { ...current, products };
        }),
      deleteProduct: (id) =>
        update((current) => ({
          ...current,
          products: current.products.filter((item) => item.id !== id),
        })),
      setContent: (content) => update((current) => ({ ...current, content })),
      patchContent: (patch) =>
        update((current) => ({
          ...current,
          content: {
            ...current.content,
            ...patch,
            images: { ...current.content.images, ...(patch.images ?? {}) },
          },
        })),
      addOrder: async (orderInput) => {
        const order: Order = {
          id: `ORD-${Date.now()}`,
          createdAt: new Date().toISOString(),
          status: orderInput.status ?? "جديد",
          customerName: orderInput.customerName,
          customerPhone: orderInput.customerPhone,
          customerNote: orderInput.customerNote,
          total: orderInput.total,
          items: orderInput.items,
        };
        await update((current) => ({ ...current, orders: [order, ...current.orders] }));
        return order;
      },
      updateOrderStatus: (id, status) =>
        update((current) => ({
          ...current,
          orders: current.orders.map((order) => (order.id === id ? { ...order, status } : order)),
        })),
      deleteOrder: (id) =>
        update((current) => ({
          ...current,
          orders: current.orders.filter((order) => order.id !== id),
        })),
      resetAll: () => commit(createDefaultSiteData()),
      importData: (incoming) => commit(incoming),
      exportData: () => data,
      getProduct: (id) => findProduct(id, data.products),
      resolveCartKey: (key) => resolveKey(key, data.products),
    }),
    [commit, data, isAdmin, lastSavedAt, persistError, persistRemote, ready, saving, update],
  );

  return <SiteStoreContext.Provider value={value}>{children}</SiteStoreContext.Provider>;
}

export function useSiteStore() {
  const context = useContext(SiteStoreContext);
  if (!context) throw new Error("useSiteStore must be used within SiteStoreProvider");
  return context;
}
