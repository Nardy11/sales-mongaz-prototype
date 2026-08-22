import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";
const databaseUrl = process.env.DATABASE_URL; if (!databaseUrl) throw new Error("DATABASE_URL is required to run migrations.");
const sql = postgres(databaseUrl, { max: 1 });
await sql`CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
const directory = path.join(import.meta.dirname, "migrations");
for (const name of (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort()) { if (!(await sql<{ name: string }[]>`SELECT name FROM schema_migrations WHERE name = ${name}`).length) { await sql.begin(async (transaction) => { await transaction.unsafe(await readFile(path.join(directory, name), "utf8")); await transaction`INSERT INTO schema_migrations (name) VALUES (${name})`; }); console.log(`Applied ${name}`); } }
await sql.end();
