import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { LogIn, LogOut, MapPin, Package, Shield, UserRound } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { useCustomerAccount } from "@/components/customer-account-context";
import { useSiteStore } from "@/components/site-store-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatPrice } from "@/lib/products";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "حسابي | لوما" },
      { name: "description", content: "إدارة حسابك وطلباتك في متجر لوما." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AccountPage,
});

type AccountTab = "overview" | "profile" | "orders" | "address" | "security";
type GuestMode = "login" | "register" | "forgot";

const tabs: { id: AccountTab; label: string; icon: typeof UserRound }[] = [
  { id: "overview", label: "حسابي", icon: UserRound },
  { id: "orders", label: "طلباتي", icon: Package },
  { id: "profile", label: "بياناتي", icon: UserRound },
  { id: "address", label: "العنوان", icon: MapPin },
  { id: "security", label: "الأمان", icon: Shield },
];

function AccountPage() {
  const account = useCustomerAccount();
  const { orders } = useSiteStore();
  const [mode, setMode] = useState<GuestMode>("login");
  const [tab, setTab] = useState<AccountTab>("overview");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (!account.customer) {
      setName("");
      setPhone("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setCity("");
      setDistrict("");
      setAddress("");
      setTab("overview");
      return;
    }
    setName(account.customer.name);
    setPhone(account.customer.phone);
    setEmail(account.customer.email);
    setCity(account.customer.city);
    setDistrict(account.customer.district);
    setAddress(account.customer.address);
    setPassword("");
    setConfirmPassword("");
    setError("");
  }, [account.customer]);

  const myOrders = useMemo(() => {
    if (!account.customer) return [];
    const phoneKey = account.customer.phone.replace(/\s+/g, "");
    const emailKey = account.customer.email.trim().toLowerCase();
    return orders.filter((order) => {
      const orderPhone = order.customerPhone.replace(/\s+/g, "");
      const orderName = order.customerName.trim();
      return (
        (phoneKey && orderPhone === phoneKey) ||
        (emailKey && order.customerNote.toLowerCase().includes(emailKey)) ||
        (account.customer && orderName === account.customer.name)
      );
    });
  }, [account.customer, orders]);

  const flash = (message: string) => {
    setSaved(message);
    window.setTimeout(() => setSaved(""), 2800);
  };

  if (!account.ready) {
    return (
      <SiteShell>
        <div className="grid min-h-[50svh] place-items-center text-sm text-muted-foreground">جاري التحميل…</div>
      </SiteShell>
    );
  }

  if (!account.customer) {
    const titles = {
      login: "تسجيل الدخول",
      register: "إنشاء حساب",
      forgot: "نسيت كلمة المرور",
    };

    const submit = async (event: FormEvent) => {
      event.preventDefault();
      setError("");
      setSaved("");
      if (mode === "register" && password !== confirmPassword) {
        setError("كلمتا المرور غير متطابقتين");
        return;
      }
      setBusy(true);
      const result =
        mode === "login"
          ? await account.login(email, password)
          : mode === "forgot"
            ? await account.requestPasswordReset(email)
            : await account.register({ name, email, phone, password, city, district, address });
      setBusy(false);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (result.message) flash(result.message);
      if (mode === "register" || mode === "forgot") {
        setMode("login");
        setPassword("");
        setConfirmPassword("");
      }
    };

    return (
      <SiteShell>
        <section className="px-5 py-14 md:px-10 md:py-20 lg:px-14">
          <div className="mx-auto w-full max-w-md">
            <p className="text-xs font-semibold text-gold">حساب لوما</p>
            <h1 className="mt-3 text-4xl font-semibold">{titles[mode]}</h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {mode === "forgot"
                ? "أدخلي بريدك وسنرسل رابطًا لتعيين كلمة مرور جديدة."
                : "ادخلي بالبريد وكلمة المرور لمتابعة الطلبات وبياناتك."}
            </p>

            {mode !== "forgot" && (
              <div className="mt-8 flex border-b border-border text-sm">
                <button
                  type="button"
                  className={`flex-1 border-b-2 pb-3 transition-colors ${
                    mode === "login" ? "border-foreground text-foreground" : "border-transparent text-muted-foreground"
                  }`}
                  onClick={() => {
                    setMode("login");
                    setError("");
                  }}
                >
                  دخول
                </button>
                <button
                  type="button"
                  className={`flex-1 border-b-2 pb-3 transition-colors ${
                    mode === "register"
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground"
                  }`}
                  onClick={() => {
                    setMode("register");
                    setError("");
                  }}
                >
                  حساب جديد
                </button>
              </div>
            )}

            <form className="mt-8 space-y-4" onSubmit={submit}>
              {mode === "register" && (
                <Input
                  className="h-12 rounded-none"
                  placeholder="الاسم الكامل"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  required
                />
              )}
              <Input
                className="h-12 rounded-none"
                type="email"
                placeholder="البريد الإلكتروني"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
              {mode === "register" && (
                <Input
                  className="h-12 rounded-none"
                  placeholder="رقم الجوال (اختياري)"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  autoComplete="tel"
                />
              )}
              {mode !== "forgot" && (
                <Input
                  className="h-12 rounded-none"
                  type="password"
                  placeholder="كلمة المرور"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                />
              )}
              {mode === "register" && (
                <>
                  <Input
                    className="h-12 rounded-none"
                    type="password"
                    placeholder="تأكيد كلمة المرور"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    required
                  />
                  <Input
                    className="h-12 rounded-none"
                    placeholder="المدينة (اختياري)"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                  />
                  <Input
                    className="h-12 rounded-none"
                    placeholder="الحي (اختياري)"
                    value={district}
                    onChange={(event) => setDistrict(event.target.value)}
                  />
                  <Textarea
                    className="min-h-24 rounded-none"
                    placeholder="العنوان التفصيلي (اختياري)"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                  />
                </>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
              {saved && <p className="text-sm text-gold">{saved}</p>}
              <Button type="submit" variant="luxury" size="luxury" className="w-full rounded-none" disabled={busy}>
                {busy ? (
                  "جارٍ التنفيذ…"
                ) : mode === "login" ? (
                  <>
                    <LogIn className="size-4" /> دخول إلى حسابي
                  </>
                ) : mode === "forgot" ? (
                  "إرسال رابط الاستعادة"
                ) : (
                  "إنشاء الحساب"
                )}
              </Button>
            </form>

            <div className="mt-5 space-y-2 text-center text-sm text-muted-foreground">
              {mode === "login" && (
                <>
                  <button type="button" className="block w-full hover:text-foreground" onClick={() => setMode("forgot")}>
                    نسيت كلمة المرور؟
                  </button>
                  <button
                    type="button"
                    className="block w-full hover:text-foreground"
                    onClick={async () => {
                      setError("");
                      setBusy(true);
                      const result = await account.resendConfirmation(email);
                      setBusy(false);
                      if (!result.ok) setError(result.error);
                      else flash(result.message ?? "تم الإرسال");
                    }}
                  >
                    إعادة إرسال رسالة التأكيد
                  </button>
                </>
              )}
              {mode === "forgot" && (
                <button type="button" className="hover:text-foreground" onClick={() => setMode("login")}>
                  العودة لتسجيل الدخول
                </button>
              )}
            </div>
          </div>
        </section>
      </SiteShell>
    );
  }

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const result = await account.updateProfile({ name, phone });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    flash("تم حفظ بيانات الحساب");
  };

  const saveAddress = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const result = await account.updateProfile({ city, district, address });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    flash("تم حفظ العنوان");
  };

  const saveSecurity = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!password.trim()) {
      setError("أدخلي كلمة المرور الجديدة");
      return;
    }
    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }
    const result = await account.changePassword(password);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPassword("");
    setConfirmPassword("");
    flash("تم تحديث كلمة المرور");
  };

  return (
    <SiteShell>
      <section className="px-5 py-12 md:px-10 md:py-16 lg:px-14">
        <div className="mx-auto max-w-[1100px]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-gold">حسابي</p>
              <h1 className="mt-2 text-4xl font-semibold md:text-5xl">
                مرحبًا، {account.customer.name || "عميلة لوما"}
              </h1>
              <p className="mt-3 text-sm text-muted-foreground">{account.customer.email}</p>
              {!account.emailConfirmed && (
                <p className="mt-2 text-sm text-gold">أكّدي بريدك الإلكتروني لتفعيل كل ميزات الحساب.</p>
              )}
            </div>
            <Button variant="ghost" className="shrink-0 gap-2 text-muted-foreground" onClick={() => account.logout()}>
              <LogOut className="size-4" /> تسجيل الخروج
            </Button>
          </div>

          <div className="mt-8 flex gap-2 overflow-x-auto border-b border-border pb-px">
            {tabs.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setTab(item.id);
                    setError("");
                  }}
                  className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm transition-colors ${
                    active
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="size-3.5" strokeWidth={1.5} />
                  {item.label}
                </button>
              );
            })}
          </div>

          {saved && <p className="mt-5 text-sm text-gold">{saved}</p>}
          {error && <p className="mt-5 text-sm text-destructive">{error}</p>}

          {tab === "overview" && (
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setTab("orders")}
                className="border border-border bg-card px-5 py-6 text-right transition-colors hover:border-gold/40"
              >
                <Package className="mb-4 size-5 text-gold" strokeWidth={1.5} />
                <p className="text-2xl font-semibold">{myOrders.length}</p>
                <p className="mt-1 text-sm text-muted-foreground">طلباتي</p>
              </button>
              <button
                type="button"
                onClick={() => setTab("profile")}
                className="border border-border bg-card px-5 py-6 text-right transition-colors hover:border-gold/40"
              >
                <UserRound className="mb-4 size-5 text-gold" strokeWidth={1.5} />
                <p className="text-base font-semibold">{account.customer.name || "بياناتي"}</p>
                <p className="mt-1 text-sm text-muted-foreground">بياناتي</p>
              </button>
              <button
                type="button"
                onClick={() => setTab("address")}
                className="border border-border bg-card px-5 py-6 text-right transition-colors hover:border-gold/40"
              >
                <MapPin className="mb-4 size-5 text-gold" strokeWidth={1.5} />
                <p className="text-base font-semibold">
                  {account.customer.city || account.customer.address ? "مكتمل" : "أضيفي عنوانك"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">عنوان التوصيل</p>
              </button>
            </div>
          )}

          {tab === "profile" && (
            <form className="mt-8 max-w-lg space-y-4" onSubmit={saveProfile}>
              <h2 className="text-lg font-semibold">بيانات الحساب</h2>
              <Input
                className="h-12 rounded-none"
                placeholder="الاسم الكامل"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
              <Input className="h-12 rounded-none bg-secondary" type="email" value={email} readOnly />
              <Input
                className="h-12 rounded-none"
                placeholder="رقم الجوال"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
              <Button type="submit" variant="luxury" size="luxury" className="rounded-none">
                حفظ البيانات
              </Button>
            </form>
          )}

          {tab === "address" && (
            <form className="mt-8 max-w-lg space-y-4" onSubmit={saveAddress}>
              <h2 className="text-lg font-semibold">عنوان التوصيل</h2>
              <Input
                className="h-12 rounded-none"
                placeholder="المدينة"
                value={city}
                onChange={(event) => setCity(event.target.value)}
              />
              <Input
                className="h-12 rounded-none"
                placeholder="الحي"
                value={district}
                onChange={(event) => setDistrict(event.target.value)}
              />
              <Textarea
                className="min-h-28 rounded-none"
                placeholder="العنوان التفصيلي / ملاحظات التوصيل"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
              <Button type="submit" variant="luxury" size="luxury" className="rounded-none">
                حفظ العنوان
              </Button>
            </form>
          )}

          {tab === "security" && (
            <form className="mt-8 max-w-lg space-y-4" onSubmit={saveSecurity}>
              <h2 className="text-lg font-semibold">تغيير كلمة المرور</h2>
              <Input
                className="h-12 rounded-none"
                type="password"
                placeholder="كلمة المرور الجديدة"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
              />
              <Input
                className="h-12 rounded-none"
                type="password"
                placeholder="تأكيد كلمة المرور"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
              />
              <Button type="submit" variant="luxury" size="luxury" className="rounded-none">
                تحديث كلمة المرور
              </Button>
            </form>
          )}

          {tab === "orders" && (
            <div className="mt-8">
              <h2 className="mb-6 text-lg font-semibold">طلباتي</h2>
              {myOrders.length === 0 ? (
                <div className="border border-border px-6 py-14 text-center">
                  <Package className="mx-auto mb-4 size-7 text-muted-foreground" strokeWidth={1.2} />
                  <p className="text-muted-foreground">لا توجد طلبات مرتبطة بهذا الحساب بعد.</p>
                  <Button asChild variant="luxury" size="luxury" className="mt-6 rounded-none">
                    <Link to="/products">تسوّقي المجموعة</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myOrders.map((order) => (
                    <article key={order.id} className="border border-border bg-card px-5 py-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">{order.id}</p>
                        <span className="text-xs text-gold">{order.status}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString("ar-SA")}
                      </p>
                      <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                        {order.items.map((item) => (
                          <li key={`${order.id}-${item.key}`} className="flex justify-between gap-3">
                            <span>
                              {item.name} · {item.label} × {item.quantity}
                            </span>
                            <span>{formatPrice(item.price * item.quantity)}</span>
                          </li>
                        ))}
                      </ul>
                      {order.customerNote && (
                        <p className="mt-3 text-xs text-muted-foreground">ملاحظة: {order.customerNote}</p>
                      )}
                      <div className="mt-4 flex justify-between border-t border-border pt-3 text-sm">
                        <span className="text-muted-foreground">الإجمالي</span>
                        <span className="font-semibold">{formatPrice(order.total)}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
