export type CustomerProfile = {
  id: string;
  name: string;
  phone: string;
  email: string;
  password: string;
  city: string;
  district: string;
  address: string;
  createdAt: string;
};

export type CustomerSession = {
  customerId: string;
};

export const CUSTOMERS_KEY = "loma-customers-v1";
export const CUSTOMER_SESSION_KEY = "loma-customer-session";

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, "").trim();
}

function normalizeCustomer(raw: Partial<CustomerProfile> & { id: string; name: string; phone: string; password: string }): CustomerProfile {
  return {
    id: raw.id,
    name: raw.name ?? "",
    phone: normalizePhone(raw.phone ?? ""),
    email: raw.email ?? "",
    password: raw.password ?? "",
    city: raw.city ?? "",
    district: raw.district ?? "",
    address: raw.address ?? "",
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
}

export function loadCustomers(): CustomerProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOMERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Partial<CustomerProfile> & { id: string; name: string; phone: string; password: string }>;
    return Array.isArray(parsed) ? parsed.map(normalizeCustomer) : [];
  } catch {
    return [];
  }
}

export function saveCustomers(customers: CustomerProfile[]) {
  localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
}

export function loadCustomerSession(): CustomerSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CUSTOMER_SESSION_KEY) ?? sessionStorage.getItem(CUSTOMER_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CustomerSession;
    return parsed?.customerId ? parsed : null;
  } catch {
    return null;
  }
}

export function saveCustomerSession(session: CustomerSession | null) {
  if (!session) {
    localStorage.removeItem(CUSTOMER_SESSION_KEY);
    sessionStorage.removeItem(CUSTOMER_SESSION_KEY);
    return;
  }
  localStorage.setItem(CUSTOMER_SESSION_KEY, JSON.stringify(session));
  sessionStorage.removeItem(CUSTOMER_SESSION_KEY);
}

export function findCustomerByPhone(customers: CustomerProfile[], phone: string) {
  const normalized = normalizePhone(phone);
  return customers.find((customer) => normalizePhone(customer.phone) === normalized);
}

export function createCustomer(input: {
  name: string;
  phone: string;
  password: string;
  email?: string;
  city?: string;
  district?: string;
  address?: string;
}): CustomerProfile {
  return {
    id: `CUS-${Date.now()}`,
    name: input.name.trim(),
    phone: normalizePhone(input.phone),
    email: input.email?.trim() ?? "",
    password: input.password,
    city: input.city?.trim() ?? "",
    district: input.district?.trim() ?? "",
    address: input.address?.trim() ?? "",
    createdAt: new Date().toISOString(),
  };
}
