import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const schema = readFileSync(resolve(root, "supabase/schema.sql"), "utf8");
const envLocal = readFileSync(resolve(root, ".env.local"), "utf8");
const env = readFileSync(resolve(root, ".env"), "utf8");

const secret = envLocal.match(/SUPABASE_SECRET_KEY=(.+)/)?.[1]?.trim();
const url = env.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim();
const anon = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();

if (!secret || !url) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const headers = {
  apikey: secret,
  Authorization: `Bearer ${secret}`,
  "Content-Type": "application/json",
  Accept: "application/json",
  "X-Client-Info": "loma-setup-script",
};

async function probe(name, requestUrl, extraHeaders = {}, body) {
  try {
    const res = await fetch(requestUrl, {
      method: body ? "POST" : "GET",
      headers: { ...headers, ...extraHeaders },
      body,
    });
    const text = await res.text();
    console.log(`\n[${name}] ${res.status} ${res.statusText}`);
    console.log(text.slice(0, 1200));
    return { ok: res.ok, status: res.status, text };
  } catch (error) {
    console.log(`\n[${name}] failed`, error);
    return { ok: false, status: 0, text: String(error) };
  }
}

await probe("auth settings", `${url}/auth/v1/settings`, { apikey: anon, Authorization: `Bearer ${anon}` });
await probe("profiles via secret", `${url}/rest/v1/profiles?select=id&limit=1`);
await probe("pg query", `${url}/pg/query`, {}, JSON.stringify({ query: schema }));
await probe(
  "database query",
  `${url}/database/v1/query`,
  {},
  JSON.stringify({ query: schema }),
);
await probe(
  "sql v1",
  `${url}/pg/v1/query`,
  {},
  JSON.stringify({ query: "select 1" }),
);
