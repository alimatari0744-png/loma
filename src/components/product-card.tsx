import { useState, type MouseEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Check, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-context";
import { formatPrice, type Product } from "@/lib/products";

export function ProductCard({ product, compact = false }: { product: Product; compact?: boolean }) {
  const { changeQuantity } = useCart();
  const defaultKey = product.variants?.[0]?.id ?? product.id;
  const [added, setAdded] = useState(false);

  const addToCart = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    changeQuantity(defaultKey, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  };

  return (
    <article className="group relative min-w-0">
      <div className={`relative overflow-hidden rounded-[1.35rem] bg-secondary ${compact ? "aspect-[3/4]" : "aspect-[4/5]"}`}>
        <Link to="/products/$id" params={{ id: String(product.id) }} className="absolute inset-0 z-0 block">
          <img src={product.image} alt={`${product.name} ${product.size}`} className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]" />
          {product.badge && <span className="absolute right-4 top-4 rounded-full bg-foreground px-3 py-1.5 text-[10px] text-primary-foreground">{product.badge}</span>}
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute bottom-3 left-3 z-20 size-10 rounded-full bg-background/80 p-0 text-foreground hover:bg-background hover:text-gold focus-visible:bg-background"
          aria-label={`أضيفي ${product.name} إلى السلة`}
          onClick={addToCart}
        >
          {added ? <Check className="size-5 text-gold" /> : <ShoppingBag className="size-5 drop-shadow-sm" />}
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
