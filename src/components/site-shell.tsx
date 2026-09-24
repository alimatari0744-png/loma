import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, LogIn, Mail, Menu, Minus, Phone, Plus, Search, ShoppingBag, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useCart } from "@/components/cart-context";
import { useCustomerAccount } from "@/components/customer-account-context";
import { useSiteStore } from "@/components/site-store-context";
import { formatPrice, type CartEntry } from "@/lib/products";

const links = [
  { label: "الرئيسية", to: "/" as const },
  { label: "المجموعة", to: "/products" as const },
  { label: "روتين لوما", to: "/ritual" as const },
  { label: "عن لوما", to: "/about" as const },
];

export function BrandMark({ compact = false }: { compact?: boolean }) {
  const { content } = useSiteStore();
  return (
    <span className="inline-flex items-center gap-2" dir="ltr" aria-label="LOMA">
      <span
        className={`font-brand font-semibold tracking-[0.2em] leading-none ${
          compact ? "text-[1.35rem]" : "text-[1.55rem] md:text-[1.75rem]"
        }`}
      >
        LOMA
      </span>
      <img
        src={content.images.logo}
        alt=""
        className={compact ? "size-6 object-contain" : "size-7 object-contain md:size-8"}
      />
    </span>
  );
}

export function BrandSymbol({ className = "size-8" }: { className?: string }) {
  const { content } = useSiteStore();
  return <img src={content.images.logo} alt="شعار لوما" className={`object-contain ${className}`} />;
}

function AnnouncementBar() {
  const { content } = useSiteStore();
  const announcements = content.announcements.length ? content.announcements : ["LOMA"];
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const interval = window.setInterval(
      () => setIndex((current) => (current + 1) % announcements.length),
      3200,
    );
    return () => window.clearInterval(interval);
  }, [announcements.length]);
  return (
    <div
      className="flex min-h-9 items-center justify-center overflow-hidden bg-foreground px-4 py-2 text-center text-[11px] font-medium text-primary-foreground md:text-xs"
      aria-live="polite"
    >
      <span key={index} className="animate-fade-in motion-reduce:animate-none">
        {announcements[index]}
      </span>
    </div>
  );
}

function CartSheet() {
  const { cart, cartCount, changeQuantity, removeFromCart } = useCart();
  const { resolveCartKey, addOrder } = useSiteStore();
  const { customer } = useCustomerAccount();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!customer) return;
    setName((current) => current || customer.name);
    setPhone((current) => current || customer.phone);
    setNote((current) => {
      if (current) return current;
      const parts = [customer.city, customer.district, customer.address].filter(Boolean);
      return parts.length ? parts.join(" — ") : current;
    });
  }, [customer]);

  const entries = Object.keys(cart)
    .map(Number)
    .map((key) => resolveCartKey(key))
    .filter((entry): entry is CartEntry => Boolean(entry));
  const total = entries.reduce((sum, entry) => sum + entry.price * (cart[entry.key] ?? 0), 0);

  const checkout = async () => {
    if (!entries.length) return;
    await addOrder({
      customerName: name.trim() || "عميلة",
      customerPhone: phone.trim(),
      customerNote: note.trim(),
      total,
      items: entries.map((entry) => ({
        key: entry.key,
        productId: entry.product.id,
        name: entry.product.name,
        label: entry.label,
        price: entry.price,
        quantity: cart[entry.key] ?? 1,
        image: entry.product.image,
      })),
    });
    entries.forEach((entry) => removeFromCart(entry.key));
    setName("");
    setPhone("");
    setNote("");
    setDone(true);
    window.setTimeout(() => setDone(false), 2500);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="سلة التسوق">
          <ShoppingBag />
          {cartCount > 0 && (
            <span className="absolute -left-0.5 -top-0.5 grid size-[18px] place-items-center rounded-full bg-gold text-[9px] text-gold-foreground">
              {cartCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" dir="rtl" className="flex w-full flex-col bg-background sm:max-w-md">
        <SheetHeader className="text-right">
          <SheetTitle className="text-2xl font-semibold">سلة لوما</SheetTitle>
          <SheetDescription>المنتجات التي اخترتها</SheetDescription>
        </SheetHeader>
        <div className="mt-8 flex-1 space-y-5 overflow-auto">
          {cartCount === 0 ? (
            <div className="grid h-40 place-items-center border-y border-border text-center text-muted-foreground">
              <div>
                <ShoppingBag className="mx-auto mb-3 size-7" strokeWidth={1.2} />
                <p>{done ? "تم استلام طلبك بنجاح" : "سلتك بانتظار اختياراتك"}</p>
              </div>
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.key} className="flex gap-4 border-b border-border pb-5">
                <img src={entry.product.image} alt={entry.product.name} className="size-20 object-cover" />
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div>
                    <p className="font-medium">{entry.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.label} — {formatPrice(entry.price)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center border border-border">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 rounded-none"
                        onClick={() => changeQuantity(entry.key, -1)}
                        aria-label="تقليل الكمية"
                      >
                        <Minus />
                      </Button>
                      <span className="w-7 text-center text-sm">{cart[entry.key]}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 rounded-none"
                        onClick={() => changeQuantity(entry.key, 1)}
                        aria-label="زيادة الكمية"
                      >
                        <Plus />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground"
                      onClick={() => removeFromCart(entry.key)}
                      aria-label="حذف المنتج"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
          {cartCount > 0 && (
            <div className="space-y-3 border-t border-border pt-4">
              <Input
                className="rounded-none"
                placeholder="الاسم"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                className="rounded-none"
                placeholder="رقم الجوال"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Textarea
                className="min-h-20 rounded-none"
                placeholder="ملاحظة (اختياري)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          )}
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
          <span className="text-sm text-muted-foreground">الإجمالي</span>
          <span className="text-lg font-semibold">{formatPrice(total)}</span>
        </div>
        <Button
          variant="luxury"
          size="luxury"
          className="mt-4 w-full"
          disabled={cartCount === 0}
          onClick={checkout}
        >
          إتمام الطلب
        </Button>
      </SheetContent>
    </Sheet>
  );
}

function MobileNav() {
  const { customer } = useCustomerAccount();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0 md:hidden" aria-label="فتح القائمة">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        dir="rtl"
        className="flex w-1/2 max-w-none flex-col border-l-border bg-background p-0 sm:max-w-none [&>button]:hidden"
      >
        <SheetHeader className="space-y-0 border-b border-border/80 px-5 py-5 text-right">
          <SheetTitle className="sr-only">قائمة التنقل</SheetTitle>
          <SheetDescription className="sr-only">روابط صفحات متجر لوما</SheetDescription>
          <BrandMark compact />
        </SheetHeader>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-5">
          {links.map((item) => (
            <SheetClose asChild key={item.to}>
              <Link
                to={item.to}
                className="rounded-sm px-3 py-3 text-[15px] text-foreground/90 transition-colors hover:bg-secondary"
                activeProps={{ className: "bg-secondary text-gold" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            </SheetClose>
          ))}
        </nav>

        <div className="mt-auto border-t border-border/80 px-3 py-4">
          <SheetClose asChild>
            <Link
              to="/account"
              className="flex items-center gap-3 rounded-sm px-3 py-3 text-[15px] transition-colors hover:bg-secondary"
              activeProps={{ className: "bg-secondary text-gold" }}
            >
              {customer ? (
                <UserRound className="size-4 shrink-0" strokeWidth={1.5} />
              ) : (
                <LogIn className="size-4 shrink-0" strokeWidth={1.5} />
              )}
              <span>{customer ? "حسابي" : "دخول / حسابي"}</span>
            </Link>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SiteHeader() {
  const { customer } = useCustomerAccount();

  return (
    <>
      <AnnouncementBar />
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto grid h-14 max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center px-5 md:h-16 md:px-10 lg:px-14">
          <div className="flex min-w-0 items-center justify-start gap-2">
            <MobileNav />
            <Link to="/" className="shrink-0">
              <BrandMark />
            </Link>
          </div>

          <nav className="hidden items-center justify-center gap-8 text-[13px] text-muted-foreground md:flex lg:gap-11">
            {links.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="border-b border-transparent pb-1 transition-colors hover:text-foreground"
                activeProps={{ className: "border-foreground text-foreground" }}
                activeOptions={{ exact: item.to === "/" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon" className="hidden md:inline-flex" aria-label="البحث">
              <Search />
            </Button>
            <Button asChild variant="ghost" size="icon" aria-label={customer ? "حسابي" : "تسجيل الدخول"}>
              <Link to="/account">
                {customer ? <UserRound strokeWidth={1.5} /> : <LogIn strokeWidth={1.5} />}
              </Link>
            </Button>
            <CartSheet />
          </div>
        </div>
      </header>
    </>
  );
}

function SiteFooter() {
  const { content } = useSiteStore();
  return (
    <footer className="border-t border-border bg-card px-5 py-12 md:px-10 lg:px-14">
      <div className="mx-auto grid max-w-[1320px] gap-10 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <BrandMark compact />
          <p className="mt-3 text-xs text-muted-foreground">{content.footer.tagline}</p>
          <div className="mt-7 grid gap-3 text-sm">
            <div className="flex items-center gap-3">
              <Mail className="size-4 text-gold" aria-hidden="true" />
              <span className="text-muted-foreground">البريد الإلكتروني:</span>
              <span>{content.footer.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="size-4 text-gold" aria-hidden="true" />
              <span className="text-muted-foreground">رقم الهاتف:</span>
              <span>{content.footer.phone}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-muted-foreground md:justify-end">
          {links.slice(1).map((item) => (
            <Link key={item.to} to={item.to}>
              {item.label}
            </Link>
          ))}
          <Link to="/account">حسابي</Link>
        </div>
      </div>
      <div className="mx-auto mt-10 flex max-w-[1320px] items-center justify-between border-t border-border pt-6 text-[11px] text-muted-foreground">
        <span>© 2026 LOMA</span>
        <a href="#top" className="flex items-center gap-2">
          إلى الأعلى <ChevronDown className="size-3 rotate-180" />
        </a>
      </div>
    </footer>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <main id="top" dir="rtl" className="min-h-screen overflow-hidden bg-background text-foreground">
      <SiteHeader />
      {children}
      <SiteFooter />
    </main>
  );
}
