import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowUpRight,
  Check,
  ExternalLink,
  FileText,
  Image as ImageLucide,
  LayoutGrid,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Pencil,
  Pin,
  PinOff,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSiteStore } from "@/components/site-store-context";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/products";
import { emptyProduct, fileToDataUrl, orderStatuses, type OrderStatus, type Review, type SiteContent } from "@/lib/site-data";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة تحكم لوما" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

type Tab = "overview" | "products" | "orders" | "reviews" | "content" | "images";

const tabs: { id: Tab; label: string; icon: typeof Package }[] = [
  { id: "overview", label: "نظرة عامة", icon: LayoutGrid },
  { id: "products", label: "المنتجات", icon: Package },
  { id: "orders", label: "الطلبات", icon: ShoppingBag },
  { id: "reviews", label: "التقييمات", icon: MessageSquare },
  { id: "content", label: "النصوص", icon: FileText },
  { id: "images", label: "الصور", icon: ImageLucide },
];

const statuses: OrderStatus[] = [...orderStatuses];
const categories: Product["category"][] = ["مزيل المكياج", "الوسادات", "الباقات"];

function AdminPage() {
  const store = useSiteStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [navOpen, setNavOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  if (!store.ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f6f1e8] text-sm text-muted-foreground" dir="rtl">
        جاري التحميل…
      </div>
    );
  }

  if (!store.isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#f3e6c8_0%,#f6f1e8_42%,#efe8dc_100%)] px-5" dir="rtl">
        <form
          className="w-full max-w-md rounded-[1.35rem] border border-[#e6dcc8] bg-white/90 px-8 py-11 shadow-[0_24px_80px_rgba(68,52,28,0.08)]"
          onSubmit={async (event) => {
            event.preventDefault();
            setError("");
            setBusy(true);
            const result = await store.loginAdmin(email, password);
            setBusy(false);
            if (!result.ok) setError(result.error);
          }}
        >
          <p className="text-[11px] font-medium tracking-[0.32em] text-gold">LOMA</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">لوحة التحكم</h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">الدخول مخصص لحساب الإدارة المعتمد فقط.</p>
          <Input
            className="mt-8 h-12 rounded-none border-border/80 bg-background"
            type="email"
            placeholder="البريد الإلكتروني"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            autoFocus
            required
          />
          <Input
            className="mt-3 h-12 rounded-none border-border/80 bg-background"
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
          <Button type="submit" variant="luxury" size="luxury" className="mt-5 h-12 w-full rounded-none" disabled={busy}>
            {busy ? "جارٍ الدخول…" : "دخول"}
          </Button>
          <Link
            to="/"
            className="mt-8 flex items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            العودة للموقع <ExternalLink className="size-3.5" strokeWidth={1.25} />
          </Link>
        </form>
      </div>
    );
  }

  const flashSave = async (result?: { ok: boolean; remote?: boolean; error?: string }) => {
    if (result && !result.ok) return;
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1800);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f3ea_0%,#f3eee6_40%,#efe8dc_100%)] text-foreground" dir="rtl">
      <header className="sticky top-0 z-30 border-b border-[#e7dcc8] bg-[#fcfaf6]/90 backdrop-blur-xl">
        <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full border border-[#e0d4c0] bg-white/70 text-foreground"
            aria-label="فتح التنقل"
            aria-expanded={navOpen}
            onClick={() => setNavOpen(true)}
          >
            <Menu className="size-5" strokeWidth={1.5} />
          </button>
          <div className="pointer-events-none absolute left-[calc(50%+18px)] top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <p className="text-[10px] font-medium tracking-[0.32em] text-gold">LOMA</p>
            <h1 className="mt-1 text-lg font-semibold leading-none tracking-tight">لوحة التحكم</h1>
          </div>
          <div className="flex items-center gap-2">
            {savedFlash && (
              <span className="hidden items-center gap-1.5 text-sm text-gold sm:inline-flex">
                <Check className="size-3.5" strokeWidth={1.5} /> تم الحفظ
              </span>
            )}
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="size-10 rounded-full border-0 bg-transparent shadow-none hover:bg-transparent"
              aria-label="عرض الموقع"
            >
              <Link to="/" aria-label="عرض الموقع">
                <ArrowUpRight className="size-4" strokeWidth={1.25} />
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="h-10 rounded-full px-3 text-muted-foreground hover:text-foreground"
              onClick={store.logoutAdmin}
            >
              <LogOut className="size-4" strokeWidth={1.25} />
              <span className="hidden sm:inline">خروج</span>
            </Button>
          </div>
        </div>
      </header>

      {navOpen && (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            className="absolute inset-0 bg-[#2c2820]/30"
            aria-label="إغلاق التنقل"
            onClick={() => setNavOpen(false)}
          />
          <aside className="absolute inset-y-0 right-0 flex w-72 flex-col rounded-l-[1.75rem] border-l border-[#e6dcc8] bg-[#fcfaf6] shadow-[0_20px_60px_rgba(44,40,32,0.16)]">
            <div className="flex items-center justify-between border-b border-[#e6dcc8] px-4 py-4">
              <p className="text-sm font-medium">التنقل</p>
              <button
                type="button"
                className="grid size-9 place-items-center rounded-full text-muted-foreground hover:text-foreground"
                aria-label="إغلاق"
                onClick={() => setNavOpen(false)}
              >
                <X className="size-4" strokeWidth={1.5} />
              </button>
            </div>
            <nav className="space-y-1 p-3">
              {tabs.map((item) => {
                const Icon = item.icon;
                const active = tab === item.id;
                const count =
                  item.id === "products"
                    ? store.products.length
                    : item.id === "orders"
                      ? store.orders.length
                      : item.id === "reviews"
                        ? store.reviews.length
                        : null;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setTab(item.id);
                      setNavOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-[13px] transition-colors ${
                      active
                        ? "bg-[#2c2820] text-[#f7f1e6]"
                        : "text-muted-foreground hover:bg-[#f6f0e6] hover:text-foreground"
                    }`}
                  >
                    <Icon strokeWidth={1.25} className={`size-5 ${active ? "text-gold" : ""}`} />
                    <span className="flex-1 text-right">{item.label}</span>
                    {count !== null && (
                      <span className={`text-[11px] ${active ? "text-[#f7f1e6]/70" : "text-muted-foreground"}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-5 py-8">
        <main className="min-w-0 space-y-5">
          {tab === "overview" && <OverviewPanel />}

          {tab === "products" && (
            <ProductsPanel
              products={store.products}
              editing={editing}
              onEdit={setEditing}
              onCreate={() => {
                const nextId = Math.max(0, ...store.products.map((p) => p.id)) + 1;
                setEditing(emptyProduct(nextId));
              }}
              onDelete={async (id) => {
                if (!confirm("حذف هذا المنتج من الموقع؟")) return;
                const result = await store.deleteProduct(id);
                if (editing?.id === id) setEditing(null);
                await flashSave(result);
              }}
              onSave={async (product) => {
                const result = await store.upsertProduct(product);
                if (result.ok) setEditing(null);
                await flashSave(result);
              }}
              onCancel={() => setEditing(null)}
            />
          )}

          {tab === "orders" && (
            <OrdersPanel
              orders={store.orders}
              onStatus={async (id, status) => {
                await flashSave(await store.updateOrderStatus(id, status));
              }}
              onShipping={async (id, shippingCompany) => {
                await flashSave(await store.updateOrderShipping(id, shippingCompany));
              }}
              onDelete={async (id) => {
                if (!confirm("حذف هذا الطلب؟")) return;
                await flashSave(await store.deleteOrder(id));
              }}
            />
          )}

          {tab === "reviews" && (
            <ReviewsPanel
              reviews={store.reviews}
              onPin={async (id, pinned) => {
                await flashSave(await store.setReviewPinned(id, pinned));
              }}
              onDelete={async (id) => {
                if (!confirm("حذف هذا التقييم؟")) return;
                await flashSave(await store.deleteReview(id));
              }}
            />
          )}

          {tab === "content" && (
            <ContentPanel
              content={store.content}
              onSave={async (content) => {
                await flashSave(await store.setContent(content));
              }}
            />
          )}

          {tab === "images" && (
            <ImagesPanel
              content={store.content}
              products={store.products}
              onSave={async (images, products) => {
                await flashSave(
                  await store.importData({
                    ...store.exportData(),
                    products,
                    content: { ...store.content, images },
                  }),
                );
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function pct(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

function OverviewPanel() {
  const { products, orders, reviews, content } = useSiteStore();
  const activeOrders = orders.filter((order) => order.status !== "ملغي");
  const newOrders = orders.filter((order) => order.status === "جديد" || order.status === "مسودة").length;
  const doneOrders = orders.filter(
    (order) => order.status === "مكتمل" || order.status === "تم الشحن" || order.status === "عند شركة الشحن",
  ).length;
  const revenue = activeOrders.reduce((sum, order) => sum + order.total, 0);
  const recent = orders.slice(0, 4);
  const completionItems = [
    Boolean(content.hero.title),
    Boolean(content.about.intro),
    Boolean(content.footer.email && !content.footer.email.includes("لاحقًا")),
    Boolean(content.footer.phone && !content.footer.phone.includes("لاحقًا")),
    products.length > 0,
    Boolean(content.images.logo),
    Boolean(content.images.hero),
  ];
  const storeReady = pct(completionItems.filter(Boolean).length, completionItems.length);
  const fulfillment = pct(doneOrders, orders.length);
  const newestShare = pct(newOrders, orders.length);
  const categoryBars = categories.map((category) => {
    const count = products.filter((product) => product.category === category).length;
    return { category, count, value: pct(count, products.length) };
  });
  const statusBars = statuses.map((status) => {
    const count = orders.filter((order) => order.status === status).length;
    return { status, count, value: pct(count, orders.length) };
  });

  return (
    <div className="space-y-5">
      <PanelHeader title="نظرة عامة" subtitle="قراءة جميلة لحالة المتجر: نسب، اكتمال، وحركة الطلبات." />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Package} label="المنتجات" value={String(products.length)} hint={`${categoryBars[0]?.value || 0}% مزيل مكياج`} />
        <StatCard icon={ShoppingBag} label="طلبات جديدة" value={String(newOrders)} hint={`${newestShare}% من كل الطلبات`} />
        <StatCard icon={Sparkles} label="المبيعات" value={formatPrice(revenue)} hint={`${fulfillment}% تم شحنها أو اكتملت`} />
        <StatCard
          icon={MessageSquare}
          label="التقييمات"
          value={String(reviews.length)}
          hint={`${reviews.filter((review) => review.pinned).length} مثبت في الرئيسية`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex items-center gap-6 rounded-[1.35rem] border border-[#e6dcc8] bg-white/85 px-6 py-7 shadow-[0_10px_40px_rgba(70,52,24,0.04)]">
          <div
            className="grid size-28 shrink-0 place-items-center rounded-full"
            style={{
              background: `conic-gradient(#c2a15a ${storeReady}%, #efe6d6 0)`,
            }}
          >
            <div className="grid size-[4.6rem] place-items-center rounded-full bg-white">
              <span className="text-xl font-semibold">{storeReady}%</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-gold">اكتمال المتجر</p>
            <h3 className="mt-2 text-xl font-semibold">جاهزية المحتوى</h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              النصوص، الصور، وبيانات التواصل مكتملة بنسبة {storeReady}%.
            </p>
          </div>
        </div>

        <div className="rounded-[1.35rem] border border-[#e6dcc8] bg-white/85 px-6 py-6 shadow-[0_10px_40px_rgba(70,52,24,0.04)]">
          <h3 className="text-sm font-semibold">توزيع المنتجات</h3>
          <div className="mt-5 space-y-4">
            {categoryBars.map((item) => (
              <ProgressRow key={item.category} label={item.category} value={item.value} suffix={`${item.count}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[1.35rem] border border-[#e6dcc8] bg-white/85 px-6 py-6 shadow-[0_10px_40px_rgba(70,52,24,0.04)]">
          <h3 className="text-sm font-semibold">حالات الطلبات</h3>
          <div className="mt-5 space-y-4">
            {statusBars.map((item) => (
              <ProgressRow key={item.status} label={item.status} value={item.value} suffix={`${item.count}`} />
            ))}
          </div>
        </div>
        <div className="rounded-[1.35rem] border border-[#e6dcc8] bg-white/85 px-6 py-6 shadow-[0_10px_40px_rgba(70,52,24,0.04)]">
          <h3 className="text-sm font-semibold">آخر الطلبات</h3>
          {recent.length === 0 ? (
            <p className="mt-5 text-sm leading-7 text-muted-foreground">
              لا توجد طلبات بعد. عند إتمام الشراء من السلة سيظهر الطلب هنا.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-[#efe6d6]">
              {recent.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium">{order.id}</p>
                    <p className="text-muted-foreground">
                      {order.customerName || "عميلة"} · {order.status}
                    </p>
                  </div>
                  <span className="text-gold">{formatPrice(order.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProgressRow({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[12px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground">
          {suffix} · {value}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#efe6d6]">
        <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Package;
}) {
  return (
    <div className="rounded-[1.35rem] border border-[#e6dcc8] bg-white/85 px-5 py-6 shadow-[0_10px_40px_rgba(70,52,24,0.04)]">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-full bg-[#f6f0e6]">
          <Icon strokeWidth={1.15} className="size-4 text-gold" />
        </span>
        <span className="text-[12px] text-muted-foreground">{label}</span>
      </div>
      <p className="text-[1.7rem] font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-[12px] text-gold">{hint}</p>
    </div>
  );
}

function ProductsPanel({
  products,
  editing,
  onEdit,
  onCreate,
  onDelete,
  onSave,
  onCancel,
}: {
  products: Product[];
  editing: Product | null;
  onEdit: (product: Product) => void;
  onCreate: () => void;
  onDelete: (id: number) => void | Promise<void>;
  onSave: (product: Product) => void | Promise<void>;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <PanelHeader title="المنتجات" subtitle={`${products.length} منتج في المجموعة.`} />
        <Button variant="luxury" className="h-10 shrink-0 rounded-full px-4" onClick={onCreate}>
          <Plus className="size-4" strokeWidth={1.25} /> منتج جديد
        </Button>
      </div>

      {editing && (
        <ProductEditor key={editing.id} product={editing} onSave={onSave} onCancel={onCancel} />
      )}

      <div className="space-y-3">
        {products.map((product) => (
          <div key={product.id} className="flex gap-4 rounded-[1.35rem] border border-[#e6dcc8] bg-white/85 p-3.5 shadow-[0_8px_30px_rgba(70,52,24,0.03)]">
            <img src={product.image} alt="" className="size-[4.5rem] rounded-2xl object-cover" />
            <div className="min-w-0 flex-1 self-center">
              <p className="font-medium tracking-tight">{product.name}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {product.size} · {formatPrice(product.price)} · {product.category}
              </p>
              {product.badge && <p className="mt-1.5 text-[11px] tracking-wide text-gold">{product.badge}</p>}
            </div>
            <div className="flex flex-col justify-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-9 rounded-full border-border/70 px-3"
                onClick={() => onEdit(product)}
              >
                <Pencil className="size-3.5" strokeWidth={1.25} /> تعديل
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-full text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(product.id)}
              >
                <Trash2 className="size-3.5" strokeWidth={1.25} /> حذف
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductEditor({
  product,
  onSave,
  onCancel,
}: {
  product: Product;
  onSave: (product: Product) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Product>(() => {
    const gallery = product.gallery?.length ? [...product.gallery] : [];
    if (product.image && !gallery.includes(product.image)) gallery.unshift(product.image);
    return { ...product, gallery, sections: product.sections ?? [] };
  });
  const { saving } = useSiteStore();

  const setField = <K extends keyof Product>(key: K, value: Product[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const onImages = async (files?: FileList | null) => {
    if (!files?.length) return;
    const urls = await Promise.all(Array.from(files).map((file) => fileToDataUrl(file)));
    setDraft((current) => {
      const gallery = [...current.gallery];
      for (const url of urls) {
        if (!gallery.includes(url)) gallery.push(url);
      }
      return { ...current, image: current.image || urls[0] || "", gallery };
    });
  };

  return (
    <form
      className="space-y-5 rounded-[1.35rem] border border-[#e6dcc8] bg-white/90 px-5 py-6 shadow-[0_10px_40px_rgba(70,52,24,0.04)]"
      onSubmit={async (event: FormEvent) => {
        event.preventDefault();
        const gallery = draft.gallery.filter(Boolean);
        await onSave({
          ...draft,
          contents: cleanLines(draft.contents),
          highlights: cleanLines(draft.highlights),
          sections: (draft.sections ?? [])
            .map((section) => ({
              ...section,
              title: section.title.trim(),
              items: section.items.map((item) => item.trim()).filter(Boolean),
            }))
            .filter((section) => section.title),
          image: draft.image || gallery[0] || "",
          gallery: gallery.length ? gallery : draft.image ? [draft.image] : [],
        });
      }}
    >
      <h3 className="text-base font-semibold tracking-tight">تعديل المنتج</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="الاسم">
          <Input className="h-11 rounded-none" value={draft.name} onChange={(e) => setField("name", e.target.value)} />
        </Field>
        <Field label="الحجم / التفاصيل">
          <Input className="h-11 rounded-none" value={draft.size} onChange={(e) => setField("size", e.target.value)} />
        </Field>
        <Field label="السعر">
          <Input
            className="h-11 rounded-none"
            type="number"
            value={draft.price}
            onChange={(e) => setField("price", Number(e.target.value))}
          />
        </Field>
        <Field label="التصنيف">
          <select
            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
            value={draft.category}
            onChange={(e) => setField("category", e.target.value as Product["category"])}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </Field>
        <Field label="شارة (اختياري)">
          <Input
            className="h-11 rounded-none"
            value={draft.badge ?? ""}
            onChange={(e) => setField("badge", e.target.value || undefined)}
          />
        </Field>
        <Field label="ملاحظة قصيرة">
          <Input className="h-11 rounded-none" value={draft.note} onChange={(e) => setField("note", e.target.value)} />
        </Field>
      </div>
      <Field label="الوصف">
        <Textarea
          className="min-h-28 rounded-none"
          value={draft.description}
          onChange={(e) => setField("description", e.target.value)}
        />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <LineListField
          label="المحتويات"
          value={draft.contents}
          onChange={(contents) => setDraft((current) => ({ ...current, contents }))}
        />
        <LineListField
          label="المميزات"
          value={draft.highlights}
          onChange={(highlights) => setDraft((current) => ({ ...current, highlights }))}
        />
        {(draft.sections ?? []).map((section) => (
          <div key={section.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                className="h-9 rounded-none"
                value={section.title}
                placeholder="اسم الخانة، مثل المكونات"
                aria-label="اسم الخانة"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    sections: (current.sections ?? []).map((item) =>
                      item.id === section.id ? { ...item, title: event.target.value } : item,
                    ),
                  }))
                }
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0 rounded-full text-muted-foreground hover:text-destructive"
                aria-label="حذف الخانة"
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    sections: (current.sections ?? []).filter((item) => item.id !== section.id),
                  }))
                }
              >
                <Trash2 className="size-3.5" strokeWidth={1.25} />
              </Button>
            </div>
            <Textarea
              className="min-h-24 rounded-none"
              placeholder="سطر لكل عنصر"
              value={section.items.join("\n")}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  sections: (current.sections ?? []).map((item) =>
                    item.id === section.id ? { ...item, items: event.target.value.split("\n") } : item,
                  ),
                }))
              }
            />
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        className="h-10 rounded-none px-4"
        onClick={() =>
          setDraft((current) => ({
            ...current,
            sections: [...(current.sections ?? []), { id: `section-${Date.now()}`, title: "", items: [""] }],
          }))
        }
      >
        <Plus className="size-4" strokeWidth={1.25} /> إضافة خانة
      </Button>
      <ProductGalleryEditor
        image={draft.image}
        gallery={draft.gallery}
        onChange={(next) => setDraft((current) => ({ ...current, ...next }))}
        onAdd={onImages}
      />
      <div className="flex gap-2 pt-1">
        <Button type="submit" variant="luxury" className="h-10 rounded-none px-5" disabled={saving}>
          {saving ? "جارٍ الحفظ…" : "حفظ المنتج"}
        </Button>
        <Button type="button" variant="outline" className="h-10 rounded-none px-5" onClick={onCancel}>
          إلغاء
        </Button>
      </div>
    </form>
  );
}

function OrdersPanel({
  orders,
  onStatus,
  onShipping,
  onDelete,
}: {
  orders: ReturnType<typeof useSiteStore>["orders"];
  onStatus: (id: string, status: OrderStatus) => void | Promise<void>;
  onShipping: (id: string, shippingCompany: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}) {
  if (orders.length === 0) {
    return (
      <div className="space-y-5">
        <PanelHeader
          title="الطلبات"
          subtitle="تظهر هنا عند إتمام الشراء. حساب الإدارة يضبط المرحلة وشركة الشحن، والمساعد يقرأها كما هي."
        />
        <div className="rounded-[1.35rem] border border-[#e6dcc8] bg-white/85 px-6 py-16 text-center text-sm text-muted-foreground">
          لا توجد طلبات بعد. المراحل المتاحة: {statuses.join("، ")}.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PanelHeader
        title="الطلبات"
        subtitle={`${orders.length} طلب مسجّل. حالة كل طلب وشركة الشحن يضبطها حساب الإدارة فقط، ويقرأها المساعد كما هي.`}
      />
      <div className="space-y-3">
        {orders.map((order) => (
          <article key={order.id} className="rounded-[1.35rem] border border-[#e6dcc8] bg-white/85 px-5 py-5 shadow-[0_8px_30px_rgba(70,52,24,0.03)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold tracking-tight">{order.id}</p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {new Date(order.createdAt).toLocaleString("ar-SA")} · {order.customerName || "بدون اسم"} ·{" "}
                  {order.customerPhone || "بدون هاتف"}
                </p>
              </div>
              <p className="text-base font-semibold text-gold">{formatPrice(order.total)}</p>
            </div>
            <ul className="mt-4 space-y-2 border-t border-border/60 pt-4 text-[13px]">
              {order.items.map((item) => (
                <li key={`${order.id}-${item.key}`} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">
                    {item.name} ({item.label}) × {item.quantity}
                  </span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            {order.customerNote && (
              <p className="mt-3 text-[13px] text-muted-foreground">ملاحظة: {order.customerNote}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <select
                className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
                value={order.status}
                onChange={(e) => onStatus(order.id, e.target.value as OrderStatus)}
              >
                {!statuses.includes(order.status) && <option value={order.status}>{order.status}</option>}
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <Input
                className="h-10 max-w-xs rounded-none"
                defaultValue={order.shippingCompany ?? ""}
                placeholder="شركة الشحن"
                key={`${order.id}-${order.shippingCompany ?? ""}`}
                onBlur={(event) => {
                  const next = event.target.value.trim();
                  if (next === (order.shippingCompany ?? "").trim()) return;
                  void onShipping(order.id, next);
                }}
              />
              <Button
                variant="ghost"
                className="h-10 rounded-none text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(order.id)}
              >
                <Trash2 className="size-3.5" strokeWidth={1.25} /> حذف
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ReviewsPanel({
  reviews,
  onPin,
  onDelete,
}: {
  reviews: Review[];
  onPin: (id: string, pinned: boolean) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}) {
  const pinnedCount = reviews.filter((review) => review.pinned).length;

  if (reviews.length === 0) {
    return (
      <div className="space-y-5">
        <PanelHeader
          title="التقييمات"
          subtitle="تظهر هنا تعليقات العميلات بعد الشراء. ثبّتي ما تريدينه في الصفحة الرئيسية أو احذفي ما لا يناسب."
        />
        <div className="rounded-[1.35rem] border border-[#e6dcc8] bg-white/85 px-6 py-16 text-center text-sm text-muted-foreground">
          لا توجد تقييمات بعد. عند طلب منتج وكتابة رأي سيظهر هنا.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PanelHeader
        title="التقييمات"
        subtitle={`${reviews.length} تقييم · ${pinnedCount} مثبت في الصفحة الرئيسية. التعليق غير المثبت يبقى تحت المنتج.`}
      />
      <div className="space-y-3">
        {reviews.map((review) => (
          <article
            key={review.id}
            className={`border bg-white/85 px-5 py-5 shadow-[0_8px_30px_rgba(70,52,24,0.03)] ${
              review.pinned ? "border-gold/50" : "border-[#e6dcc8]"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold tracking-tight">{review.authorName}</p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {review.productName} · {new Date(review.createdAt).toLocaleString("ar-SA")}
                </p>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  {review.authorPhone}
                  {review.authorEmail ? ` · ${review.authorEmail}` : ""}
                </p>
              </div>
              <StarRating value={review.rating} readOnly size="sm" />
            </div>
            <p className="mt-4 text-sm leading-8 text-muted-foreground">{review.comment}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={review.pinned ? "luxury" : "outline"}
                className="h-10 rounded-none px-4"
                onClick={() => onPin(review.id, !review.pinned)}
              >
                {review.pinned ? <PinOff className="size-3.5" strokeWidth={1.25} /> : <Pin className="size-3.5" strokeWidth={1.25} />}
                {review.pinned ? "إلغاء التثبيت" : "تثبيت في الرئيسية"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-10 rounded-none text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(review.id)}
              >
                <Trash2 className="size-3.5" strokeWidth={1.25} /> حذف
              </Button>
              {review.pinned && <span className="text-[12px] text-gold">يظهر في سلايدر الصفحة الرئيسية</span>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ContentPanel({
  content,
  onSave,
}: {
  content: SiteContent;
  onSave: (content: SiteContent) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState(content);
  const { saving } = useSiteStore();

  const setPath = (path: string, value: string | string[]) => {
    setDraft((current) => {
      const next = structuredClone(current);
      const parts = path.split(".");
      let cursor: Record<string, unknown> = next as unknown as Record<string, unknown>;
      for (let i = 0; i < parts.length - 1; i++) {
        cursor = cursor[parts[i]!] as Record<string, unknown>;
      }
      cursor[parts[parts.length - 1]!] = value;
      return next;
    });
  };

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        await onSave(draft);
      }}
    >
      <div className="flex items-end justify-between gap-3">
        <PanelHeader title="النصوص" subtitle="عدّلي محتوى الصفحات مباشرة." />
        <Button type="submit" variant="luxury" className="h-10 shrink-0 rounded-none px-5" disabled={saving}>
          {saving ? "جارٍ الحفظ…" : "حفظ النصوص"}
        </Button>
      </div>

      <Section title="شريط الإعلانات">
        <Textarea
          className="min-h-24 rounded-none"
          value={draft.announcements.join("\n")}
          onChange={(e) => setPath("announcements", e.target.value.split("\n").filter(Boolean))}
        />
      </Section>

      <Section title="الصفحة الرئيسية — البطل">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="السطر العلوي">
            <Input
              className="h-11 rounded-none"
              value={draft.hero.eyebrow}
              onChange={(e) => setPath("hero.eyebrow", e.target.value)}
            />
          </Field>
          <Field label="زر الدعوة">
            <Input
              className="h-11 rounded-none"
              value={draft.hero.cta}
              onChange={(e) => setPath("hero.cta", e.target.value)}
            />
          </Field>
          <Field label="العنوان 1">
            <Input
              className="h-11 rounded-none"
              value={draft.hero.title}
              onChange={(e) => setPath("hero.title", e.target.value)}
            />
          </Field>
          <Field label="العنوان 2">
            <Input
              className="h-11 rounded-none"
              value={draft.hero.titleLine2}
              onChange={(e) => setPath("hero.titleLine2", e.target.value)}
            />
          </Field>
        </div>
        <Field label="الوصف">
          <Textarea
            className="mt-4 min-h-24 rounded-none"
            value={draft.hero.subtitle}
            onChange={(e) => setPath("hero.subtitle", e.target.value)}
          />
        </Field>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="ميزة 1 — العنوان">
            <Input
              className="h-11 rounded-none"
              value={draft.hero.feature1Title}
              onChange={(e) => setPath("hero.feature1Title", e.target.value)}
            />
          </Field>
          <Field label="ميزة 1 — النص">
            <Input
              className="h-11 rounded-none"
              value={draft.hero.feature1Text}
              onChange={(e) => setPath("hero.feature1Text", e.target.value)}
            />
          </Field>
          <Field label="ميزة 2 — العنوان">
            <Input
              className="h-11 rounded-none"
              value={draft.hero.feature2Title}
              onChange={(e) => setPath("hero.feature2Title", e.target.value)}
            />
          </Field>
          <Field label="ميزة 2 — النص">
            <Input
              className="h-11 rounded-none"
              value={draft.hero.feature2Text}
              onChange={(e) => setPath("hero.feature2Text", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="قسم المنتجات في الرئيسية">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="التسمية">
            <Input
              className="h-11 rounded-none"
              value={draft.homeProducts.kicker}
              onChange={(e) => setPath("homeProducts.kicker", e.target.value)}
            />
          </Field>
          <Field label="العنوان">
            <Input
              className="h-11 rounded-none"
              value={draft.homeProducts.title}
              onChange={(e) => setPath("homeProducts.title", e.target.value)}
            />
          </Field>
        </div>
      </Section>

      <Section title="عن لوما">
        <p className="mb-5 text-[13px] leading-6 text-muted-foreground">
          صفحة «عن لوما» نصية فقط — بدون صور جانبية.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="العنوان 1">
            <Input
              className="h-11 rounded-none"
              value={draft.about.title}
              onChange={(e) => setPath("about.title", e.target.value)}
            />
          </Field>
          <Field label="العنوان 2">
            <Input
              className="h-11 rounded-none"
              value={draft.about.titleLine2}
              onChange={(e) => setPath("about.titleLine2", e.target.value)}
            />
          </Field>
        </div>
        <Field label="المقدمة">
          <Textarea
            className="mt-4 min-h-20 rounded-none"
            value={draft.about.intro}
            onChange={(e) => setPath("about.intro", e.target.value)}
          />
        </Field>
        <Field label="الفقرة 1">
          <Textarea
            className="mt-4 min-h-20 rounded-none"
            value={draft.about.p1}
            onChange={(e) => setPath("about.p1", e.target.value)}
          />
        </Field>
        <Field label="الفقرة 2">
          <Textarea
            className="mt-4 min-h-20 rounded-none"
            value={draft.about.p2}
            onChange={(e) => setPath("about.p2", e.target.value)}
          />
        </Field>
        <Field label="الفقرة 3">
          <Textarea
            className="mt-4 min-h-20 rounded-none"
            value={draft.about.p3}
            onChange={(e) => setPath("about.p3", e.target.value)}
          />
        </Field>
      </Section>

      <Section title="التذييل والتواصل">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="الشعار الفرعي">
            <Input
              className="h-11 rounded-none"
              value={draft.footer.tagline}
              onChange={(e) => setPath("footer.tagline", e.target.value)}
            />
          </Field>
          <Field label="البريد">
            <Input
              className="h-11 rounded-none"
              value={draft.footer.email}
              onChange={(e) => setPath("footer.email", e.target.value)}
            />
          </Field>
          <Field label="الهاتف">
            <Input
              className="h-11 rounded-none"
              value={draft.footer.phone}
              onChange={(e) => setPath("footer.phone", e.target.value)}
            />
            <p className="text-[12px] leading-5 text-muted-foreground">
              يظهر للعميلة إذا لم تستطع المساعدة حل المشكلة. لإضافة أكثر من رقم، افصلي بينها بفاصلة.
            </p>
          </Field>
        </div>
      </Section>
    </form>
  );
}

function ImagesPanel({
  content,
  products,
  onSave,
}: {
  content: SiteContent;
  products: Product[];
  onSave: (images: SiteContent["images"], products: Product[]) => void | Promise<void>;
}) {
  const [images, setImages] = useState(content.images);
  const [productDrafts, setProductDrafts] = useState(products);
  const { saving } = useSiteStore();

  useEffect(() => {
    setImages(content.images);
    setProductDrafts(products);
  }, [content.images, products]);

  const upload = async (key: keyof SiteContent["images"], file?: File | null) => {
    if (!file) return;
    const url = await fileToDataUrl(file);
    setImages((current) => ({ ...current, [key]: url }));
  };

  const fields: { key: keyof SiteContent["images"]; label: string; hint: string; frame: string }[] = [
    {
      key: "logo",
      label: "الشعار",
      hint: "512×512 بكسل، خلفية شفافة. يظهر مربعًا صغيرًا بجانب كلمة LOMA.",
      frame: "mx-auto aspect-square w-28 object-contain",
    },
    {
      key: "hero",
      label: "صورة الصفحة الرئيسية / المجموعة",
      hint: "1600×2000 بكسل (نسبة 4:5). الرئيسية تعرضها في عمود طويل، وصفحة المجموعة تقصّها عرضيًا. ضعي الموضوع في الوسط.",
      frame: "aspect-[4/5] w-full object-cover",
    },
    {
      key: "ritualPads",
      label: "صورة صفحة الروتين (قطن)",
      hint: "1400×1800 بكسل (نسبة 3:4). تظهر بنصف عرض الصفحة وارتفاع طويل.",
      frame: "aspect-[3/4] w-full object-cover",
    },
    {
      key: "ritualBottle",
      label: "صورة صفحة الروتين (زجاجة)",
      hint: "1400×1800 بكسل (نسبة 3:4). تظهر بنصف عرض الصفحة وارتفاع طويل.",
      frame: "aspect-[3/4] w-full object-cover",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <PanelHeader
          title="الصور"
          subtitle="استبدلي صور الصفحات، وأضيفي أكثر من صورة لكل منتج ثم فعّلي الصورة التي تظهر في البطاقة."
        />
        <Button
          variant="luxury"
          className="h-10 shrink-0 rounded-none px-5"
          disabled={saving}
          onClick={() => onSave(images, productDrafts)}
        >
          {saving ? "جارٍ الحفظ…" : "حفظ الصور"}
        </Button>
      </div>
      <Section title="صور الصفحات">
        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.key} className="rounded-[1.35rem] border border-[#e6dcc8] bg-white/85 p-4 shadow-[0_8px_30px_rgba(70,52,24,0.03)]">
              <p className="mb-1 text-[13px] text-muted-foreground">{field.label}</p>
              <p className="mb-3 text-[12px] leading-5 text-muted-foreground">{field.hint}</p>
              <img src={images[field.key]} alt="" className={`mb-4 ${field.frame}`} />
              <Input
                type="file"
                accept="image/*"
                className="rounded-none"
                onChange={(e) => upload(field.key, e.target.files?.[0])}
              />
            </div>
          ))}
        </div>
      </Section>
      <Section title="صور المنتجات">
        <div className="grid gap-4 sm:grid-cols-2">
          {productDrafts.map((product) => (
            <div key={product.id} className="rounded-[1.35rem] border border-[#e6dcc8] bg-white/85 p-4 shadow-[0_8px_30px_rgba(70,52,24,0.03)]">
              <p className="mb-1 text-[13px] font-medium">{product.name}</p>
              <p className="mb-3 text-[12px] text-muted-foreground">{product.size}</p>
              <ProductGalleryEditor
                image={product.image}
                gallery={product.gallery?.length ? product.gallery : product.image ? [product.image] : []}
                onChange={(next) =>
                  setProductDrafts((current) =>
                    current.map((item) => (item.id === product.id ? { ...item, ...next } : item)),
                  )
                }
                onAdd={async (files) => {
                  if (!files?.length) return;
                  const urls = await Promise.all(Array.from(files).map((file) => fileToDataUrl(file)));
                  setProductDrafts((current) =>
                    current.map((item) => {
                      if (item.id !== product.id) return item;
                      const gallery = [...(item.gallery ?? [])];
                      for (const url of urls) {
                        if (!gallery.includes(url)) gallery.push(url);
                      }
                      return { ...item, image: item.image || urls[0] || "", gallery };
                    }),
                  );
                }}
              />
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function PanelHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[1.35rem] border border-[#e6dcc8] bg-white/85 px-5 py-6 shadow-[0_8px_30px_rgba(70,52,24,0.03)]">
      <h3 className="mb-5 text-[13px] font-medium tracking-wide text-gold">{title}</h3>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2 text-[13px]">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function cleanLines(value: string[] | string) {
  return (Array.isArray(value) ? value : String(value).split("\n")).map((item) => item.trim()).filter(Boolean);
}

function LineListField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <Field label={`${label} (سطر لكل عنصر)`}>
      <Textarea
        className="min-h-24 rounded-none"
        value={Array.isArray(value) ? value.join("\n") : ""}
        onChange={(event) => onChange(event.target.value.split("\n"))}
      />
    </Field>
  );
}

function ProductGalleryEditor({
  image,
  gallery,
  onChange,
  onAdd,
}: {
  image: string;
  gallery: string[];
  onChange: (next: { image: string; gallery: string[] }) => void;
  onAdd: (files?: FileList | null) => void | Promise<void>;
}) {
  const frames = gallery.length ? gallery : image ? [image] : [];

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-muted-foreground">صور المنتج</p>
      <p className="text-[12px] leading-5 text-muted-foreground">
        الأبعاد المناسبة: 1200×1500 بكسل (نسبة 4:5). بطاقة المنتج وصفحته تعرضان الصورة بهذه النسبة، وشريط الرئيسية يقصّها قليلًا إلى 3:4، فاجعلي المنتج في الوسط. يمكن إضافة أكثر من صورة، وتفعيل الصورة التي تظهر أولًا.
      </p>
      <div className="flex flex-wrap gap-3">
        {frames.map((url, index) => {
          const active = url === image;
          return (
            <div key={`${index}-${url.slice(0, 24)}`} className="w-28">
              <button
                type="button"
                className={`block w-full overflow-hidden rounded-2xl border ${active ? "border-[#c2a15a]" : "border-[#e6dcc8]"}`}
                onClick={() => onChange({ image: url, gallery: frames })}
                aria-label={active ? "الصورة المفعّلة" : "تفعيل هذه الصورة"}
              >
                <img src={url} alt="" className="aspect-[4/5] w-full object-cover" />
              </button>
              <div className="mt-1.5 flex items-center justify-between gap-1">
                <button
                  type="button"
                  className={`text-[11px] ${active ? "text-gold" : "text-muted-foreground hover:text-foreground"}`}
                  onClick={() => onChange({ image: url, gallery: frames })}
                >
                  {active ? "مفعّلة" : "تفعيل"}
                </button>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="حذف الصورة"
                  onClick={() => {
                    const next = frames.filter((item) => item !== url);
                    onChange({ image: active ? (next[0] ?? "") : image, gallery: next });
                  }}
                >
                  <Trash2 className="size-3.5" strokeWidth={1.25} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <Input
        type="file"
        accept="image/*"
        multiple
        className="max-w-xs rounded-none"
        onChange={(event) => {
          void onAdd(event.target.files);
          event.target.value = "";
        }}
      />
    </div>
  );
}
