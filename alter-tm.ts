import mysql from "mysql2/promise";

async function alterTable() {
  const connection = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "pickleball_scoreboard",
  });

  await connection.query("ALTER TABLE tournament_matches ADD COLUMN court_id INT");
  
  console.log("✅ Table altered!");
  await connection.end();
}

alterTable().catch(console.error);
