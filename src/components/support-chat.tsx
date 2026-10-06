import { useEffect, useRef, useState } from "react";
import { Headset, Phone, X } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";
import { useCustomerAccount } from "@/components/customer-account-context";
import { useSiteStore } from "@/components/site-store-context";
import { askSupport, loadAssistantChat, saveAssistantChat } from "@/lib/support.functions";
import { phoneHref, supportPhones } from "@/lib/support";
import { getSupabase } from "@/lib/supabase";

type ChatMessage = { role: "user" | "assistant"; text: string };

const greeting = "مرحبًا، أنا لوما. اسأليني عن المنتجات وسأساعدكِ في الاختيار والاستخدام، أو عن حالة طلبك.";

async function sessionToken() {
  const { data } = await getSupabase().auth.getSession();
  return data.session?.access_token ?? "";
}

function suggestionsFor(pathname: string, productName?: string) {
  if (/^\/products\/\d+/.test(pathname)) {
    const name = productName || "هذا المنتج";
    return [
      `مما صُنع ${name}؟`,
      `كيف أستخدم ${name}؟`,
      "هل يناسب البشرة الحساسة وحول العين؟",
      "متى يصل إذا طلبته اليوم؟",
    ];
  }
  if (pathname.startsWith("/products")) {
    return [
      "أي حجم أختار؟",
      "ماذا تحتوي الباقات؟",
      "هل الوسادات تُغسل وتُستخدم مجددًا؟",
      "كيف أفرّق بين المنتجات؟",
    ];
  }
  if (pathname.startsWith("/ritual")) {
    return [
      "كيف أزيل المكياج بالوسادة؟",
      "هل أفرك منطقة العين؟",
      "كم مرة أغسل الوسادة؟",
      "هل أغسل وجهي بعد الميسيلار؟",
    ];
  }
  if (pathname.startsWith("/about")) {
    return ["كيف أتواصل مع الدعم؟", "من أين يُشحن الطلب؟", "هل التركيبة بدون عطر؟", "ما الذي يميز لوما؟"];
  }
  if (pathname.startsWith("/account")) {
    return ["أين حالة طلبي؟", "لماذا تأخر الشحن؟", "لم أستطع تسجيل الدخول", "كيف أعدّل عنوان التوصيل؟"];
  }
  return [
    "لماذا تأخر طلبي؟",
    "كيف أطلب من الموقع؟",
    "ما الفرق بين عبوة 100 مل و50 مل؟",
    "هل المزيل لطيف على البشرة الحساسة؟",
  ];
}

function ProblemStrip({
  items,
  disabled,
  onPick,
}: {
  items: string[];
  disabled: boolean;
  onPick: (text: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div
      className="mb-2 flex touch-pan-x gap-1.5 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      aria-label="مشاكل مقترحة"
    >
      {items.map((item) => (
        <button
          key={item}
          type="button"
          disabled={disabled}
          onClick={() => onPick(item)}
          className="h-7 shrink-0 rounded-full bg-white/80 px-3 text-[12px] text-muted-foreground ring-1 ring-[#eadfcd] disabled:opacity-50"
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export function SupportChat() {
  const { content, products } = useSiteStore();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const account = useCustomerAccount();
  const logo = content.images.logo;
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [phones, setPhones] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", text: greeting }]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const localPhones = supportPhones(content.footer.phone);
  const visiblePhones = phones.length ? phones : localPhones;
  const userTurns = messages.filter((message) => message.role === "user").length;
  const canEscalate = userTurns >= 2;
  const productMatch = pathname.match(/^\/products\/(\d+)/);
  const productName = productMatch
    ? products.find((product) => product.id === Number(productMatch[1]))?.name
    : undefined;
  const suggestions = suggestionsFor(pathname, productName);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, supportOpen, open]);

  useEffect(() => {
    if (!account.ready) return;
    if (!account.customer) {
      setMessages([{ role: "assistant", text: greeting }]);
      setSupportOpen(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const token = await sessionToken();
      if (!token || cancelled) return;
      const result = await loadAssistantChat({ data: { accessToken: token } });
      if (cancelled) return;
      setMessages(
        result.messages.length
          ? [{ role: "assistant", text: greeting }, ...result.messages]
          : [{ role: "assistant", text: greeting }],
      );
      setSupportOpen(false);
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [account.ready, account.customer?.id]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const send = async (text: string) => {
    const cleaned = text.trim();
    if (!cleaned || busy) return;
    const history = [...messages, { role: "user" as const, text: cleaned }];
    setMessages(history);
    setDraft("");
    setSupportOpen(false);
    setBusy(true);
    const token = account.customer ? await sessionToken() : "";
    try {
      const result = await askSupport({
        data: {
          messages: history.filter((message) => message.text !== greeting),
          accessToken: token,
        },
      });
      setPhones(result.phones);
      const next = [...history, { role: "assistant" as const, text: result.reply }];
      setMessages(next);
      if (token) {
        await saveAssistantChat({
          data: { accessToken: token, messages: next.filter((message) => message.text !== greeting) },
        });
      }
    } catch {
      setMessages((current) => [
        ...current,
        { role: "assistant", text: "تعذر إكمال الرد الآن. يمكنك الضغط على «لم تُحل مشكلتي» للتواصل مع الدعم الفني." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {open && (
        <section className="fixed inset-0 z-50 flex flex-col bg-[#fbf8f3]" dir="rtl" aria-label="لوما">
          <header className="relative flex h-16 items-center justify-end border-b border-[#e6dcc8] px-4">
            <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-3">
              <img src={logo} alt="" className="size-11 object-contain" />
              <h2 className="font-brand text-lg tracking-[0.16em]">LOMA</h2>
            </div>
            <button
              type="button"
              className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-white hover:text-foreground"
              aria-label="إغلاق"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" strokeWidth={1.5} />
            </button>
          </header>
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden">
            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-6">
              {messages.map((message, index) => (
                <p
                  key={`${message.role}-${index}`}
                  className={`max-w-[85%] px-4 py-3 text-sm leading-7 shadow-[0_8px_24px_rgba(70,52,24,0.05)] ${
                    message.role === "user"
                      ? "mr-0 ml-auto rounded-[1.35rem] rounded-br-md bg-foreground text-primary-foreground"
                      : "ml-0 mr-auto rounded-[1.35rem] rounded-bl-md bg-white text-foreground"
                  }`}
                >
                  {message.text}
                </p>
              ))}
              {busy && <p className="text-[13px] text-muted-foreground">جارٍ الرد…</p>}
              {canEscalate && supportOpen && (
                <div className="ml-0 mr-auto max-w-[85%] rounded-[1.35rem] rounded-bl-md bg-white px-4 py-4 text-sm leading-7 text-foreground shadow-[0_8px_24px_rgba(70,52,24,0.05)]">
                  <p>
                    {visiblePhones.length
                      ? `نأسف أن المشكلة لم تُحل بعد. فريق الدعم الفني في لوما جاهز لإكمال المساعدة معك، ويمكنك التواصل معه مباشرة عبر ${visiblePhones.length > 1 ? "الأرقام التالية:" : "الرقم التالي:"}`
                      : "نأسف أن المشكلة لم تُحل بعد. فريق الدعم الفني في لوما جاهز لإكمال المساعدة معك."}
                  </p>
                  {visiblePhones.length ? (
                    <div className="mt-3 grid gap-2">
                      {visiblePhones.map((phone) => (
                        <a
                          key={phone}
                          href={phoneHref(phone)}
                          dir="ltr"
                          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#e6dcc8] bg-[#fbf8f3] px-4 text-sm text-foreground"
                        >
                          <Phone className="size-3.5" strokeWidth={1.5} />
                          {phone}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
                      رقم الدعم الفني غير مضاف حاليًا في لوحة التحكم.
                    </p>
                  )}
                </div>
              )}
              <div ref={bottomRef} />
            </div>
            <form
              className="border-t border-[#e6dcc8] px-5 py-4"
              onSubmit={(event) => {
                event.preventDefault();
                void send(draft);
              }}
            >
              {canEscalate && !supportOpen && (
                <button
                  type="button"
                  disabled={busy}
                  className="mb-3 text-[13px] text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
                  onClick={() => setSupportOpen(true)}
                >
                  لم تُحل مشكلتي
                </button>
              )}
              <ProblemStrip items={suggestions} disabled={busy} onPick={(text) => void send(text)} />
              <div className="flex gap-2">
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="اكتبي سؤالك"
                  className="h-11 min-w-0 flex-1 rounded-full border border-input bg-white px-4 text-sm outline-none"
                  maxLength={600}
                />
                <button
                  type="submit"
                  disabled={busy || !draft.trim()}
                  className="h-11 shrink-0 rounded-full bg-foreground px-5 text-sm text-primary-foreground disabled:opacity-50"
                >
                  إرسال
                </button>
              </div>
            </form>
          </div>
        </section>
      )}
      {!open && (
        <button
          type="button"
          className="fixed bottom-5 left-5 z-40 bg-transparent p-1 text-[#6d4a24] drop-shadow-[0_1px_1px_rgba(251,248,243,0.9)] transition-opacity hover:opacity-70"
          aria-label="الدعم الفني"
          onClick={() => setOpen(true)}
        >
          <Headset className="size-6" strokeWidth={1.75} />
        </button>
      )}
    </>
  );
}
