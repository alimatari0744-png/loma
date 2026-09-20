import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";
import {
  ImageIcon,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  Save,
  ShoppingBag,
  Trash2,
  Type,
  Upload,
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
  { id: "overview", label: "نظرة عامة", icon: LayoutDashboard },
  { id: "products", label: "المنتجات", icon: Package },
  { id: "orders", label: "الطلبات", icon: ShoppingBag },
  { id: "content", label: "النصوص", icon: Type },
  { id: "images", label: "الصور", icon: ImageIcon },
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
      <div className="grid min-h-screen place-items-center bg-background text-muted-foreground" dir="rtl">
        جاري التحميل…
      </div>
    );
  }

  if (!store.isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-5" dir="rtl">
        <form
          className="w-full max-w-md border border-border bg-card p-8"
          onSubmit={(event) => {
            event.preventDefault();
            store.loginAdmin(password || "admin");
          }}
        >
          <p className="text-xs font-semibold text-gold">LOMA ADMIN</p>
          <h1 className="mt-3 text-3xl font-semibold">لوحة التحكم</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            أدخلي أي كلمة مرور أو رقم للدخول مباشرة.
          </p>
          <Input
            className="mt-6 rounded-none"
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoFocus
          />
          <Button type="submit" variant="luxury" size="luxury" className="mt-4 w-full rounded-none">
            دخول
          </Button>
          <Link to="/" className="mt-6 block text-center text-sm text-muted-foreground hover:text-foreground">
            العودة للموقع
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
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="text-xs font-semibold text-gold">LOMA</p>
            <h1 className="text-xl font-semibold">لوحة التحكم</h1>
          </div>
          <div className="flex items-center gap-2">
            {savedFlash && <span className="text-sm text-gold">تم الحفظ</span>}
            <Button asChild variant="outline" className="rounded-none">
              <Link to="/">عرض الموقع</Link>
            </Button>
            <Button variant="ghost" className="rounded-none" onClick={store.logoutAdmin}>
              <LogOut className="size-4" /> خروج
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit border border-border bg-background p-2">
          {tabs.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex w-full items-center gap-3 px-3 py-3 text-sm transition-colors ${
                  tab === item.id ? "bg-foreground text-primary-foreground" : "hover:bg-secondary"
                }`}
              >
                <Icon className="size-4" />
                {item.label}
              </button>
            );
          })}
        </aside>

        <main className="min-w-0 space-y-6">
          {tab === "overview" && (
            <OverviewPanel
              onReset={() => {
                if (confirm("إعادة ضبط كل البيانات للافتراضي؟")) {
                  store.resetAll();
                  flashSave();
                }
              }}
              onExport={() => {
                const blob = new Blob([JSON.stringify(store.exportData(), null, 2)], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `loma-backup-${Date.now()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              onImport={async (file) => {
                const text = await file.text();
                store.importData(JSON.parse(text));
                flashSave();
              }}
            />
          )}

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

function OverviewPanel({
  onReset,
  onExport,
  onImport,
}: {
  onReset: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}) {
  const { products, orders } = useSiteStore();
  const newOrders = orders.filter((order) => order.status === "جديد").length;
  const revenue = orders
    .filter((order) => order.status !== "ملغي")
    .reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="المنتجات" value={String(products.length)} />
        <StatCard label="الطلبات الجديدة" value={String(newOrders)} />
        <StatCard label="إجمالي المبيعات" value={formatPrice(revenue)} />
      </div>
      <section className="border border-border bg-background p-5">
        <h2 className="text-lg font-semibold">نسخ احتياطي</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          البيانات تُحفظ في هذا المتصفح. صدّري نسخة للاحتفاظ بها أو انقليها لجهاز آخر.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="luxury" className="rounded-none" onClick={onExport}>
            تصدير JSON
          </Button>
          <label className="inline-flex cursor-pointer items-center gap-2 border border-border px-4 py-2 text-sm">
            <Upload className="size-4" /> استيراد JSON
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onImport(file);
              }}
            />
          </label>
          <Button variant="outline" className="rounded-none text-destructive" onClick={onReset}>
            إعادة الضبط
          </Button>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-background p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">المنتجات ({products.length})</h2>
        <Button variant="luxury" className="rounded-none" onClick={onCreate}>
          <Plus className="size-4" /> منتج جديد
        </Button>
      </div>

      {editing && (
            <ProductEditor
              key={editing.id}
              product={editing}
              onSave={onSave}
              onCancel={onCancel}
            />
          )}

      <div className="space-y-3">
        {products.map((product) => (
          <div key={product.id} className="flex gap-4 border border-border bg-background p-3">
            <img src={product.image} alt="" className="size-20 object-cover" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-muted-foreground">
                {product.size} — {formatPrice(product.price)} — {product.category}
              </p>
              {product.badge && <p className="mt-1 text-xs text-gold">{product.badge}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm" className="rounded-none" onClick={() => onEdit(product)}>
                تعديل
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none text-destructive"
                onClick={() => onDelete(product.id)}
              >
                <Trash2 className="size-4" />
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
      className="space-y-4 border border-border bg-background p-5"
      onSubmit={(event: FormEvent) => {
        event.preventDefault();
        onSave({
          ...draft,
          contents: (Array.isArray(draft.contents) ? draft.contents : String(draft.contents).split("\n"))
            .map((s) => String(s).trim())
            .filter(Boolean),
          highlights: (Array.isArray(draft.highlights) ? draft.highlights : String(draft.highlights).split("\n"))
            .map((s) => String(s).trim())
            .filter(Boolean),
          gallery: draft.gallery.length ? draft.gallery : [draft.image],
        });
      }}
    >
      <h3 className="font-semibold">تعديل المنتج #{draft.id}</h3>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="الاسم">
          <Input className="rounded-none" value={draft.name} onChange={(e) => setField("name", e.target.value)} />
        </Field>
        <Field label="الحجم / التفاصيل">
          <Input className="rounded-none" value={draft.size} onChange={(e) => setField("size", e.target.value)} />
        </Field>
        <Field label="السعر">
          <Input
            className="rounded-none"
            type="number"
            value={draft.price}
            onChange={(e) => setField("price", Number(e.target.value))}
          />
        </Field>
        <Field label="التصنيف">
          <select
            className="h-10 w-full border border-input bg-background px-3 text-sm"
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
            className="rounded-none"
            value={draft.badge ?? ""}
            onChange={(e) => setField("badge", e.target.value || undefined)}
          />
        </Field>
        <Field label="ملاحظة قصيرة">
          <Input className="rounded-none" value={draft.note} onChange={(e) => setField("note", e.target.value)} />
        </Field>
      </div>
      <Field label="الوصف">
        <Textarea
          className="min-h-28 rounded-none"
          value={draft.description}
          onChange={(e) => setField("description", e.target.value)}
        />
      </Field>
      <div className="grid gap-3 md:grid-cols-2">
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
        <div className="flex items-center gap-4">
          <img src={draft.image} alt="" className="size-24 object-cover" />
          <Input type="file" accept="image/*" className="rounded-none" onChange={(e) => onImage(e.target.files?.[0])} />
        </div>
      </Field>
      <div className="flex gap-2">
        <Button type="submit" variant="luxury" className="rounded-none">
          <Save className="size-4" /> حفظ المنتج
        </Button>
        <Button type="button" variant="outline" className="rounded-none" onClick={onCancel}>
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
      <div className="border border-border bg-background p-10 text-center text-muted-foreground">
        لا توجد طلبات بعد. ستظهر هنا عند إتمام الشراء من السلة.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <article key={order.id} className="border border-border bg-background p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{order.id}</p>
              <p className="text-sm text-muted-foreground">
                {new Date(order.createdAt).toLocaleString("ar-SA")} — {order.customerName || "بدون اسم"} —{" "}
                {order.customerPhone || "بدون هاتف"}
              </p>
            </div>
            <p className="font-semibold text-gold">{formatPrice(order.total)}</p>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {order.items.map((item) => (
              <li key={`${order.id}-${item.key}`} className="flex justify-between gap-3">
                <span>
                  {item.name} ({item.label}) × {item.quantity}
                </span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          {order.customerNote && (
            <p className="mt-3 text-sm text-muted-foreground">ملاحظة: {order.customerNote}</p>
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
            <Button variant="ghost" className="rounded-none text-destructive" onClick={() => onDelete(order.id)}>
              حذف
            </Button>
          </div>
        </article>
      ))}
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
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(draft);
      }}
    >
      <Section title="شريط الإعلانات">
        <Textarea
          className="min-h-24 rounded-none"
          value={draft.announcements.join("\n")}
          onChange={(e) => setPath("announcements", e.target.value.split("\n").filter(Boolean))}
        />
      </Section>

      <Section title="الصفحة الرئيسية — البطل">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="السطر العلوي">
            <Input className="rounded-none" value={draft.hero.eyebrow} onChange={(e) => setPath("hero.eyebrow", e.target.value)} />
          </Field>
          <Field label="العنوان 1">
            <Input className="rounded-none" value={draft.hero.title} onChange={(e) => setPath("hero.title", e.target.value)} />
          </Field>
          <Field label="العنوان 2">
            <Input className="rounded-none" value={draft.hero.titleLine2} onChange={(e) => setPath("hero.titleLine2", e.target.value)} />
          </Field>
          <Field label="زر الدعوة">
            <Input className="rounded-none" value={draft.hero.cta} onChange={(e) => setPath("hero.cta", e.target.value)} />
          </Field>
        </div>
        <Field label="الوصف">
          <Textarea className="mt-3 min-h-24 rounded-none" value={draft.hero.subtitle} onChange={(e) => setPath("hero.subtitle", e.target.value)} />
        </Field>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label="ميزة 1 — العنوان">
            <Input className="rounded-none" value={draft.hero.feature1Title} onChange={(e) => setPath("hero.feature1Title", e.target.value)} />
          </Field>
          <Field label="ميزة 1 — النص">
            <Input className="rounded-none" value={draft.hero.feature1Text} onChange={(e) => setPath("hero.feature1Text", e.target.value)} />
          </Field>
          <Field label="ميزة 2 — العنوان">
            <Input className="rounded-none" value={draft.hero.feature2Title} onChange={(e) => setPath("hero.feature2Title", e.target.value)} />
          </Field>
          <Field label="ميزة 2 — النص">
            <Input className="rounded-none" value={draft.hero.feature2Text} onChange={(e) => setPath("hero.feature2Text", e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title="قسم المنتجات في الرئيسية">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="التسمية">
            <Input className="rounded-none" value={draft.homeProducts.kicker} onChange={(e) => setPath("homeProducts.kicker", e.target.value)} />
          </Field>
          <Field label="العنوان">
            <Input className="rounded-none" value={draft.homeProducts.title} onChange={(e) => setPath("homeProducts.title", e.target.value)} />
          </Field>
        </div>
      </Section>

      <Section title="عن لوما">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="العنوان 1">
            <Input className="rounded-none" value={draft.about.title} onChange={(e) => setPath("about.title", e.target.value)} />
          </Field>
          <Field label="العنوان 2">
            <Input className="rounded-none" value={draft.about.titleLine2} onChange={(e) => setPath("about.titleLine2", e.target.value)} />
          </Field>
        </div>
        <Field label="المقدمة">
          <Textarea className="mt-3 min-h-20 rounded-none" value={draft.about.intro} onChange={(e) => setPath("about.intro", e.target.value)} />
        </Field>
        <Field label="الفقرة 1">
          <Textarea className="mt-3 min-h-20 rounded-none" value={draft.about.p1} onChange={(e) => setPath("about.p1", e.target.value)} />
        </Field>
        <Field label="الفقرة 2">
          <Textarea className="mt-3 min-h-20 rounded-none" value={draft.about.p2} onChange={(e) => setPath("about.p2", e.target.value)} />
        </Field>
        <Field label="الفقرة 3">
          <Textarea className="mt-3 min-h-20 rounded-none" value={draft.about.p3} onChange={(e) => setPath("about.p3", e.target.value)} />
        </Field>
      </Section>

      <Section title="التذييل والتواصل">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="الشعار الفرعي">
            <Input className="rounded-none" value={draft.footer.tagline} onChange={(e) => setPath("footer.tagline", e.target.value)} />
          </Field>
          <Field label="البريد">
            <Input className="rounded-none" value={draft.footer.email} onChange={(e) => setPath("footer.email", e.target.value)} />
          </Field>
          <Field label="الهاتف">
            <Input className="rounded-none" value={draft.footer.phone} onChange={(e) => setPath("footer.phone", e.target.value)} />
          </Field>
        </div>
      </Section>

      <Button type="submit" variant="luxury" className="rounded-none">
        <Save className="size-4" /> حفظ النصوص
      </Button>
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
    { key: "hero", label: "صورة الصفحة الرئيسية" },
    { key: "ritualPads", label: "صورة الروتين (قطن)" },
    { key: "ritualBottle", label: "صورة الروتين (زجاجة)" },
  ];

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.key} className="border border-border bg-background p-4">
          <p className="mb-3 font-medium">{field.label}</p>
          <div className="flex flex-wrap items-center gap-4">
            <img src={images[field.key]} alt="" className="h-28 w-28 object-cover" />
            <Input
              type="file"
              accept="image/*"
              className="max-w-xs rounded-none"
              onChange={(e) => upload(field.key, e.target.files?.[0])}
            />
          </div>
        </div>
      ))}
      <Button variant="luxury" className="rounded-none" onClick={() => onSave(images)}>
        <Save className="size-4" /> حفظ الصور
      </Button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border border-border bg-background p-5">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
