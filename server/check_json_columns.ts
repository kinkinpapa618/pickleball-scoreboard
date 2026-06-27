import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  try {
    const query = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'matches'
        AND column_name IN ('timeline', 'timeouts', 'stacking', 'penalties');
    `;
    const { rows } = await pool.query(query);
    console.log('Column types after migration:');
    rows.forEach((row) => console.log(`${row.column_name}: ${row.data_type}`));
  } catch (err) {
    console.error('Error checking column types:', err);
  } finally {
    await pool.end();
  }
})();
