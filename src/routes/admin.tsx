import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowUpRight,
  Check,
  ExternalLink,
  FileText,
  Image as ImageLucide,
  LayoutGrid,
  LogOut,
  Package,
  Pencil,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSiteStore } from "@/components/site-store-context";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/products";
import { emptyProduct, fileToDataUrl, type OrderStatus, type SiteContent } from "@/lib/site-data";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "لوحة تحكم لوما" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

type Tab = "overview" | "products" | "orders" | "content" | "images";

const tabs: { id: Tab; label: string; icon: typeof Package }[] = [
  { id: "overview", label: "نظرة عامة", icon: LayoutGrid },
  { id: "products", label: "المنتجات", icon: Package },
  { id: "orders", label: "الطلبات", icon: ShoppingBag },
  { id: "content", label: "النصوص", icon: FileText },
  { id: "images", label: "الصور", icon: ImageLucide },
];

const statuses: OrderStatus[] = ["جديد", "قيد التجهيز", "تم الشحن", "مكتمل", "ملغي"];
const categories: Product["category"][] = ["مزيل المكياج", "الوسادات", "الباقات"];

function AdminPage() {
  const store = useSiteStore();
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState<Product | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  if (!store.ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground" dir="rtl">
        جاري التحميل…
      </div>
    );
  }

  if (!store.isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-5" dir="rtl">
        <form
          className="w-full max-w-md bg-card px-8 py-10 shadow-[0_20px_60px_rgba(44,42,38,0.06)]"
          onSubmit={(event) => {
            event.preventDefault();
            store.loginAdmin(password || "admin");
          }}
        >
          <div className="mb-8">
            <p className="text-[11px] font-medium tracking-[0.28em] text-gold">LOMA</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">لوحة التحكم</h1>
          </div>
          <p className="text-sm leading-7 text-muted-foreground">أدخلي أي كلمة مرور أو رقم للدخول.</p>
          <Input
            className="mt-6 h-12 rounded-none border-border/80 bg-background"
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoFocus
          />
          <Button type="submit" variant="luxury" size="luxury" className="mt-4 h-12 w-full rounded-none">
            دخول
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

  const flashSave = () => {
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1600);
  };

  return (
    <div className="min-h-screen bg-[#f4f1ec] text-foreground" dir="rtl">
      <header className="border-b border-border/70 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-[10px] font-medium tracking-[0.28em] text-gold">LOMA</p>
            <h1 className="mt-1 text-lg font-semibold leading-none tracking-tight">لوحة التحكم</h1>
          </div>
          <div className="flex items-center gap-2">
            {savedFlash && (
              <span className="hidden items-center gap-1.5 text-sm text-gold sm:inline-flex">
                <Check className="size-3.5" strokeWidth={1.5} /> تم الحفظ
              </span>
            )}
            <Button asChild variant="outline" className="h-10 rounded-none border-border/80 px-4 text-sm">
              <Link to="/">
                عرض الموقع <ArrowUpRight className="size-3.5" strokeWidth={1.25} />
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="h-10 rounded-none px-3 text-muted-foreground hover:text-foreground"
              onClick={store.logoutAdmin}
            >
              <LogOut className="size-4" strokeWidth={1.25} />
              <span className="hidden sm:inline">خروج</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-7 lg:grid-cols-[200px_1fr]">
        <aside className="h-fit">
          <nav className="space-y-1">
            {tabs.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`flex w-full items-center gap-3 border-r-2 px-3 py-2.5 text-[13px] transition-colors ${
                    active
                      ? "border-gold bg-background text-foreground"
                      : "border-transparent text-muted-foreground hover:bg-background/70 hover:text-foreground"
                  }`}
                >
                  <Icon strokeWidth={1.15} className={`size-4 ${active ? "text-gold" : ""}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

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
              onDelete={(id) => {
                if (confirm("حذف هذا المنتج؟")) {
                  store.deleteProduct(id);
                  if (editing?.id === id) setEditing(null);
                  flashSave();
                }
              }}
              onSave={(product) => {
                store.upsertProduct(product);
                setEditing(null);
                flashSave();
              }}
              onCancel={() => setEditing(null)}
            />
          )}

          {tab === "orders" && (
            <OrdersPanel
              orders={store.orders}
              onStatus={store.updateOrderStatus}
              onDelete={(id) => {
                if (confirm("حذف الطلب؟")) {
                  store.deleteOrder(id);
                  flashSave();
                }
              }}
            />
          )}

          {tab === "content" && (
            <ContentPanel
              content={store.content}
              onSave={(content) => {
                store.setContent(content);
                flashSave();
              }}
            />
          )}

          {tab === "images" && (
            <ImagesPanel
              content={store.content}
              onSave={(images) => {
                store.patchContent({ images });
                flashSave();
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function OverviewPanel() {
  const { products, orders } = useSiteStore();
  const newOrders = orders.filter((order) => order.status === "جديد").length;
  const revenue = orders
    .filter((order) => order.status !== "ملغي")
    .reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="space-y-5">
      <PanelHeader title="نظرة عامة" subtitle="ملخص سريع لحالة المتجر اليوم." />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Package} label="المنتجات" value={String(products.length)} />
        <StatCard icon={ShoppingBag} label="طلبات جديدة" value={String(newOrders)} />
        <StatCard icon={Sparkles} label="إجمالي المبيعات" value={formatPrice(revenue)} />
      </div>
      <div className="bg-background/80 px-6 py-8 text-sm leading-7 text-muted-foreground">
        من القائمة الجانبية يمكنك تعديل المنتجات، متابعة الطلبات، وتحديث النصوص والصور مباشرة على
        الموقع.
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Package;
}) {
  return (
    <div className="bg-background/90 px-5 py-6">
      <div className="mb-4 flex items-center gap-2.5">
        <Icon strokeWidth={1.15} className="size-4 text-gold" />
        <span className="text-[12px] text-muted-foreground">{label}</span>
      </div>
      <p className="text-[1.65rem] font-semibold tracking-tight">{value}</p>
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
  onDelete: (id: number) => void;
  onSave: (product: Product) => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <PanelHeader title="المنتجات" subtitle={`${products.length} منتج في المجموعة.`} />
        <Button variant="luxury" className="h-10 shrink-0 rounded-none px-4" onClick={onCreate}>
          <Plus className="size-4" strokeWidth={1.25} /> منتج جديد
        </Button>
      </div>

      {editing && (
        <ProductEditor key={editing.id} product={editing} onSave={onSave} onCancel={onCancel} />
      )}

      <div className="space-y-3">
        {products.map((product) => (
          <div key={product.id} className="flex gap-4 bg-background/90 p-3.5">
            <img src={product.image} alt="" className="size-[4.5rem] object-cover" />
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
                className="h-9 rounded-none border-border/70 px-3"
                onClick={() => onEdit(product)}
              >
                <Pencil className="size-3.5" strokeWidth={1.25} /> تعديل
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-none text-muted-foreground hover:text-destructive"
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
  onSave: (product: Product) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Product>(product);

  const setField = <K extends keyof Product>(key: K, value: Product[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const onImage = async (file?: File | null) => {
    if (!file) return;
    const url = await fileToDataUrl(file);
    setDraft((current) => ({
      ...current,
      image: url,
      gallery: current.gallery.includes(url) ? current.gallery : [url, ...current.gallery],
    }));
  };

  return (
    <form
      className="space-y-5 bg-background px-5 py-6"
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        onSave({
          ...draft,
          contents: (Array.isArray(draft.contents) ? draft.contents : String(draft.contents).split("\n"))
            .map((s) => String(s).trim())
            .filter(Boolean),
          highlights: (Array.isArray(draft.highlights)
            ? draft.highlights
            : String(draft.highlights).split("\n")
          )
            .map((s) => String(s).trim())
            .filter(Boolean),
          gallery: draft.gallery.length ? draft.gallery : [draft.image],
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
            className="h-11 w-full border border-input bg-background px-3 text-sm"
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
        <Field label="المحتويات (سطر لكل عنصر)">
          <Textarea
            className="min-h-24 rounded-none"
            value={Array.isArray(draft.contents) ? draft.contents.join("\n") : ""}
            onChange={(e) => setDraft((c) => ({ ...c, contents: e.target.value.split("\n") }))}
          />
        </Field>
        <Field label="المميزات (سطر لكل عنصر)">
          <Textarea
            className="min-h-24 rounded-none"
            value={Array.isArray(draft.highlights) ? draft.highlights.join("\n") : ""}
            onChange={(e) => setDraft((c) => ({ ...c, highlights: e.target.value.split("\n") }))}
          />
        </Field>
      </div>
      <Field label="صورة المنتج">
        <div className="flex flex-wrap items-center gap-4">
          <img src={draft.image} alt="" className="size-24 object-cover" />
          <Input
            type="file"
            accept="image/*"
            className="max-w-xs rounded-none"
            onChange={(e) => onImage(e.target.files?.[0])}
          />
        </div>
      </Field>
      <div className="flex gap-2 pt-1">
        <Button type="submit" variant="luxury" className="h-10 rounded-none px-5">
          حفظ المنتج
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
  onDelete,
}: {
  orders: ReturnType<typeof useSiteStore>["orders"];
  onStatus: (id: string, status: OrderStatus) => void;
  onDelete: (id: string) => void;
}) {
  if (orders.length === 0) {
    return (
      <div className="space-y-5">
        <PanelHeader title="الطلبات" subtitle="تظهر هنا عند إتمام الشراء من السلة." />
        <div className="bg-background/80 px-6 py-16 text-center text-sm text-muted-foreground">
          لا توجد طلبات بعد.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PanelHeader title="الطلبات" subtitle={`${orders.length} طلب مسجّل.`} />
      <div className="space-y-3">
        {orders.map((order) => (
          <article key={order.id} className="bg-background/90 px-5 py-5">
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
                className="h-10 border border-input bg-background px-3 text-sm"
                value={order.status}
                onChange={(e) => onStatus(order.id, e.target.value as OrderStatus)}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
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

function ContentPanel({
  content,
  onSave,
}: {
  content: SiteContent;
  onSave: (content: SiteContent) => void;
}) {
  const [draft, setDraft] = useState(content);

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
      onSubmit={(event) => {
        event.preventDefault();
        onSave(draft);
      }}
    >
      <div className="flex items-end justify-between gap-3">
        <PanelHeader title="النصوص" subtitle="عدّلي محتوى الصفحات مباشرة." />
        <Button type="submit" variant="luxury" className="h-10 shrink-0 rounded-none px-5">
          حفظ النصوص
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
          </Field>
        </div>
      </Section>
    </form>
  );
}

function ImagesPanel({
  content,
  onSave,
}: {
  content: SiteContent;
  onSave: (images: SiteContent["images"]) => void;
}) {
  const [images, setImages] = useState(content.images);

  const upload = async (key: keyof SiteContent["images"], file?: File | null) => {
    if (!file) return;
    const url = await fileToDataUrl(file);
    setImages((current) => ({ ...current, [key]: url }));
  };

  const fields: { key: keyof SiteContent["images"]; label: string }[] = [
    { key: "logo", label: "الشعار" },
    { key: "hero", label: "صورة الصفحة الرئيسية / المجموعة" },
    { key: "ritualPads", label: "صورة صفحة الروتين (قطن)" },
    { key: "ritualBottle", label: "صورة صفحة الروتين (زجاجة)" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <PanelHeader
          title="الصور"
          subtitle="صور الصفحة الرئيسية والروتين والشعار فقط — صفحة «عن لوما» بلا صور."
        />
        <Button variant="luxury" className="h-10 shrink-0 rounded-none px-5" onClick={() => onSave(images)}>
          حفظ الصور
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key} className="bg-background/90 p-4">
            <p className="mb-3 text-[13px] text-muted-foreground">{field.label}</p>
            <img src={images[field.key]} alt="" className="mb-4 aspect-[4/3] w-full object-cover" />
            <Input
              type="file"
              accept="image/*"
              className="rounded-none"
              onChange={(e) => upload(field.key, e.target.files?.[0])}
            />
          </div>
        ))}
      </div>
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
    <section className="bg-background/90 px-5 py-6">
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
