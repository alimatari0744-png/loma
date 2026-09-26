import { CMS_BUCKET, cmsPublicUrl, isCmsUrl, resolveMediaUrl } from "@/lib/media";
import { createDefaultSiteData, hydrateSiteMedia, saveSiteData, type SiteData } from "@/lib/site-data";
import { getAdminEmail, getSupabase, translateAuthError } from "@/lib/supabase";
import { publishReview, saveRemoteCms } from "@/lib/cms.functions";

export { CMS_BUCKET, cmsPublicUrl };
export const CMS_DATA_PATH = "site-data.json";

export type PersistResult = {
  ok: boolean;
  remote: boolean;
  error?: string;
  data?: SiteData;
};

async function getAccessToken() {
  const { data } = await getSupabase().auth.getSession();
  return data.session?.access_token ?? "";
}

function mergeSiteData(parsed: Partial<SiteData>): SiteData {
  const defaults = createDefaultSiteData();
  return hydrateSiteMedia({
    products: Array.isArray(parsed.products) && parsed.products.length ? parsed.products : defaults.products,
    orders: Array.isArray(parsed.orders) ? parsed.orders : [],
    reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
    content: {
      ...defaults.content,
      ...(parsed.content ?? {}),
      images: { ...defaults.content.images, ...(parsed.content?.images ?? {}) },
    },
  });
}

export async function loadRemoteSiteData(): Promise<SiteData | null> {
  try {
    const res = await fetch(`${cmsPublicUrl(CMS_DATA_PATH)}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    const parsed = (await res.json()) as Partial<SiteData>;
    return mergeSiteData(parsed);
  } catch {
    return null;
  }
}

async function dataUrlToBlob(dataUrl: string) {
  const res = await fetch(dataUrl);
  return res.blob();
}

async function blobToBase64(blob: Blob) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export async function uploadCmsImage(source: string, path: string): Promise<string> {
  const resolved = resolveMediaUrl(source);
  if (isCmsUrl(resolved) && !resolved.startsWith("data:")) return resolved;
  const blob = await dataUrlToBlob(resolved);
  const token = await getAccessToken();
  const base64 = resolved.startsWith("data:") ? (resolved.split(",")[1] ?? "") : await blobToBase64(blob);
  const result = await saveRemoteCms({
    data: {
      accessToken: token,
      kind: "file",
      path,
      contentType: blob.type || "image/jpeg",
      base64,
    },
  });
  if (result.ok) return `${cmsPublicUrl(path)}?v=${Date.now()}`;

  const supabase = getSupabase();
  const { error } = await supabase.storage.from(CMS_BUCKET).upload(path, blob, {
    upsert: true,
    contentType: blob.type || "image/jpeg",
  });
  if (!error) return `${cmsPublicUrl(path)}?v=${Date.now()}`;
  throw new Error(result.error || error.message || "تعذر رفع الصورة");
}

async function materializeImages(data: SiteData): Promise<SiteData> {
  const products = await Promise.all(
    data.products.map(async (product) => {
      const image = !isCmsUrl(product.image)
        ? await uploadCmsImage(product.image, `images/product-${product.id}.jpg`)
        : product.image;
      const gallery = await Promise.all(
        product.gallery.map((item, index) =>
          !isCmsUrl(item)
            ? uploadCmsImage(item, `images/product-${product.id}-${index}.jpg`)
            : Promise.resolve(item),
        ),
      );
      return { ...product, image, gallery: gallery.length ? gallery : [image] };
    }),
  );

  const images = { ...data.content.images };
  for (const key of Object.keys(images) as (keyof typeof images)[]) {
    if (!isCmsUrl(images[key])) {
      images[key] = await uploadCmsImage(images[key], `images/${key}.jpg`);
    }
  }

  return {
    ...data,
    products,
    content: { ...data.content, images },
  };
}

export async function persistSiteData(data: SiteData): Promise<PersistResult> {
  try {
    const prepared = await materializeImages(hydrateSiteMedia(data));
    try {
      saveSiteData(prepared);
    } catch {
      // localStorage quota should not block remote save
    }

    const json = JSON.stringify(prepared);
    const token = await getAccessToken();
    const remote = await saveRemoteCms({
      data: { accessToken: token, kind: "json", json },
    });
    if (remote.ok) return { ok: true, remote: true, data: prepared };

    const supabase = getSupabase();
    const { error } = await supabase.storage.from(CMS_BUCKET).upload(CMS_DATA_PATH, new Blob([json], { type: "application/json" }), {
      upsert: true,
      contentType: "application/json",
    });
    if (!error) return { ok: true, remote: true, data: prepared };

    return {
      ok: false,
      remote: false,
      data: prepared,
      error: remote.error || translateAuthError(error.message),
    };
  } catch (error) {
    return {
      ok: false,
      remote: false,
      error: error instanceof Error ? error.message : "تعذر حفظ التغييرات",
    };
  }
}

export async function persistCustomerReview(
  review: Omit<SiteData["reviews"][number], "id" | "createdAt" | "pinned">,
  snapshot: SiteData,
): Promise<PersistResult> {
  try {
    const result = await publishReview({ data: { review, snapshot } });
    if (result.data) {
      try {
        saveSiteData(result.data);
      } catch {
        // localStorage quota should not block the review
      }
    }
    if (result.ok && result.data) {
      return { ok: true, remote: true, data: result.data };
    }
    const fallback = await persistSiteData({
      ...snapshot,
      reviews: result.data?.reviews ?? snapshot.reviews,
    });
    return {
      ok: true,
      remote: fallback.remote,
      data: fallback.data ?? snapshot,
      error: fallback.remote ? undefined : fallback.error,
    };
  } catch {
    try {
      saveSiteData(snapshot);
    } catch {
      // localStorage quota should not block the review
    }
    return { ok: true, remote: false, data: snapshot };
  }
}

export { getAdminEmail };
