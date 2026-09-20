import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check } from "lucide-react";
import { BrandSymbol, SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/loma-hero-premium.jpg";
import padsImage from "@/assets/loma-product-pads.jpg";

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
  return (
    <SiteShell>
      <section className="grid min-h-[72svh] md:grid-cols-2">
        <div className="flex items-center px-6 py-16 md:px-14 lg:px-24">
          <div className="max-w-xl">
            <p className="mb-4 text-xs font-semibold text-gold">عن لوما</p>
            <h1 className="text-5xl font-semibold leading-tight md:text-7xl">
              بدأت لوما من
              <br />
              فكرة بسيطة.
            </h1>
            <p className="mt-7 text-base leading-8 text-muted-foreground">
              أن تصبح العناية بالبشرة طقسًا يوميًا من النقاء والهدوء.
            </p>
          </div>
        </div>
        <div className="min-h-[55svh]">
          <img src={heroImage} alt="منتجات لوما للعناية بالبشرة" className="size-full object-cover" />
        </div>
      </section>

      <section className="bg-card px-5 py-20 md:px-10 md:py-28">
        <div className="mx-auto grid max-w-[1200px] gap-12 md:grid-cols-[0.8fr_1.2fr] md:gap-20">
          <div>
            <BrandSymbol className="mb-6 size-12" />
            <h2 className="text-3xl font-semibold leading-tight md:text-5xl">
              تجربة واحدة
              <br />
              متناسقة.
            </h2>
          </div>
          <div className="space-y-7 text-base leading-9 text-muted-foreground">
            <p>
              صُممت لوما لتمنح البشرة تجربة تنظيف لطيفة وفعّالة، مع عناية تمتد إلى كل تفصيلة في
              المنتج.
            </p>
            <p>
              من تركيبة المزيل، إلى ملمس قطن لوما الناعم، وصولًا إلى التصميم والتغليف الداخلي
              والخارجي؛ حرصنا على أن تتكامل جميع العناصر لتصنع تجربة واحدة متناسقة.
            </p>
            <p>
              اخترنا لكل تفصيلة مكانها، ولكل عنصر وظيفته، لأننا نؤمن أن الجمال الحقيقي لا يكمن في
              المظهر وحده، بل في العناية التي تقف خلفه.
            </p>
          </div>
        </div>
      </section>

      <section className="grid bg-secondary md:grid-cols-2">
        <div className="min-h-[520px]">
          <img src={padsImage} alt="وسادات لوما القطنية" className="size-full object-cover" />
        </div>
        <div className="flex items-center px-6 py-16 md:px-14 lg:px-24">
          <div className="w-full">
            <p className="mb-4 text-xs font-semibold text-gold">وعد لوما</p>
            <h2 className="text-4xl font-semibold leading-tight md:text-5xl">
              فعّالة في التنظيف.
              <br />
              هادئة على البشرة.
            </h2>
            <div className="mt-10 divide-y divide-border border-y border-border">
              {[
                "تركيبات بلا عطر",
                "لطافة حول منطقة العين",
                "إزالة فعّالة للمكياج",
                "ملمس نظيف وغير دهني",
              ].map((item) => (
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
