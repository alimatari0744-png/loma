import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { hasPurchasedProduct, hasReviewedProduct, hydrateSiteMedia, isSameCustomerReview, type Review, type SiteData } from "@/lib/site-data";

type CmsPayload =
  | { accessToken: string; kind: "json"; json: string }
  | { accessToken: string; kind: "file"; path: string; contentType: string; base64: string };

type ReviewPayload = Omit<Review, "id" | "createdAt" | "pinned">;

const CMS_BUCKET = "loma-cms";
const CMS_DATA_PATH = "site-data.json";

function getAdminEmail() {
  return (process.env.VITE_ADMIN_EMAIL || "74abonaif@gmail.com").trim().toLowerCase();
}

function getEnv() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const anon = process.env.VITE_SUPABASE_ANON_KEY || "";
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return { url, anon, secret };
}

export const saveRemoteCms = createServerFn({ method: "POST" })
  .validator((input: CmsPayload) => input)
  .handler(async ({ data }) => {
    const { url, anon, secret } = getEnv();
    if (!url || !anon) {
      return { ok: false as const, error: "إعدادات Supabase غير مكتملة على الخادم" };
    }
    if (!data.accessToken) {
      return { ok: false as const, error: "يجب تسجيل الدخول كمدير أولاً" };
    }

    const authClient = createClient(url, anon);
    const { data: userData, error: userError } = await authClient.auth.getUser(data.accessToken);
    if (userError || !userData.user?.email || userData.user.email.toLowerCase() !== getAdminEmail()) {
      return { ok: false as const, error: "هذا الحساب غير مصرح له بتعديل المتجر" };
    }

    const key = secret || anon;
    const storage = createClient(url, key, {
      global: { headers: secret ? {} : { Authorization: `Bearer ${data.accessToken}` } },
    });

    if (data.kind === "json") {
      const { error } = await storage.storage
        .from(CMS_BUCKET)
        .upload(CMS_DATA_PATH, new Blob([data.json], { type: "application/json" }), {
          upsert: true,
          contentType: "application/json",
        });
      if (error) return { ok: false as const, error: error.message };
      return { ok: true as const };
    }

    const bytes = Buffer.from(data.base64, "base64");
    const { error } = await storage.storage.from(CMS_BUCKET).upload(data.path, bytes, {
      upsert: true,
      contentType: data.contentType,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

function mergeSiteData(parsed: Partial<SiteData>, fallback: SiteData): SiteData {
  return hydrateSiteMedia({
    products: Array.isArray(parsed.products) && parsed.products.length ? parsed.products : fallback.products,
    orders: Array.isArray(parsed.orders) ? parsed.orders : fallback.orders,
    reviews: Array.isArray(parsed.reviews) ? parsed.reviews : fallback.reviews,
    content: {
      ...fallback.content,
      ...(parsed.content ?? {}),
      images: { ...fallback.content.images, ...(parsed.content?.images ?? {}) },
    },
  });
}

export const publishReview = createServerFn({ method: "POST" })
  .validator((input: { review: ReviewPayload; snapshot: SiteData }) => input)
  .handler(async ({ data }) => {
    const reviewInput = data.review;
    if (!reviewInput.authorName.trim() || !reviewInput.comment.trim()) {
      return { ok: false as const, error: "أكملي الاسم والتعليق" };
    }
    if (!hasPurchasedProduct(data.snapshot.orders, reviewInput.productId, reviewInput.authorPhone, reviewInput.authorEmail)) {
      return { ok: false as const, error: "يجب طلب المنتج قبل التقييم" };
    }
    if (hasReviewedProduct(data.snapshot.reviews, reviewInput.productId, reviewInput.authorPhone, reviewInput.authorEmail)) {
      return { ok: false as const, error: "لقد قيّمت هذا المنتج مسبقًا" };
    }

    const review: Review = {
      ...reviewInput,
      authorName: reviewInput.authorName.trim(),
      authorPhone: reviewInput.authorPhone.trim(),
      authorEmail: reviewInput.authorEmail.trim(),
      comment: reviewInput.comment.trim(),
      rating: Math.min(5, Math.max(1, Math.round(reviewInput.rating))),
      id: `REV-${Date.now()}`,
      createdAt: new Date().toISOString(),
      pinned: false,
    };

    const { url, anon, secret } = getEnv();
    const applyReview = (current: SiteData): SiteData => ({
      ...current,
      reviews: [
        review,
        ...current.reviews.filter(
          (item) => !isSameCustomerReview(item, review.productId, review.authorPhone, review.authorEmail),
        ),
      ],
    });

    if (!url || !anon) {
      return { ok: true as const, review, data: applyReview(data.snapshot) };
    }

    const key = secret || anon;
    const storage = createClient(url, key);
    const { data: file } = await storage.storage.from(CMS_BUCKET).download(CMS_DATA_PATH);
    let current = data.snapshot;
    if (file) {
      try {
        current = mergeSiteData(JSON.parse(await file.text()) as Partial<SiteData>, data.snapshot);
      } catch {
        current = data.snapshot;
      }
    }
    if (!hasPurchasedProduct(current.orders, review.productId, review.authorPhone, review.authorEmail)) {
      return { ok: false as const, error: "يجب طلب المنتج قبل التقييم" };
    }
    if (hasReviewedProduct(current.reviews, review.productId, review.authorPhone, review.authorEmail)) {
      return { ok: false as const, error: "لقد قيّمت هذا المنتج مسبقًا" };
    }
    const next = applyReview(current);
    const { error } = await storage.storage
      .from(CMS_BUCKET)
      .upload(CMS_DATA_PATH, new Blob([JSON.stringify(next)], { type: "application/json" }), {
        upsert: true,
        contentType: "application/json",
      });
    if (error) return { ok: false as const, error: error.message, review, data: applyReview(data.snapshot) };
    return { ok: true as const, review, data: next };
  });
