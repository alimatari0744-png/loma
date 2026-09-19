import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { SiteShell } from "@/components/site-shell";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-context";
import { formatPrice, getProduct, products } from "@/lib/products";

export const Route = createFileRoute("/products/$id")({
  loader: ({ params }) => {
    const product = getProduct(Number(params.id));
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ title: "المنتج غير متوفر | LOMA" }, { name: "robots", content: "noindex" }] };
    const { product } = loaderData;
    const title = `${product.name} — ${product.size} | LOMA`;
    return {
      meta: [
        { title },
        { name: "description", content: product.description.slice(0, 155) },
        { property: "og:title", content: title },
        { property: "og:description", content: product.description.slice(0, 155) },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  notFoundComponent: ProductMissing,
  component: ProductDetail,
});

function ProductMissing() {
  return (
    <SiteShell>
      <section className="mx-auto grid min-h-[60svh] max-w-[1320px] place-items-center px-5 text-center">
        <div>
          <h1 className="text-3xl font-semibold">هذا المنتج غير متوفر</h1>
          <p className="mt-4 text-muted-foreground">يمكنك تصفح بقية مجموعة لوما.</p>
          <Button asChild variant="luxury" size="luxury" className="mt-8"><Link to="/products">عودة إلى المجموعة</Link></Button>
        </div>
      </section>
    </SiteShell>
  );
}

function ProductDetail() {
  const { product } = Route.useLoaderData();
  const { changeQuantity } = useCart();
  const [variantId, setVariantId] = useState(product.variants?.[0]?.id ?? product.id);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [added, setAdded] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const variant = product.variants?.find((item) => item.id === variantId);
  const price = variant?.price ?? product.price;
  const related = products.filter((item) => item.id !== product.id).slice(0, 3);
  const gallery = product.gallery.length > 0 ? product.gallery : [product.image];
  const activeImage = gallery[activeImageIndex] ?? product.image;

  const showPreviousImage = () => setActiveImageIndex((current) => (current - 1 + gallery.length) % gallery.length);
  const showNextImage = () => setActiveImageIndex((current) => (current + 1) % gallery.length);

  const handleTouchEnd = (endX: number) => {
    if (touchStartX.current === null) return;
    const distance = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(distance) < 45) return;
    if (distance < 0) showNextImage();
    else showPreviousImage();
  };

  const addToCart = () => {
    changeQuantity(variantId, quantity);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  };

  return (
    <SiteShell>
      <section className="px-5 pb-16 pt-8 md:px-10 md:pb-24 md:pt-12 lg:px-14">
        <div className="mx-auto max-w-[1320px]">
          <nav className="mb-8 flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">الرئيسية</Link><span>/</span>
            <Link to="/products" className="hover:text-foreground">المجموعة</Link><span>/</span>
            <span className="text-foreground">{product.name}</span>
          </nav>

          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="relative aspect-[4/5] touch-pan-y overflow-hidden bg-secondary" onTouchStart={(event) => { touchStartX.current = event.touches[0]?.clientX ?? null; }} onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}>
                <img src={activeImage} alt={product.name} className="size-full object-cover" />
                {product.badge && <span className="absolute right-5 top-5 bg-foreground px-4 py-2 text-[10px] text-primary-foreground">{product.badge}</span>}
                 {gallery.length > 1 && <><Button type="button" variant="secondary" size="icon" onClick={showPreviousImage} className="absolute right-4 top-1/2 size-10 -translate-y-1/2 rounded-full border border-border/70 bg-background/80 shadow-sm backdrop-blur-sm" aria-label="الصورة السابقة"><ChevronRight /></Button><Button type="button" variant="secondary" size="icon" onClick={showNextImage} className="absolute left-4 top-1/2 size-10 -translate-y-1/2 rounded-full border border-border/70 bg-background/80 shadow-sm backdrop-blur-sm" aria-label="الصورة التالية"><ChevronLeft /></Button><div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2" aria-label={`الصورة ${activeImageIndex + 1} من ${gallery.length}`}>{gallery.map((image, index) => <span key={image} className={`size-1.5 rounded-full ${activeImageIndex === index ? "bg-foreground" : "bg-background/70"}`} />)}</div></>}
              </div>
              {gallery.length > 1 && (
                <div className="mt-4 flex gap-3">
                  {gallery.map((image, index) => (
                    <button key={image} type="button" onClick={() => setActiveImageIndex(index)} className={`size-20 overflow-hidden border ${activeImageIndex === index ? "border-foreground" : "border-border"}`} aria-label={`عرض صورة المنتج ${index + 1}`}>
                      <img src={image} alt="" className="size-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:pt-4">
              <p className="text-xs font-semibold text-gold">{product.category}</p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight md:text-5xl">{product.name}</h1>
              <p className="mt-3 text-muted-foreground">{product.size}</p>
              <p className="mt-6 text-2xl font-semibold">{formatPrice(price)}</p>
              <p className="mt-6 leading-8 text-muted-foreground">{product.description}</p>

              {product.variants && (
                <div className="mt-8">
                  <p className="mb-3 text-sm font-medium">{product.variantLabel ?? "الخيارات"}</p>
                  <div className="flex flex-wrap gap-3">
                    {product.variants.map((item) => (
                      <button key={item.id} type="button" onClick={() => setVariantId(item.id)} className={`border px-5 py-3 text-sm transition-colors ${variantId === item.id ? "border-foreground bg-foreground text-primary-foreground" : "border-border hover:border-foreground"}`}>
                        {item.label} — {formatPrice(item.price)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <div className="flex items-center border border-border">
                  <Button variant="ghost" size="icon" className="size-11 rounded-none" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="تقليل الكمية"><Minus /></Button>
                  <span className="w-10 text-center">{quantity}</span>
                  <Button variant="ghost" size="icon" className="size-11 rounded-none" onClick={() => setQuantity((value) => value + 1)} aria-label="زيادة الكمية"><Plus /></Button>
                </div>
                <Button variant="luxury" size="luxury" className="min-w-[220px] flex-1" onClick={addToCart}>
                  {added ? <><Check className="ml-2 size-4" /> أُضيف إلى السلة</> : `أضيفي إلى السلة — ${formatPrice(price * quantity)}`}
                </Button>
              </div>

              <div className="mt-10 grid gap-8 border-t border-border pt-8 sm:grid-cols-2">
                <div>
                  <h2 className="mb-3 text-sm font-semibold">محتويات المنتج</h2>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {product.contents.map((item) => <li key={item} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-gold" />{item}</li>)}
                  </ul>
                </div>
                <div>
                  <h2 className="mb-3 text-sm font-semibold">لماذا لوما</h2>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {product.highlights.map((item) => <li key={item} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-gold" />{item}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-20 border-t border-border pt-14">
            <h2 className="mb-10 text-2xl font-semibold">قد يعجبك أيضًا</h2>
            <div className="grid gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => <ProductCard key={item.id} product={item} />)}
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
