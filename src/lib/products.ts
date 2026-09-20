import bottle100Image from "@/assets/loma-product-100.jpg";
import bottle50Image from "@/assets/loma-product-50.jpg";
import padsImage from "@/assets/loma-product-pads.jpg";

export type Variant = { id: number; label: string; price: number };

export type Product = {
  id: number;
  name: string;
  size: string;
  price: number;
  note: string;
  description: string;
  contents: string[];
  highlights: string[];
  category: "مزيل المكياج" | "الوسادات" | "الباقات";
  image: string;
  gallery: string[];
  badge?: string;
  variantLabel?: string;
  variants?: Variant[];
};

const careHighlights = [
  "بدون عطر، مناسب للبشرة الحساسة",
  "لطيف حول العينين",
  "يزيل المكياج المقاوم للماء",
  "لا يترك طبقة دهنية",
];

export const defaultProducts: Product[] = [
  {
    id: 1,
    name: "مزيل ميسيلار لطيف",
    size: "100 مل",
    price: 49,
    note: "الاختيار اليومي لتنظيف كامل ولطيف",
    description:
      "تركيبة ميسيلار مائية خفيفة تلتقط المكياج والشوائب بلمسة واحدة دون فرك أو شدّ. عبوة 100 مل تكفي روتين شهر كامل من التنظيف الصباحي والمسائي، وتترك البشرة مرتاحة ومهيأة لبقية خطوات العناية.",
    contents: ["عبوة 100 مل بمضخة", "تركيبة مائية بدون عطر"],
    highlights: careHighlights,
    category: "مزيل المكياج",
    image: bottle100Image,
    gallery: [bottle100Image, bottle50Image, padsImage],
    badge: "الأكثر طلبًا",
  },
  {
    id: 2,
    name: "مزيل ميسيلار لطيف",
    size: "50 مل",
    price: 29,
    note: "حجم عملي يرافقك في السفر",
    description:
      "نفس تركيبة لوما اللطيفة في حجم صغير يناسب الحقيبة والسفر. مثالي للاستخدام خارج المنزل أو لتجربة المنتج لأول مرة.",
    contents: ["عبوة 50 مل بمضخة"],
    highlights: careHighlights,
    category: "مزيل المكياج",
    image: bottle50Image,
    gallery: [bottle50Image, bottle100Image],
  },
  {
    id: 3,
    name: "وسادات قطنية ناعمة",
    size: "اختاري عدد الحبات",
    price: 15,
    note: "لمسة ناعمة تكمل روتين التنظيف",
    description:
      "وسادات قطنية سميكة بحواف مخيطة لا تتفتت مع الاستخدام. تمتص الكمية المناسبة من المزيل وتنظّف بلطف دون خدش البشرة. حدّدي عدد الحبات التي تناسب روتينك.",
    contents: ["وسادات قطن 100%", "حواف مخيطة لا تتفتت"],
    highlights: ["قطن ناعم على البشرة", "لا تتفتت مع الاستخدام", "مناسبة لمنطقة العينين"],
    category: "الوسادات",
    image: padsImage,
    gallery: [padsImage, bottle100Image],
    variantLabel: "عدد الحبات",
    variants: [
      { id: 301, label: "حبتان", price: 15 },
      { id: 302, label: "4 حبات", price: 25 },
      { id: 303, label: "8 حبات", price: 39 },
    ],
  },
  {
    id: 4,
    name: "الباقة الكبيرة",
    size: "علبة 100 مل + 4 فوط",
    price: 69,
    note: "علبة كبيرة مع أربع فوط قطنية",
    description:
      "باقة العناية الكاملة: عبوة 100 مل من مزيل لوما الميسيلار مع أربع فوط قطنية ناعمة داخل صندوق لوما. الخيار الأوفر لمن تريد روتينًا يوميًا متكاملًا.",
    contents: ["عبوة مزيل ميسيلار 100 مل", "4 فوط قطنية ناعمة", "صندوق لوما"],
    highlights: careHighlights,
    category: "الباقات",
    image: padsImage,
    gallery: [padsImage, bottle100Image, bottle50Image],
    badge: "الأوفر",
  },
  {
    id: 5,
    name: "الباقة الصغيرة",
    size: "علبة 50 مل + فوطتان",
    price: 29,
    note: "بداية مثالية لتجربة روتين لوما",
    description:
      "باقة مصغّرة تضم عبوة 50 مل من المزيل مع فوطتين قطنيتين. مناسبة للسفر أو كهدية لطيفة.",
    contents: ["عبوة مزيل ميسيلار 50 مل", "فوطتان قطنيتان"],
    highlights: careHighlights,
    category: "الباقات",
    image: bottle50Image,
    gallery: [bottle50Image, padsImage],
    badge: "باقة لوما",
  },
  {
    id: 6,
    name: "ثنائي السفر الهادئ",
    size: "2 × 50 مل",
    price: 55,
    note: "عبوتان عمليتان للحقيبة والسفر",
    description:
      "عبوتان بحجم 50 مل، واحدة للحقيبة وأخرى للمكتب أو الرحلات. تنظيف لطيف أينما كنتِ.",
    contents: ["عبوتان 50 مل"],
    highlights: careHighlights,
    category: "الباقات",
    image: bottle50Image,
    gallery: [bottle50Image, bottle100Image],
  },
  {
    id: 7,
    name: "وسادات لوما اليومية",
    size: "عبوتان",
    price: 28,
    note: "كمية إضافية لروتين لا ينقطع",
    description:
      "عبوتان من وسادات لوما القطنية لمن تستخدم المنتج يوميًا وتفضّل الاحتفاظ بمخزون إضافي في المنزل.",
    contents: ["عبوتان من الوسادات القطنية"],
    highlights: ["قطن ناعم على البشرة", "كمية تكفي شهرين", "لا تتفتت مع الاستخدام"],
    category: "الوسادات",
    image: padsImage,
    gallery: [padsImage, bottle50Image],
  },
  {
    id: 8,
    name: "روتين لوما المتكامل",
    size: "100 مل + 50 مل + وسادات",
    price: 99,
    note: "للاستخدام اليومي وفي السفر",
    description:
      "المجموعة الكاملة: عبوة 100 مل للمنزل، وعبوة 50 مل للسفر، مع وسادات لوما القطنية. كل خطوات روتين النقاء في صندوق واحد.",
    contents: ["عبوة 100 مل", "عبوة 50 مل", "وسادات قطنية", "صندوق لوما"],
    highlights: careHighlights,
    category: "الباقات",
    image: bottle100Image,
    gallery: [bottle100Image, bottle50Image, padsImage],
    badge: "مجموعة كاملة",
  },
];

export const products = defaultProducts;

export function getProduct(id: number, list: Product[] = defaultProducts) {
  return list.find((product) => product.id === id);
}

export type CartEntry = { key: number; product: Product; variant?: Variant; price: number; label: string };

export function resolveCartKey(key: number, list: Product[] = defaultProducts): CartEntry | undefined {
  for (const product of list) {
    if (product.id === key) return { key, product, price: product.price, label: product.size };
    const variant = product.variants?.find((item) => item.id === key);
    if (variant) return { key, product, variant, price: variant.price, label: variant.label };
  }
  return undefined;
}

export const formatPrice = (value: number) => `${value} ريال`;
