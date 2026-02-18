import { db } from "../db";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  const migrationsDir = join(__dirname, "migrations");
  const fs = await import("fs");

  const files = fs.readdirSync(migrationsDir)
    .filter((f: string) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf-8");
    console.log(`Running migration: ${file}`);
    try {
      await db.execute(sql);
      console.log(`✓ ${file} completed`);
    } catch (error: any) {
      console.error(`✗ ${file} failed:`, error.message);
    }
  }
}

runMigrations()
  .then(() => {
    console.log("All migrations completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
