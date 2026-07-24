import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";

const migration = readFileSync(
  resolve("supabase/products-app-schema-migration.sql"),
  "utf8",
);

const databaseUrl = process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL;
const password = process.env.SUPABASE_DB_PASSWORD ?? process.env.POSTGRES_PASSWORD;

async function applyWithUrl(url) {
  const sql = postgres(url, { max: 1 });
  try {
    await sql.unsafe(migration);
    console.log("Products schema migration applied successfully.");
    return true;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function tryPooler() {
  if (!password) {
    return false;
  }

  const regions = [
    "ap-south-1",
    "us-east-1",
    "eu-west-1",
    "ap-southeast-1",
    "us-west-1",
  ];

  for (const region of regions) {
    const sql = postgres({
      host: `aws-0-${region}.pooler.supabase.com`,
      port: 6543,
      database: "postgres",
      username: "postgres.nieropjusrtufhbgwhkw",
      password,
      ssl: "require",
      connect_timeout: 5,
      max: 1,
    });

    try {
      await sql`select 1 as ok`;
      await sql.unsafe(migration);
      console.log(`Products schema migration applied via pooler (${region}).`);
      await sql.end({ timeout: 5 });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`Pooler ${region}: ${message.slice(0, 120)}`);
      try {
        await sql.end({ timeout: 1 });
      } catch {
        // ignore
      }
    }
  }

  return false;
}

if (databaseUrl) {
  await applyWithUrl(databaseUrl);
  process.exit(0);
}

if (await tryPooler()) {
  process.exit(0);
}

console.error(
  "Could not apply migration automatically. Run supabase/products-app-schema-migration.sql in the Supabase SQL editor, or set DATABASE_URL / SUPABASE_DB_PASSWORD and rerun npm run db:migrate-products.",
);
process.exit(1);
