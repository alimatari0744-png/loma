import { fileToDataUrl } from "@/lib/site-data";

export type ImageSlot = "product" | "hero" | "ritual" | "logo";

const maxEdge: Record<ImageSlot, number> = {
  product: 1600,
  hero: 2000,
  ritual: 1800,
  logo: 512,
};

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function fileToCompressedDataUrl(file: File, slot: ImageSlot) {
  const bitmap = await createImageBitmap(file);
  const longest = Math.max(bitmap.width, bitmap.height);
  const scale = Math.min(1, maxEdge[slot] / longest);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return fileToDataUrl(file);
  }
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const type = slot === "logo" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), type, slot === "logo" ? undefined : 0.92);
  });
  if (!blob || (scale === 1 && blob.size >= file.size)) return fileToDataUrl(file);
  return blobToDataUrl(blob);
}
