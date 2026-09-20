import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check } from "lucide-react";
import { BrandSymbol, SiteShell } from "@/components/site-shell";
import { useSiteStore } from "@/components/site-store-context";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "عن لوما | عناية هادئة وواضحة" },
      {
        name: "description",
        content:
          "بدأت لوما من فكرة بسيطة: أن تصبح العناية بالبشرة طقسًا يوميًا من النقاء والهدوء.",
      },
      { property: "og:title", content: "عن لوما" },
      {
        property: "og:description",
        content:
          "صُممت لوما لتمنح البشرة تجربة تنظيف لطيفة وفعّالة، مع عناية تمتد إلى كل تفصيلة في المنتج.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { content } = useSiteStore();
  const promiseTitle = content.about.promiseTitle.split("\n");

  return (
    <SiteShell>
      <section className="grid min-h-[72svh] md:grid-cols-2">
        <div className="flex items-center px-6 py-16 md:px-14 lg:px-24">
          <div className="max-w-xl">
            <p className="mb-4 text-xs font-semibold text-gold">{content.about.kicker}</p>
            <h1 className="text-5xl font-semibold leading-tight md:text-7xl">
              {content.about.title}
              <br />
              {content.about.titleLine2}
            </h1>
            <p className="mt-7 text-base leading-8 text-muted-foreground">{content.about.intro}</p>
          </div>
        </div>
        <div className="min-h-[55svh]">
          <img src={content.images.hero} alt="منتجات لوما للعناية بالبشرة" className="size-full object-cover" />
        </div>
      </section>

      <section className="bg-card px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto grid max-w-[1200px] gap-12 md:grid-cols-[0.8fr_1.2fr] md:gap-20">
          <div>
            <BrandSymbol className="mb-6 size-12" />
            <h2 className="text-3xl font-semibold leading-tight md:text-5xl">
              {content.about.sectionTitle}
              <br />
              {content.about.sectionTitleLine2}
            </h2>
          </div>
          <div className="space-y-7 text-base leading-9 text-muted-foreground">
            <p>{content.about.p1}</p>
            <p>{content.about.p2}</p>
            <p>{content.about.p3}</p>
          </div>
        </div>
      </section>

      <section className="grid bg-secondary md:grid-cols-2">
        <div className="min-h-[520px]">
          <img src={content.images.ritualPads} alt="وسادات لوما القطنية" className="size-full object-cover" />
        </div>
        <div className="flex items-center px-6 py-16 md:px-14 lg:px-24">
          <div className="w-full">
            <p className="mb-4 text-xs font-semibold text-gold">{content.about.promiseKicker}</p>
            <h2 className="text-4xl font-semibold leading-tight md:text-5xl">
              {promiseTitle[0]}
              <br />
              {promiseTitle[1] ?? ""}
            </h2>
            <div className="mt-10 divide-y divide-border border-y border-border">
              {content.about.promiseItems.map((item) => (
                <div key={item} className="flex items-center gap-4 py-5">
                  <Check className="size-5 shrink-0 text-gold" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <Button asChild variant="luxury" size="luxury" className="mt-9 rounded-none">
              <Link to="/products">
                اكتشفي المجموعة <ArrowLeft />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
