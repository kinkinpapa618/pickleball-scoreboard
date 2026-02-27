import mysql from "mysql2/promise";

async function createTables() {
  const connection = await mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "",
    database: "pickleball_scoreboard",
  });

  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role ENUM('admin', 'manager', 'referee') NOT NULL DEFAULT 'referee',
      full_name TEXT,
      phone VARCHAR(255) NOT NULL,
      id_card VARCHAR(255) NOT NULL,
      manager_id INT
    )`,
    `CREATE TABLE IF NOT EXISTS players (
      id INT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      total_matches INT DEFAULT 0,
      wins INT DEFAULT 0
    )`,
    `CREATE TABLE IF NOT EXISTS matches (
      id INT PRIMARY KEY,
      team1_player1 VARCHAR(255) NOT NULL,
      team1_player2 VARCHAR(255) NOT NULL,
      team2_player1 VARCHAR(255) NOT NULL,
      team2_player2 VARCHAR(255) NOT NULL,
      score_team1 INT NOT NULL DEFAULT 0,
      score_team2 INT NOT NULL DEFAULT 0,
      is_server1 BOOLEAN DEFAULT FALSE NOT NULL,
      is_server2 BOOLEAN DEFAULT FALSE NOT NULL,
      server_number INT DEFAULT 1 NOT NULL,
      status VARCHAR(255) NOT NULL DEFAULT 'live',
      winning_score INT NOT NULL DEFAULT 11,
      winner_team INT,
      timeline TEXT,
      timeouts TEXT,
      stacking TEXT,
      penalties TEXT,
      start_time TIMESTAMP DEFAULT NOW(),
      end_time TIMESTAMP DEFAULT NOW(),
      is_first_serve_of_match BOOLEAN,
      referee_id INT,
      creator_id INT,
      court_id INT,
      date TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS work_schedules (
      id INT PRIMARY KEY,
      referee_id INT,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      match_id INT,
      date TIMESTAMP NOT NULL,
      location VARCHAR(255),
      status VARCHAR(255) NOT NULL DEFAULT 'assigned',
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS tournaments (
      id INT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      teams_per_group INT DEFAULT 4,
      winning_score INT DEFAULT 11,
      status VARCHAR(255) NOT NULL DEFAULT 'draft',
      level TEXT,
      content JSON,
      date DATE,
      time TIME,
      location VARCHAR(255),
      backdrop TEXT,
      creator_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS tournament_players (
      id INT PRIMARY KEY,
      tournament_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      group_name VARCHAR(255),
      seed INT,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS tournament_matches (
      id INT PRIMARY KEY,
      tournament_id INT NOT NULL,
      match_id INT,
      team1_player1 VARCHAR(255) NOT NULL,
      team1_player2 VARCHAR(255) NOT NULL,
      team2_player1 VARCHAR(255) NOT NULL,
      team2_player2 VARCHAR(255) NOT NULL,
      group_name VARCHAR(255),
      round INT,
      match_order INT,
      status VARCHAR(255) NOT NULL DEFAULT 'pending',
      referee_id INT,
      referee_token VARCHAR(255),
      scheduled_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      id INT PRIMARY KEY,
      \`key\` VARCHAR(255) NOT NULL UNIQUE,
      value TEXT NOT NULL,
      description TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS manager_connections (
      id INT PRIMARY KEY,
      referee_id INT NOT NULL,
      manager_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS chats (
      id INT PRIMARY KEY,
      sender_id INT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id INT PRIMARY KEY,
      user_id INT NOT NULL,
      type ENUM('chat', 'match', 'tournament', 'schedule', 'system') NOT NULL,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      \`read\` BOOLEAN DEFAULT FALSE NOT NULL,
      link VARCHAR(255),
      data JSON,
      created_at TIMESTAMP DEFAULT NOW()
    )`
  ];

  for (const sql of tables) {
    await connection.execute(sql);
    console.log("Created table");
  }

  console.log("✅ All tables created!");
  await connection.end();
}

createTables().catch(console.error);
