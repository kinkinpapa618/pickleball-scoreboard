import mysql from "mysql2/promise";
import * as fs from "fs";

const localPool = mysql.createPool({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "pickleball_scoreboard",
  waitForConnections: true,
  connectionLimit: 10,
});

const data = JSON.parse(fs.readFileSync("./exported-from-neon.json", "utf-8"));

async function importData() {
  const connection = await localPool.getConnection();
  
  try {
    await connection.query("SET FOREIGN_KEY_CHECKS = 0");
    
    const tables = [
      "users", "players", "matches", "work_schedules", 
      "tournaments", "tournament_players", "tournament_matches",
      "settings", "manager_connections", "chats", "notifications"
    ];
    
    for (const table of tables) {
      console.log(`Deleting from ${table}...`);
      await connection.query(`DELETE FROM ${table}`);
    }
    
    for (const table of tables) {
      const rows = data[table] || [];
      console.log(`Importing ${table}... (${rows.length} rows)`);
      
      if (rows.length === 0) continue;
      
      let columns = Object.keys(rows[0]);
      if (table === "settings") {
        columns = columns.map(c => c === "key" ? "`key`" : c);
      }
      if (table === "notifications") {
        columns = columns.map(c => c === "read" ? "`read`" : c);
      }
      const placeholders = rows.map(() => `(${columns.map(() => "?").join(",")})`).join(",");
      const values = rows.flatMap(row => columns.map(col => {
        const val = row[col];
        if (val instanceof Object) return JSON.stringify(val);
        return val;
      }));
      
      await connection.query(
        `INSERT IGNORE INTO ${table} (${columns.join(",")}) VALUES ${placeholders}`,
        values
      );
    }
    
    await connection.query("SET FOREIGN_KEY_CHECKS = 1");
    console.log("\n✅ Imported successfully!");
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    connection.release();
    await localPool.end();
  }
}

importData();
