import mysql from "mysql2/promise";

async function alterTables() {
  const connection = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "pickleball_scoreboard",
  });

  await connection.query("ALTER TABLE matches ADD COLUMN court_id INT");
  
  console.log("✅ Table altered!");
  await connection.end();
}

alterTables().catch(console.error);
