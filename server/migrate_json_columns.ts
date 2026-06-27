import "dotenv/config";
import pkg from "pg";
const { Pool } = pkg;

// Create a pool using the DATABASE_URL with SSL options required for Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

(async () => {
  try {
    console.log("Starting JSON columns migration...");
    const sql = `
      ALTER TABLE matches
        ALTER COLUMN timeline TYPE json USING timeline::json,
        ALTER COLUMN timeouts TYPE json USING timeouts::json,
        ALTER COLUMN stacking TYPE json USING stacking::json,
        ALTER COLUMN penalties TYPE json USING penalties::json;
    `;
    await pool.query(sql);
    console.log("Migration completed successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
