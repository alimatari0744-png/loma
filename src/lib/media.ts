const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || "https://pjinaxnndcdstcusuzvt.supabase.co";

export const CMS_BUCKET = "loma-cms";

export function cmsPublicUrl(path: string) {
  return `${supabaseUrl}/storage/v1/object/public/${CMS_BUCKET}/${path}`;
}

export const media = {
  hero: `${cmsPublicUrl("images/hero.jpg")}?v=20261007`,
  logo: cmsPublicUrl("images/logo.png"),
  bottle100: `${cmsPublicUrl("images/bottle-100.jpg")}?v=20261007`,
  bottle50: `${cmsPublicUrl("images/bottle-50.jpg")}?v=20261007`,
  pads: `${cmsPublicUrl("images/pads.jpg")}?v=20261007`,
};

const aliases: [string, string][] = [
  ["loma-hero-premium", media.hero],
  ["loma-hero", media.hero],
  ["loma-mark", media.logo],
  ["loma-product-100", media.bottle100],
  ["loma-product-50", media.bottle50],
  ["loma-product-pads", media.pads],
  ["images/hero", media.hero],
  ["images/logo", media.logo],
  ["images/ritualPads", media.pads],
  ["images/ritualBottle", media.bottle100],
  ["images/bottle-100", media.bottle100],
  ["images/bottle-50", media.bottle50],
  ["images/pads", media.pads],
];

export function isCmsUrl(url: string) {
  return Boolean(url && url.includes(`/storage/v1/object/public/${CMS_BUCKET}/`));
}

export function resolveMediaUrl(url?: string | null) {
  if (!url) return media.hero;
  if (isCmsUrl(url) || url.startsWith("data:")) return url;
  for (const [key, resolved] of aliases) {
    if (url.includes(key)) return resolved;
  }
  return url;
}
