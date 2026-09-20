import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ProductCard } from "@/components/product-card";
import { SiteShell } from "@/components/site-shell";
import { useSiteStore } from "@/components/site-store-context";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/products/")({
  head: () => ({
    meta: [
      { title: "مجموعة لوما الكاملة | LOMA" },
      {
        name: "description",
        content: "تصفحي مزيلات المكياج ووسادات التنظيف وباقات لوما الكاملة.",
      },
      { property: "og:title", content: "مجموعة لوما الكاملة" },
      {
        property: "og:description",
        content: "كل ما تحتاجينه لروتين تنظيف لطيف وفعّال.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductsPage,
});

const categories = ["الكل", "مزيل المكياج", "الوسادات", "الباقات"] as const;

function ProductsPage() {
  const { products, content } = useSiteStore();
  const [category, setCategory] = useState<(typeof categories)[number]>("الكل");
  const visible =
    category === "الكل" ? products : products.filter((product) => product.category === category);

  return (
    <SiteShell>
      <section className="relative min-h-[54svh] overflow-hidden bg-foreground text-primary-foreground">
        <img
          src={content.images.hero}
          alt="مجموعة لوما الكاملة"
          className="absolute inset-0 size-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-foreground via-foreground/70 to-transparent" />
        <div className="relative mx-auto flex min-h-[54svh] max-w-[1320px] items-end px-5 py-14 md:px-10 md:py-20">
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-semibold text-gold">مجموعة لوما</p>
            <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
              كل ما تحتاجينه
              <br />
              لبشرة أنقى.
            </h1>
            <p className="mt-6 max-w-xl leading-8 text-primary-foreground/75">
              اختاري الحجم المناسب أو اجمعي خطوات العناية في باقة واحدة.
            </p>
          </div>
        </div>
      </section>
      <section className="px-5 py-16 md:px-10 md:py-24 lg:px-14">
        <div className="mx-auto max-w-[1320px]">
          <div className="mb-12 flex gap-2 overflow-x-auto pb-2">
            {categories.map((item) => (
              <Button
                key={item}
                variant={category === item ? "luxury" : "luxuryOutline"}
                className="shrink-0 rounded-none"
                onClick={() => setCategory(item)}
              >
                {item}
              </Button>
            ))}
          </div>
          <div className="grid gap-x-7 gap-y-14 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
