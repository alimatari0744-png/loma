import { Star } from "lucide-react";

export function StarRating({
  value,
  onChange,
  size = "md",
  readOnly = false,
}: {
  value: number;
  onChange?: (value: number) => void;
  size?: "sm" | "md";
  readOnly?: boolean;
}) {
  const className = size === "sm" ? "size-3.5" : "size-5";
  return (
    <div className="flex items-center gap-1" dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;
        if (readOnly) {
          return (
            <Star
              key={star}
              className={`${className} ${active ? "fill-gold text-gold" : "text-border"}`}
              strokeWidth={1.4}
            />
          );
        }
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            className="transition-transform hover:scale-110"
            aria-label={`${star} من 5`}
          >
            <Star
              className={`${className} ${active ? "fill-gold text-gold" : "text-border"}`}
              strokeWidth={1.4}
            />
          </button>
        );
      })}
    </div>
  );
}
