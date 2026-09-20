import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/lib/products";
import { getProduct as findProduct, resolveCartKey as resolveKey } from "@/lib/products";
import {
  AUTH_KEY,
  createDefaultSiteData,
  loadSiteData,
  saveSiteData,
  type Order,
  type OrderStatus,
  type SiteContent,
  type SiteData,
} from "@/lib/site-data";

type SiteStoreValue = {
  ready: boolean;
  products: Product[];
  orders: Order[];
  content: SiteContent;
  isAdmin: boolean;
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
  setProducts: (products: Product[]) => void;
  upsertProduct: (product: Product) => void;
  deleteProduct: (id: number) => void;
  setContent: (content: SiteContent) => void;
  patchContent: (patch: Partial<SiteContent>) => void;
  addOrder: (order: Omit<Order, "id" | "createdAt" | "status"> & { status?: OrderStatus }) => Order;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  deleteOrder: (id: string) => void;
  resetAll: () => void;
  importData: (data: SiteData) => void;
  exportData: () => SiteData;
  getProduct: (id: number) => Product | undefined;
  resolveCartKey: (key: number) => ReturnType<typeof resolveKey>;
};

const SiteStoreContext = createContext<SiteStoreValue | undefined>(undefined);

export function SiteStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SiteData>(() => createDefaultSiteData());
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setData(loadSiteData());
    setIsAdmin(sessionStorage.getItem(AUTH_KEY) === "1");
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveSiteData(data);
  }, [data, ready]);

  const update = useCallback((updater: (current: SiteData) => SiteData) => {
    setData((current) => updater(current));
  }, []);

  const value = useMemo<SiteStoreValue>(
    () => ({
      ready,
      products: data.products,
      orders: data.orders,
      content: data.content,
      isAdmin,
      loginAdmin: (password: string) => {
        if (!password.trim()) return false;
        sessionStorage.setItem(AUTH_KEY, "1");
        setIsAdmin(true);
        return true;
      },
      logoutAdmin: () => {
        sessionStorage.removeItem(AUTH_KEY);
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
      addOrder: (orderInput) => {
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
        update((current) => ({ ...current, orders: [order, ...current.orders] }));
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
      resetAll: () => setData(createDefaultSiteData()),
      importData: (incoming) => setData(incoming),
      exportData: () => data,
      getProduct: (id) => findProduct(id, data.products),
      resolveCartKey: (key) => resolveKey(key, data.products),
    }),
    [data, isAdmin, ready, update],
  );

  return <SiteStoreContext.Provider value={value}>{children}</SiteStoreContext.Provider>;
}

export function useSiteStore() {
  const context = useContext(SiteStoreContext);
  if (!context) throw new Error("useSiteStore must be used within SiteStoreProvider");
  return context;
}
