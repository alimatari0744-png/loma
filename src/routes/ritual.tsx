import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Droplets, Sparkles } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { useSiteStore } from "@/components/site-store-context";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/ritual")({
  head: () => ({
    meta: [
      { title: "روتين لوما | خطوتان لبشرة أنقى" },
      {
        name: "description",
        content: "تعرفي إلى طريقة استخدام مزيل لوما والوسادات القطنية لروتين تنظيف يومي لطيف.",
      },
      { property: "og:title", content: "روتين لوما اليومي" },
      {
        property: "og:description",
        content: "خطوتان بسيطتان لتنظيف فعّال وهادئ على البشرة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RitualPage,
});

function RitualPage() {
  const { content } = useSiteStore();
  const resultTitle = content.ritual.resultTitle.split("\n");

  return (
    <SiteShell>
      <section className="grid min-h-[72svh] bg-secondary md:grid-cols-2">
        <div className="relative min-h-[55svh]">
          <img
            src={content.images.ritualPads}
            alt="روتين لوما والوسادات القطنية"
            className="absolute inset-0 size-full object-cover"
          />
        </div>
        <div className="flex items-center px-6 py-16 md:px-14 lg:px-24">
          <div className="max-w-xl">
            <p className="mb-4 text-xs font-semibold text-gold">{content.ritual.kicker}</p>
            <h1 className="text-5xl font-semibold leading-tight md:text-7xl">
              {content.ritual.title}
              <br />
              {content.ritual.titleLine2}
            </h1>
            <p className="mt-7 text-base leading-8 text-muted-foreground">{content.ritual.intro}</p>
          </div>
        </div>
      </section>

      <section className="px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-[1120px]">
          <div className="mb-14 text-center">
            <p className="mb-3 text-xs font-semibold text-gold">{content.ritual.methodKicker}</p>
            <h2 className="text-3xl font-semibold md:text-5xl">{content.ritual.methodTitle}</h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="border-t border-border py-8">
              <span className="font-brand text-3xl text-gold">01</span>
              <Droplets className="mt-10 size-8 text-gold" strokeWidth={1.2} />
              <h3 className="mt-6 text-2xl font-semibold">{content.ritual.step1Title}</h3>
              <p className="mt-4 leading-8 text-muted-foreground">{content.ritual.step1Text}</p>
            </div>
            <div className="border-t border-border py-8">
              <span className="font-brand text-3xl text-gold">02</span>
              <Sparkles className="mt-10 size-8 text-gold" strokeWidth={1.2} />
              <h3 className="mt-6 text-2xl font-semibold">{content.ritual.step2Title}</h3>
              <p className="mt-4 leading-8 text-muted-foreground">{content.ritual.step2Text}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid bg-foreground text-primary-foreground md:grid-cols-2">
        <div className="flex items-center px-6 py-16 md:px-14 lg:px-24">
          <div>
            <p className="mb-4 text-xs font-semibold text-gold">{content.ritual.resultKicker}</p>
            <h2 className="text-4xl font-semibold leading-tight md:text-5xl">
              {resultTitle[0]}
              <br />
              {resultTitle[1] ?? ""}
            </h2>
            <div className="mt-9 space-y-5">
              {content.ritual.resultItems.map((item) => (
                <div key={item} className="flex items-center gap-4">
                  <Check className="size-5 text-gold" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <Button
              asChild
              variant="luxuryOutline"
              className="mt-10 rounded-none border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground hover:text-foreground"
            >
              <Link to="/products">
                {content.ritual.cta} <ArrowLeft />
              </Link>
            </Button>
          </div>
        </div>
        <div className="min-h-[520px]">
          <img
            src={content.images.ritualBottle}
            alt="مزيل ميسيلار لوما"
            className="size-full object-cover"
          />
        </div>
      </section>
    </SiteShell>
  );
}
