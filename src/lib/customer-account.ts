export type CustomerProfile = {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  district: string;
  address: string;
  createdAt: string;
};

export type ProfileRow = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  district: string | null;
  address: string | null;
  created_at: string | null;
};

export function mapProfile(row: ProfileRow, fallbackEmail = ""): CustomerProfile {
  return {
    id: row.id,
    name: row.name ?? "",
    phone: row.phone ?? "",
    email: row.email || fallbackEmail,
    city: row.city ?? "",
    district: row.district ?? "",
    address: row.address ?? "",
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}
