import pg from "pg";
import * as fs from "fs";

const { Pool } = pg;

const remotePool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_gspeqTaAjc94@ep-misty-frog-ak2u6lek.c-3.us-west-2.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false }
});

async function exportData() {
  const client = await remotePool.connect();
  
  try {
    const tables = [
      "users", "players", "matches", "work_schedules", 
      "tournaments", "tournament_players", "tournament_matches",
      "settings", "manager_connections", "chats", "notifications"
    ];
    
    const data: Record<string, any[]> = {};
    
    for (const table of tables) {
      console.log(`Exporting ${table}...`);
      const result = await client.query(`SELECT * FROM ${table}`);
      data[table] = result.rows;
      console.log(`  - ${result.rows.length} rows`);
    }
    
    fs.writeFileSync("./exported-from-neon.json", JSON.stringify(data, (key, value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }, 2));
    
    console.log("\n✅ Exported to exported-from-neon.json");
    
  } finally {
    client.release();
    await remotePool.end();
  }
}

exportData().catch(console.error);
