import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
const { Pool } = pkg;
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

let sslConfig: any = undefined;
if (process.env.NODE_ENV === "production") {
  try {
    const url = new URL(process.env.DATABASE_URL);
    if (url.hostname.includes('.')) {
      sslConfig = { rejectUnauthorized: false };
    }
  } catch (e) {
    sslConfig = { rejectUnauthorized: false };
  }
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig,
});
export const db = drizzle(pool, { schema });
