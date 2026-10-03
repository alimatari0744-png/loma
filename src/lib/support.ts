export function supportPhones(raw?: string | null) {
  const source = (raw ?? "").trim();
  if (!source || source.includes("لاحق")) return [];
  const found = source.match(/(?:\+|00)?\d[\d\s().-]{6,}\d/g) ?? [];
  const phones = found
    .map((value) => value.trim())
    .filter((value) => value.replace(/\D/g, "").length >= 8);
  return [...new Set(phones.length ? phones : [source])];
}

export function phoneHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  return `tel:${digits}`;
}
