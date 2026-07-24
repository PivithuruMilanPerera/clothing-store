import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function getDatabaseUrl(): string | null {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  if (process.env.SUPABASE_DB_URL) {
    return process.env.SUPABASE_DB_URL;
  }

  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!password) {
    return null;
  }

  const region = process.env.SUPABASE_DB_REGION ?? "ap-south-1";
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL
    ?.replace("https://", "")
    .replace(".supabase.co", "");

  if (!projectRef) {
    return null;
  }

  const host = process.env.SUPABASE_DB_HOST ?? `aws-0-${region}.pooler.supabase.com`;
  const port = process.env.SUPABASE_DB_PORT ?? "6543";
  const user = process.env.SUPABASE_DB_USER ?? `postgres.${projectRef}`;

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/postgres`;
}

export async function applyProductsSchemaMigration(): Promise<void> {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new Error(
      "Database connection is not configured. Add DATABASE_URL or SUPABASE_DB_PASSWORD to .env.local, or run supabase/products-app-schema-migration.sql in the Supabase SQL editor.",
    );
  }

  const migration = readFileSync(
    resolve(process.cwd(), "supabase/products-app-schema-migration.sql"),
    "utf8",
  );

  const { default: postgres } = await import("postgres");
  const sql = postgres(databaseUrl, { max: 1 });

  try {
    await sql.unsafe(migration);
  } finally {
    await sql.end({ timeout: 5 });
  }
}
