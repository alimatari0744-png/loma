import { useEffect, useRef, useState } from "react";
import { Phone, X } from "lucide-react";
import { useSiteStore } from "@/components/site-store-context";
import { askSupport } from "@/lib/support.functions";
import { phoneHref, supportPhones } from "@/lib/support";

type ChatMessage = { role: "user" | "assistant"; text: string };

const greeting =
  "مرحبًا، أنا مساعدة لوما. اكتبي مشكلتك، مثل سبب تأخر الطلب أو طريقة استخدام المنتج، وسأحاول حلها.";

export function SupportChat() {
  const { content } = useSiteStore();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsHuman, setNeedsHuman] = useState(false);
  const [phones, setPhones] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", text: greeting }]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const localPhones = supportPhones(content.footer.phone);
  const visiblePhones = phones.length ? phones : localPhones;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, needsHuman, open]);

  const send = async (text: string) => {
    const cleaned = text.trim();
    if (!cleaned || busy) return;
    const history = [...messages, { role: "user" as const, text: cleaned }];
    setMessages(history);
    setDraft("");
    setBusy(true);
    try {
      const result = await askSupport({
        data: { messages: history.filter((message) => message.text !== greeting) },
      });
      setPhones(result.phones);
      setNeedsHuman((current) => current || result.needsHuman);
      setMessages((current) => [...current, { role: "assistant", text: result.reply }]);
    } catch {
      setNeedsHuman(true);
      setMessages((current) => [
        ...current,
        { role: "assistant", text: "تعذر إكمال المساعدة الآن. يمكنك التواصل مع الدعم عبر الرقم بالأسفل." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed bottom-5 left-5 z-40 flex flex-col items-start gap-3">
      {open && (
        <section
          className="flex h-[min(32rem,calc(100vh-7rem))] w-[min(22rem,calc(100vw-2.5rem))] flex-col border border-[#e6dcc8] bg-[#fbf8f3] shadow-[0_24px_80px_rgba(68,52,28,0.16)]"
          aria-label="مساعدة العملاء"
        >
          <header className="flex items-start justify-between gap-3 border-b border-[#e6dcc8] px-4 py-3">
            <div>
              <p className="font-brand text-[11px] text-gold">LOMA</p>
              <h2 className="text-sm font-medium">مساعدة العملاء</h2>
            </div>
            <button
              type="button"
              className="grid size-8 place-items-center text-muted-foreground hover:text-foreground"
              aria-label="إغلاق المساعدة"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" strokeWidth={1.25} />
            </button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((message, index) => (
              <p
                key={`${message.role}-${index}`}
                className={`max-w-[90%] px-3 py-2 text-[13px] leading-6 ${
                  message.role === "user"
                    ? "mr-0 ml-auto bg-foreground text-primary-foreground"
                    : "ml-0 mr-auto bg-white text-foreground"
                }`}
              >
                {message.text}
              </p>
            ))}
            {busy && <p className="ml-auto text-[12px] text-muted-foreground">جارٍ البحث عن حل…</p>}
            {needsHuman && (
              <div className="border border-[#e6dcc8] bg-white px-3 py-3">
                <p className="text-[13px] leading-6">إذا بقيت المشكلة، تواصلي مع الدعم الفني:</p>
                {visiblePhones.length ? (
                  <div className="mt-3 grid gap-2">
                    {visiblePhones.map((phone) => (
                      <a
                        key={phone}
                        href={phoneHref(phone)}
                        className="inline-flex h-10 items-center justify-center gap-2 border border-foreground bg-foreground px-3 text-[13px] text-primary-foreground"
                      >
                        <Phone className="size-3.5" strokeWidth={1.5} />
                        {phone}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-[12px] text-muted-foreground">
                    رقم الدعم غير مضاف بعد في لوحة التحكم.
                  </p>
                )}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <form
            className="border-t border-[#e6dcc8] p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void send(draft);
            }}
          >
            {!needsHuman && (
              <button
                type="button"
                className="mb-2 text-[12px] text-muted-foreground underline-offset-4 hover:underline"
                onClick={() => setNeedsHuman(true)}
              >
                لم تُحل مشكلتي
              </button>
            )}
            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="اكتبي مشكلتك"
                className="h-11 min-w-0 flex-1 border border-input bg-white px-3 text-sm outline-none"
                maxLength={600}
              />
              <button
                type="submit"
                disabled={busy || !draft.trim()}
                className="h-11 shrink-0 bg-foreground px-4 text-[13px] text-primary-foreground disabled:opacity-50"
              >
                إرسال
              </button>
            </div>
          </form>
        </section>
      )}
      <button
        type="button"
        className="h-12 bg-foreground px-5 text-[13px] text-primary-foreground shadow-[0_12px_40px_rgba(68,52,28,0.18)]"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? "إغلاق المساعدة" : "مساعدة العملاء"}
      </button>
    </div>
  );
}
