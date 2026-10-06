import { useEffect, useState } from "react";
import { Quote } from "lucide-react";
import { StarRating } from "@/components/star-rating";
import { useSiteStore } from "@/components/site-store-context";

export function ReviewsSlider() {
  const { reviews } = useSiteStore();
  const pinned = reviews.filter((review) => review.pinned);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (pinned.length < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % pinned.length);
    }, 4800);
    return () => window.clearInterval(timer);
  }, [pinned.length]);

  useEffect(() => {
    if (index >= pinned.length) setIndex(0);
  }, [index, pinned.length]);

  if (pinned.length === 0) return null;
  const review = pinned[index] ?? pinned[0];

  return (
    <section className="bg-[#f7f2e9] px-5 py-20 md:px-10 md:py-24 lg:px-14">
      <div className="mx-auto max-w-[820px] text-center">
        <h2 className="text-3xl font-semibold md:text-5xl">ماذا يقول عملاء لوما</h2>
        <div className="relative mt-10 min-h-[220px] overflow-hidden rounded-[2rem] border border-[#e6dcc8] bg-white/80 px-6 py-10 shadow-[0_18px_50px_rgba(70,52,24,0.06)] md:px-12">
          {pinned.map((item, itemIndex) => (
            <blockquote
              key={item.id}
              className={`transition-all duration-700 ${
                itemIndex === index
                  ? "relative translate-y-0 opacity-100"
                  : "pointer-events-none absolute inset-0 translate-y-4 opacity-0"
              }`}
            >
              <span className="mx-auto mb-5 grid size-12 place-items-center rounded-full bg-[#f6e7c4] text-[#8c6232]">
                <Quote className="size-5" strokeWidth={1.5} />
              </span>
              <div className="flex justify-center">
                <StarRating value={item.rating} readOnly />
              </div>
              <p className="mx-auto mt-5 max-w-xl text-base leading-9 text-muted-foreground md:text-lg">
                “{item.comment}”
              </p>
              <p className="mt-6 text-sm font-medium">{item.authorName}</p>
              <p className="mt-1 text-xs text-gold">{item.productName}</p>
            </blockquote>
          ))}
        </div>
        {pinned.length > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            {pinned.map((item, itemIndex) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setIndex(itemIndex)}
                className={`h-1.5 rounded-full transition-all ${
                  itemIndex === index ? "w-8 bg-gold" : "w-3 bg-[#e0d4c0]"
                }`}
                aria-label={`عرض تقييم ${itemIndex + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
