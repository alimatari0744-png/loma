import { media, resolveMediaUrl } from "@/lib/media";
import type { Product } from "@/lib/products";
import { defaultProducts } from "@/lib/products";

export const orderStatuses = ["مسودة", "قيد التحضير", "قيد الإعداد", "عند شركة الشحن", "تم الشحن", "مكتمل", "ملغي"] as const;

export type OrderStatus = (typeof orderStatuses)[number] | "جديد" | "قيد التجهيز";

export const orderStatusMeaning: Record<OrderStatus, string> = {
  مسودة: "الطلب ما زال مسودة داخل لوما ولم يُسلّم لشركة الشحن.",
  جديد: "الطلب ما زال مسودة داخل لوما ولم يُسلّم لشركة الشحن.",
  "قيد التحضير": "الطلب قيد التحضير داخل لوما ولم يخرج إلى شركة الشحن.",
  "قيد التجهيز": "الطلب قيد التحضير داخل لوما ولم يخرج إلى شركة الشحن.",
  "قيد الإعداد": "المنتج ما زال في مرحلة الإعداد داخل لوما ولم يُسلّم لشركة الشحن.",
  "عند شركة الشحن": "تم تسليم الطلب لشركة الشحن المسجّلة في لوحة التحكم وما زال عندها.",
  "تم الشحن": "شركة الشحن استلمت الطلب وهو في الطريق.",
  مكتمل: "اكتمل تسليم الطلب.",
  ملغي: "أُلغي الطلب ولم يُشحن.",
};

export type OrderItem = {
  key: number;
  productId: number;
  name: string;
  label: string;
  price: number;
  quantity: number;
  image: string;
};

export type Order = {
  id: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerNote: string;
  status: OrderStatus;
  shippingCompany?: string;
  total: number;
  items: OrderItem[];
};

export type SiteContent = {
  announcements: string[];
  hero: {
    eyebrow: string;
    title: string;
    titleLine2: string;
    subtitle: string;
    cta: string;
    feature1Title: string;
    feature1Text: string;
    feature2Title: string;
    feature2Text: string;
  };
  homeProducts: { kicker: string; title: string; moreTitle: string; moreText: string };
  homeRitual: {
    kicker: string;
    title: string;
    step1Title: string;
    step1Text: string;
    step2Title: string;
    step2Text: string;
    cta: string;
  };
  homePromise: { kicker: string; title: string; items: string[]; aboutCta: string };
  homeCta: { title: string; button: string };
  about: {
    kicker: string;
    title: string;
    titleLine2: string;
    intro: string;
    sectionTitle: string;
    sectionTitleLine2: string;
    p1: string;
    p2: string;
    p3: string;
    promiseKicker: string;
    promiseTitle: string;
    promiseItems: string[];
  };
  ritual: {
    kicker: string;
    title: string;
    titleLine2: string;
    intro: string;
    methodKicker: string;
    methodTitle: string;
    step1Title: string;
    step1Text: string;
    step2Title: string;
    step2Text: string;
    resultKicker: string;
    resultTitle: string;
    resultItems: string[];
    cta: string;
  };
  footer: { tagline: string; email: string; phone: string };
  images: {
    hero: string;
    ritualPads: string;
    ritualBottle: string;
    logo: string;
  };
};

export type Review = {
  id: string;
  productId: number;
  productName: string;
  authorName: string;
  authorPhone: string;
  authorEmail: string;
  rating: number;
  comment: string;
  createdAt: string;
  pinned: boolean;
};

export type SiteData = {
  products: Product[];
  orders: Order[];
  reviews: Review[];
  content: SiteContent;
};

export const STORAGE_KEY = "loma-site-data-v1";
export const AUTH_KEY = "loma-admin-auth";

export const defaultContent: SiteContent = {
  announcements: [
    "عناية يومية هادئة لبشرة نظيفة ومطمئنة",
    "إزالة فعّالة للمكياج بلطف على البشرة",
    "بدون عطر — ومناسب لمنطقة حول العينين",
  ],
  hero: {
    eyebrow: "LOMA SKINCARE",
    title: "جمالٌ يبدأ",
    titleLine2: "من النقاء",
    subtitle:
      "عناية يومية تزيل المكياج بلطف وفعالية، لتترك بشرتك نظيفة وهادئة بلا عطر أو أثر دهني.",
    cta: "تسوّقي المجموعة",
    feature1Title: "لطيف على البشرة",
    feature1Text: "مناسب للعناية اليومية",
    feature2Title: "تنظيف فعّال",
    feature2Text: "حتى للمكياج المقاوم للماء",
  },
  homeProducts: {
    kicker: "مجموعة لوما",
    title: "أساسيات العناية اليومية",
    moreTitle: "المزيد من لوما",
    moreText: "شاهدي المجموعة الكاملة والباقات",
  },
  homeRitual: {
    kicker: "روتين لوما",
    title: "خطوتان.\nوشعور أنقى.",
    step1Title: "أزيلي المكياج بلطف",
    step1Text: "ضعي الميسيلار على الوسادة ومرّريها بهدوء على الوجه والعينين.",
    step2Title: "اغسلي وأعيدي الاستخدام",
    step2Text: "اغسلي الوسادة واتركيها لتجف لتكون جاهزة لروتينك التالي.",
    cta: "اكتشفي الروتين كاملًا",
  },
  homePromise: {
    kicker: "العناية كما يجب أن تكون",
    title: "فعّالة في التنظيف.\nهادئة على البشرة.",
    items: ["بدون عطر", "مناسب للبشرة الحساسة", "لطيف حول العينين", "إحساس نظيف بلا لزوجة"],
    aboutCta: "تعرّفي إلى لوما",
  },
  homeCta: {
    title: "اجعلي النقاء أول خطوة\nفي روتينك.",
    button: "تسوّقي LOMA",
  },
  about: {
    kicker: "عن لوما",
    title: "بدأت لوما من",
    titleLine2: "فكرة بسيطة.",
    intro: "أن تصبح العناية بالبشرة طقسًا يوميًا من النقاء والهدوء.",
    sectionTitle: "تجربة واحدة",
    sectionTitleLine2: "متناسقة.",
    p1: "صُممت لوما لتمنح البشرة تجربة تنظيف لطيفة وفعّالة، مع عناية تمتد إلى كل تفصيلة في المنتج.",
    p2: "من تركيبة المزيل، إلى ملمس قطن لوما الناعم، وصولًا إلى التصميم والتغليف الداخلي والخارجي؛ حرصنا على أن تتكامل جميع العناصر لتصنع تجربة واحدة متناسقة.",
    p3: "اخترنا لكل تفصيلة مكانها، ولكل عنصر وظيفته، لأننا نؤمن أن الجمال الحقيقي لا يكمن في المظهر وحده، بل في العناية التي تقف خلفه.",
    promiseKicker: "وعد لوما",
    promiseTitle: "فعّالة في التنظيف.\nهادئة على البشرة.",
    promiseItems: [
      "تركيبات بلا عطر",
      "لطافة حول منطقة العين",
      "إزالة فعّالة للمكياج",
      "ملمس نظيف وغير دهني",
    ],
  },
  ritual: {
    kicker: "روتين لوما",
    title: "خطوتان.",
    titleLine2: "وشعور أنقى.",
    intro:
      "روتين هادئ يزيل آثار اليوم بلا قسوة. صُممت كل خطوة لتمنح البشرة تنظيفًا واضحًا وإحساسًا مريحًا.",
    methodKicker: "طريقة الاستخدام",
    methodTitle: "طقس يومي بسيط",
    step1Title: "بلّلي الوسادة",
    step1Text: "ضعي كمية مناسبة من مزيل لوما على الوسادة القطنية حتى تصبح رطبة دون إفراط.",
    step2Title: "مرّريها بهدوء",
    step2Text:
      "مرّري الوسادة على الوجه، واتركيها لثوانٍ فوق مكياج العين قبل المسح بلطف دون فرك.",
    resultKicker: "النتيجة",
    resultTitle: "فعّالة في التنظيف.\nهادئة على البشرة.",
    resultItems: [
      "إزالة المكياج المقاوم للماء",
      "لطيف حول العينين",
      "إحساس نظيف بلا طبقة دهنية",
    ],
    cta: "اختاري منتجات الروتين",
  },
  footer: {
    tagline: "CLEAN MAKEUP. CALM SKIN.",
    email: "سيتم الإضافة لاحقًا",
    phone: "سيتم الإضافة لاحقًا",
  },
  images: {
    hero: media.hero,
    ritualPads: media.pads,
    ritualBottle: media.bottle100,
    logo: media.logo,
  },
};

export function createDefaultSiteData(): SiteData {
  return {
    products: structuredClone(defaultProducts),
    orders: [],
    reviews: [],
    content: structuredClone(defaultContent),
  };
}

export function hydrateSiteMedia(data: SiteData): SiteData {
  return {
    ...data,
    products: data.products.map((product) => ({
      ...product,
      image: resolveMediaUrl(product.image),
      gallery: (product.gallery ?? []).map((item) => resolveMediaUrl(item)),
      sections: Array.isArray(product.sections)
        ? product.sections.map((section, index) => ({
            id: String(section?.id || `section-${product.id}-${index}`),
            title: String(section?.title ?? ""),
            items: Array.isArray(section?.items) ? section.items.map(String) : [],
          }))
        : [],
    })),
    orders: data.orders.map((order) => ({
      ...order,
      items: order.items.map((item) => ({ ...item, image: resolveMediaUrl(item.image) })),
    })),
    content: {
      ...data.content,
      images: {
        hero: resolveMediaUrl(data.content.images.hero),
        ritualPads: resolveMediaUrl(data.content.images.ritualPads),
        ritualBottle: resolveMediaUrl(data.content.images.ritualBottle),
        logo: resolveMediaUrl(data.content.images.logo),
      },
    },
  };
}

export function loadSiteData(): SiteData {
  if (typeof window === "undefined") return createDefaultSiteData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultSiteData();
    const parsed = JSON.parse(raw) as Partial<SiteData>;
    const defaults = createDefaultSiteData();
    return hydrateSiteMedia({
      products: Array.isArray(parsed.products) && parsed.products.length ? parsed.products : defaults.products,
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
      content: { ...defaults.content, ...(parsed.content ?? {}), images: { ...defaults.content.images, ...(parsed.content?.images ?? {}) } },
    });
  } catch {
    return createDefaultSiteData();
  }
}

export function saveSiteData(data: SiteData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function normalizeContact(value: string) {
  return value.replace(/\s+/g, "").trim().toLowerCase();
}

export function isSameCustomerReview(review: Review, productId: number, phone?: string, email?: string) {
  if (review.productId !== productId) return false;
  const phoneKey = phone ? normalizeContact(phone) : "";
  const emailKey = email ? normalizeContact(email) : "";
  return Boolean(
    (emailKey && normalizeContact(review.authorEmail) === emailKey) ||
      (phoneKey && normalizeContact(review.authorPhone) === phoneKey),
  );
}

export function hasReviewedProduct(reviews: Review[], productId: number, phone?: string, email?: string) {
  return reviews.some((review) => isSameCustomerReview(review, productId, phone, email));
}

export function hasPurchasedProduct(
  orders: Order[],
  productId: number,
  phone?: string,
  email?: string,
) {
  const phoneKey = phone ? normalizeContact(phone) : "";
  const emailKey = email ? normalizeContact(email) : "";
  return orders.some((order) => {
    if (order.status === "ملغي") return false;
    const bought = order.items.some((item) => item.productId === productId);
    if (!bought) return false;
    const orderPhone = normalizeContact(order.customerPhone);
    const orderEmail = normalizeContact(order.customerEmail ?? "");
    const orderNote = order.customerNote.toLowerCase();
    return (
      (phoneKey && orderPhone === phoneKey) ||
      (emailKey &&
        (orderEmail === emailKey ||
          orderNote.includes(emailKey) ||
          order.customerName.toLowerCase() === emailKey))
    );
  });
}

export function emptyProduct(id: number): Product {
  return {
    id,
    name: "منتج جديد",
    size: "حجم",
    price: 0,
    note: "وصف قصير",
    description: "وصف المنتج",
    contents: [],
    highlights: [],
    sections: [],
    category: "مزيل المكياج",
    image: media.bottle100,
    gallery: [media.bottle100],
  };
}
