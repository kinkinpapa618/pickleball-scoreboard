import mysql from "mysql2/promise";

async function alterTournaments() {
  const connection = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "pickleball_scoreboard",
  });

  await connection.query("ALTER TABLE tournaments ADD COLUMN court INT");
  await connection.query("ALTER TABLE tournaments ADD COLUMN courts INT DEFAULT 0");
  
  console.log("✅ Tournaments table altered!");
  await connection.end();
}

alterTournaments().catch(console.error);
