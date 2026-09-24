import { createDefaultSiteData, saveSiteData, type SiteData } from "@/lib/site-data";
import { getAdminEmail, getSupabase, supabaseUrl, translateAuthError } from "@/lib/supabase";
import { saveRemoteCms } from "@/lib/cms.functions";

export const CMS_BUCKET = "loma-cms";
export const CMS_DATA_PATH = "site-data.json";

export type PersistResult = {
  ok: boolean;
  remote: boolean;
  error?: string;
};

export function cmsPublicUrl(path: string) {
  return `${supabaseUrl}/storage/v1/object/public/${CMS_BUCKET}/${path}`;
}

async function getAccessToken() {
  const { data } = await getSupabase().auth.getSession();
  return data.session?.access_token ?? "";
}

function mergeSiteData(parsed: Partial<SiteData>): SiteData {
  const defaults = createDefaultSiteData();
  return {
    products: Array.isArray(parsed.products) && parsed.products.length ? parsed.products : defaults.products,
    orders: Array.isArray(parsed.orders) ? parsed.orders : [],
    content: {
      ...defaults.content,
      ...(parsed.content ?? {}),
      images: { ...defaults.content.images, ...(parsed.content?.images ?? {}) },
    },
  };
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

export async function uploadCmsImage(dataUrl: string, path: string): Promise<string> {
  if (!dataUrl.startsWith("data:")) return dataUrl;
  const blob = await dataUrlToBlob(dataUrl);
  const supabase = getSupabase();
  const { error } = await supabase.storage.from(CMS_BUCKET).upload(path, blob, {
    upsert: true,
    contentType: blob.type || "image/jpeg",
  });
  if (!error) return `${cmsPublicUrl(path)}?v=${Date.now()}`;

  const token = await getAccessToken();
  const result = await saveRemoteCms({
    data: {
      accessToken: token,
      kind: "file",
      path,
      contentType: blob.type || "image/jpeg",
      base64: dataUrl.split(",")[1] ?? "",
    },
  });
  if (!result.ok) throw new Error(result.error || "تعذر رفع الصورة");
  return `${cmsPublicUrl(path)}?v=${Date.now()}`;
}

async function materializeImages(data: SiteData): Promise<SiteData> {
  const products = await Promise.all(
    data.products.map(async (product) => {
      const image = product.image.startsWith("data:")
        ? await uploadCmsImage(product.image, `images/product-${product.id}.jpg`)
        : product.image;
      const gallery = await Promise.all(
        product.gallery.map((item, index) =>
          item.startsWith("data:")
            ? uploadCmsImage(item, `images/product-${product.id}-${index}.jpg`)
            : Promise.resolve(item),
        ),
      );
      return { ...product, image, gallery: gallery.length ? gallery : [image] };
    }),
  );

  const images = { ...data.content.images };
  for (const key of Object.keys(images) as (keyof typeof images)[]) {
    if (images[key].startsWith("data:")) {
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
    const prepared = await materializeImages(data);
    try {
      saveSiteData(prepared);
    } catch {
      // localStorage quota should not block remote save
    }

    const json = JSON.stringify(prepared);
    const supabase = getSupabase();
    const { error } = await supabase.storage.from(CMS_BUCKET).upload(CMS_DATA_PATH, new Blob([json], { type: "application/json" }), {
      upsert: true,
      contentType: "application/json",
    });
    if (!error) return { ok: true, remote: true };

    const token = await getAccessToken();
    const remote = await saveRemoteCms({
      data: { accessToken: token, kind: "json", json },
    });
    if (remote.ok) return { ok: true, remote: true };
    return {
      ok: true,
      remote: false,
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

export { getAdminEmail };
