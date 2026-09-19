import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-context";
import { formatPrice, type Product } from "@/lib/products";

export function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { changeQuantity } = useCart();
  const defaultKey = product.variants?.[0]?.id ?? product.id;

  return (
    <article className="group relative min-w-0">
      <div className={`relative overflow-hidden bg-secondary ${compact ? "aspect-[3/4]" : "aspect-[4/5]"}`}>
        <Link to="/products/$id" params={{ id: String(product.id) }} className="block">
          <img src={product.image} alt={`${product.name} ${product.size}`} className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]" />
          {product.badge && <span className="absolute right-4 top-4 bg-foreground px-4 py-2 text-[10px] text-primary-foreground">{product.badge}</span>}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="absolute bottom-3 left-3 size-10 bg-transparent p-0 text-foreground hover:bg-transparent hover:text-gold focus-visible:bg-transparent"
          aria-label={`أضيفي ${product.name} إلى السلة`}
          onClick={() => changeQuantity(defaultKey, 1)}
        >
          <ShoppingBag className="size-5 drop-shadow-sm" />
        </Button>
      </div>
      <Link to="/products/$id" params={{ id: String(product.id) }} className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 py-5">
        <div className="min-w-0">
          <h3 className="font-medium">{product.name}</h3>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{product.note}</p>
        </div>
        <span className="shrink-0 text-sm font-medium text-gold">{formatPrice(product.price)}</span>
      </Link>
    </article>
  );
}
