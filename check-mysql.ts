import mysql from "mysql2/promise";

async function checkTables() {
  const connection = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "pickleball_scoreboard",
  });

  const [rows] = await connection.query("SELECT * FROM users");
  console.log("Users:", JSON.stringify(rows, null, 2));
  
  await connection.end();
}

checkTables().catch(console.error);
