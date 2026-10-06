import { useMemo, useState, type FormEvent } from "react";
import { MessageCircle } from "lucide-react";
import { useCustomerAccount } from "@/components/customer-account-context";
import { StarRating } from "@/components/star-rating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSiteStore } from "@/components/site-store-context";
import { hasPurchasedProduct, hasReviewedProduct } from "@/lib/site-data";

export function ProductReviews({ productId, productName }: { productId: number; productName: string }) {
  const { reviews, orders, addReview } = useSiteStore();
  const { customer } = useCustomerAccount();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const productReviews = useMemo(
    () => reviews.filter((review) => review.productId === productId),
    [productId, reviews],
  );
  const average =
    productReviews.length === 0
      ? 0
      : Math.round((productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length) * 10) / 10;

  const purchased = Boolean(
    customer && hasPurchasedProduct(orders, productId, customer.phone, customer.email),
  );
  const alreadyReviewed = Boolean(
    customer && hasReviewedProduct(reviews, productId, customer.phone, customer.email),
  );
  const canReview = Boolean(customer && purchased && !alreadyReviewed);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!customer) return;
    if (!comment.trim()) {
      setError("اكتب تعليقك");
      return;
    }
    setBusy(true);
    const result = await addReview({
      productId,
      productName,
      authorName: customer.name.trim() || "عميل",
      authorPhone: customer.phone.trim(),
      authorEmail: customer.email.trim(),
      rating,
      comment: comment.trim(),
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error || "تعذر حفظ التقييم");
    }
  };

  return (
    <section className="mt-20 border-t border-border pt-14">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-gold">آراء العملاء</p>
          <h2 className="mt-2 text-2xl font-semibold md:text-3xl">تقييمات {productName}</h2>
        </div>
        {productReviews.length > 0 && (
          <div className="flex items-center gap-3 rounded-full border border-border bg-card px-5 py-2.5">
            <span className="text-3xl font-semibold">{average}</span>
            <div>
              <StarRating value={Math.round(average)} readOnly />
              <p className="mt-1 text-xs text-muted-foreground">{productReviews.length} تقييم</p>
            </div>
          </div>
        )}
      </div>

      <div className={canReview ? "grid gap-10 lg:grid-cols-[1.1fr_0.9fr]" : undefined}>
        <div className="space-y-4">
          {productReviews.length === 0 ? (
            <div className="rounded-[1.5rem] border border-border px-6 py-14 text-center">
              <span className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-[#f6e7c4] text-[#8c6232]">
                <MessageCircle className="size-5" strokeWidth={1.5} />
              </span>
              <p className="text-muted-foreground">لا توجد تقييمات بعد.</p>
            </div>
          ) : (
            productReviews.map((review) => (
              <article key={review.id} className="rounded-[1.5rem] border border-border bg-card px-5 py-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-full bg-[#f6e7c4] text-sm font-medium text-[#8c6232]">
                      {review.authorName.trim().charAt(0) || "ل"}
                    </span>
                    <div>
                      <p className="font-medium">{review.authorName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString("ar-SA")}
                      </p>
                    </div>
                  </div>
                  <StarRating value={review.rating} readOnly size="sm" />
                </div>
                <p className="mt-4 text-sm leading-8 text-muted-foreground">{review.comment}</p>
              </article>
            ))
          )}
        </div>

        {canReview && (
          <form className="h-fit rounded-[1.5rem] border border-border bg-card px-5 py-6" onSubmit={submit}>
            <h3 className="text-lg font-semibold">اكتب تقييمك</h3>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              يظهر هذا النموذج مرة واحدة بعد طلبك لهذا المنتج.
            </p>
            <div className="mt-5 space-y-3">
              <div>
                <p className="mb-2 text-xs text-muted-foreground">التقييم</p>
                <StarRating value={rating} onChange={setRating} />
              </div>
              <Textarea
                className="min-h-28 rounded-2xl"
                placeholder="كيف كانت تجربتك مع المنتج؟"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                required
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" variant="luxury" className="h-11 w-full rounded-full" disabled={busy}>
                {busy ? "جارٍ النشر…" : "نشر التقييم"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
