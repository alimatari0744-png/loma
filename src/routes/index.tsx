import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { BrandSymbol, SiteShell } from "@/components/site-shell";
import { products } from "@/lib/products";
import heroImage from "@/assets/loma-hero-premium.jpg";
import padsImage from "@/assets/loma-product-pads.jpg";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "LOMA | عناية راقية لبشرة نقية" },
    { name: "description", content: "اكتشفي مجموعة لوما لإزالة المكياج بلطف وروتين العناية الهادئ." },
    { property: "og:title", content: "LOMA | عناية راقية لبشرة نقية" },
    { property: "og:description", content: "تنظيف فعّال ولطيف، صُمم لراحة البشرة حتى حول العينين." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }), component: HomePage,
});

function HomePage() {
  const railRef = useRef<HTMLDivElement>(null);
  const scrollProducts = (direction: number) => {
    const rail = railRef.current;
    if (!rail) return;
    const amount = Math.min(rail.clientWidth * 0.55, 420);
    rail.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  return <SiteShell>
    <section className="mx-auto grid max-w-[1440px] md:min-h-[calc(100svh-104px)] md:grid-cols-[0.9fr_1.1fr]">
      <div className="order-2 flex items-center px-6 py-14 md:order-1 md:px-10 lg:px-20"><div className="max-w-xl"><div className="mb-6 flex items-center gap-3 text-[11px] font-semibold text-gold md:text-xs"><span className="h-px w-10 bg-gold" />LOMA SKINCARE</div><h1 className="text-[clamp(2.75rem,5.5vw,5.6rem)] font-semibold leading-[1.18]">جمالٌ يبدأ<br />من النقاء</h1><p className="mt-6 max-w-lg text-[15px] font-light leading-8 text-muted-foreground md:mt-8 md:text-lg md:leading-9">عناية يومية تزيل المكياج بلطف وفعالية، لتترك بشرتك نظيفة وهادئة بلا عطر أو أثر دهني.</p><div className="mt-8 flex flex-wrap gap-3 md:mt-10"><Button asChild variant="luxury" size="luxury" className="group rounded-none px-8"><Link to="/products">تسوّقي المجموعة <ArrowLeft className="transition-transform group-hover:-translate-x-1" /></Link></Button></div><div className="mt-10 grid max-w-lg grid-cols-2 gap-6 border-t border-border pt-7 text-sm text-muted-foreground md:mt-14"><div><strong className="mb-1 block text-base font-medium text-foreground">لطيف على البشرة</strong>مناسب للعناية اليومية</div><div><strong className="mb-1 block text-base font-medium text-foreground">تنظيف فعّال</strong>حتى للمكياج المقاوم للماء</div></div></div></div>
      <div className="order-1 min-h-[62svh] overflow-hidden bg-secondary md:order-2 md:min-h-0"><img src={heroImage} alt="مجموعة لوما لمزيل المكياج والوسادات القطنية" className="size-full object-cover object-center" /></div>
    </section>

    <section className="bg-card px-5 py-20 md:px-10 md:py-28 lg:px-14"><div className="mx-auto max-w-[1320px]"><div className="mb-10 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-6"><div className="min-w-0"><p className="mb-3 text-xs font-semibold text-gold">مجموعة لوما</p><h2 className="text-3xl font-semibold md:text-5xl">أساسيات العناية اليومية</h2></div><div className="flex shrink-0 items-center gap-2"><Button variant="luxuryOutline" size="icon" className="rounded-none" onClick={() => scrollProducts(1)} aria-label="المنتجات السابقة"><ArrowRight /></Button><Button variant="luxuryOutline" size="icon" className="rounded-none" onClick={() => scrollProducts(-1)} aria-label="المنتجات التالية"><ArrowLeft /></Button></div></div><div ref={railRef} className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-6 sm:gap-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{products.slice(0, 6).map((product) => <div key={product.id} className="w-[calc(50%-6px)] shrink-0 snap-start sm:w-[min(42vw,240px)] md:w-[31%] md:max-w-none"><ProductCard product={product} compact /></div>)}<Link to="/products" className="group flex aspect-[3/4] w-[calc(50%-6px)] shrink-0 snap-start flex-col items-center justify-center px-4 text-center sm:w-[min(42vw,240px)] sm:px-8 md:w-[31%]"><span className="mb-4 grid size-11 place-items-center rounded-full border border-gold text-gold sm:mb-6 sm:size-14"><ArrowLeft /></span><span className="text-lg font-semibold sm:text-2xl">المزيد من لوما</span><span className="mt-2 text-xs leading-6 text-muted-foreground sm:mt-3 sm:text-sm sm:leading-7">شاهدي المجموعة الكاملة والباقات</span></Link></div></div></section>

    <section className="grid bg-secondary md:grid-cols-2"><div className="relative min-h-[520px] md:min-h-[700px]"><img src={padsImage} alt="وسادات لوما القطنية" className="absolute inset-0 size-full object-cover" /></div><div className="flex items-center px-6 py-16 md:px-14 lg:px-24"><div className="max-w-xl"><p className="mb-4 text-xs font-semibold text-gold">روتين لوما</p><h2 className="text-4xl font-semibold leading-tight md:text-5xl">خطوتان.<br />وشعور أنقى.</h2><div className="mt-10 divide-y divide-border border-y border-border"><div className="grid grid-cols-[52px_1fr] gap-4 py-7"><span className="font-brand text-2xl text-gold">01</span><div><h3 className="font-medium">أزيلي المكياج بلطف</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">ضعي الميسيلار على الوسادة ومرّريها بهدوء على الوجه والعينين.</p></div></div><div className="grid grid-cols-[52px_1fr] gap-4 py-7"><span className="font-brand text-2xl text-gold">02</span><div><h3 className="font-medium">اغسلي وأعيدي الاستخدام</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">اغسلي الوسادة واتركيها لتجف لتكون جاهزة لروتينك التالي.</p></div></div></div><Button asChild variant="luxuryOutline" className="mt-8 rounded-none"><Link to="/ritual">اكتشفي الروتين كاملًا <ArrowLeft /></Link></Button></div></div></section>

    <section className="bg-foreground px-5 py-20 text-primary-foreground md:px-10 md:py-28 lg:px-14"><div className="mx-auto grid max-w-[1320px] gap-12 md:grid-cols-[0.85fr_1.15fr] md:items-center md:gap-20"><div><p className="mb-4 text-xs font-semibold text-gold">العناية كما يجب أن تكون</p><h2 className="text-4xl font-semibold leading-tight md:text-5xl">فعّالة في التنظيف.<br />هادئة على البشرة.</h2><Button asChild variant="luxuryOutline" className="mt-8 rounded-none border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground hover:text-foreground"><Link to="/about">تعرّفي إلى لوما <ArrowLeft /></Link></Button></div><div className="grid gap-px bg-primary-foreground/15 sm:grid-cols-2">{["بدون عطر", "مناسب للبشرة الحساسة", "لطيف حول العينين", "إحساس نظيف بلا لزوجة"].map((item) => <div key={item} className="flex min-h-28 items-center gap-4 bg-foreground px-6 py-5"><span className="grid size-8 shrink-0 place-items-center rounded-full border border-gold text-gold"><Check className="size-4" /></span><span className="text-sm">{item}</span></div>)}</div></div></section>
    <section className="bg-background px-5 py-20 text-center md:py-28"><BrandSymbol className="mx-auto mb-6 size-10" /><h2 className="text-3xl font-semibold leading-tight md:text-5xl">اجعلي النقاء أول خطوة<br />في روتينك.</h2><Button asChild variant="luxury" size="luxury" className="mt-8 rounded-none px-10"><Link to="/products">تسوّقي LOMA <ArrowLeft /></Link></Button></section>
  </SiteShell>;
}