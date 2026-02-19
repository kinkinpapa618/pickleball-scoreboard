import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/trongtaiso",
  client_encoding: "UTF8"
});

const firstNames = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Đặng", "Bùi", "Đỗ", "Ngô", "Vũ", "Phan", "Trương", "Võ", "Đinh", "Huỳnh", "Lý", "Trịnh", "Đào", "Thái", "Ngụy"];
const lastNames = ["Minh", "Hùng", "An", "Bảo", "Long", "Nam", "Khoa", "Phúc", "Thành", "Việt", "Dũng", "Tân", "Huy", "Lâm", "Phong", "Tuấn", "Khôi", "Ngọc", "Minh", "Quân", "Tuấn", "Hải", "Văn", "Sơn", "Thanh", "Bình", "Trung", "Hiếu", "Nghĩa", "Đức"];

function randomName() {
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

function nanoid(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function createDemoTournament() {
  const NUM_PAIRS = 40;
  const LEVEL = "4.4";
  const CATEGORY = "Đôi Nam-Nữ";
  const NUM_COURTS = 4;
  const TOURNAMENT_NAME = `Giải Pickleball Demo 40 Cặp - ${LEVEL} - ${CATEGORY}`;
  
  console.log("=== TẠO GIẢI ĐẤU TRỰC TIẾP VÀO DATABASE ===\n");
  console.log(`Cấu hình: ${NUM_PAIRS} cặp, Level ${LEVEL}, ${CATEGORY}, ${NUM_COURTS} sân\n`);

  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");

    console.log(`1. Tạo giải đấu: ${TOURNAMENT_NAME}`);
    
    const tournamentResult = await client.query(`
      INSERT INTO tournaments (name, description, teams_per_group, winning_score, status, level, content, date, time, location, court, courts, creator_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, '08:00:00', 'Sân Pickleball', $8, $9, 1)
      RETURNING id
    `, [TOURNAMENT_NAME, `Giải đấu Pickleball ${LEVEL} nội dung ${CATEGORY} với ${NUM_PAIRS} cặp đấu`, 4, 11, 'draft', LEVEL, JSON.stringify({ [LEVEL]: [CATEGORY] }), `Sân 1-${NUM_COURTS}`, NUM_COURTS]);
    
    const tournamentId = tournamentResult.rows[0].id;
    console.log(`   ✓ Tournament ID: ${tournamentId}`);

    console.log(`\n2. Tạo ${NUM_PAIRS} cặp đấu...`);
    const teams: { id: number; name: string; player1: string; player2: string; groupName: string }[] = [];
    
    for (let i = 0; i < NUM_PAIRS; i++) {
      const gender1 = (i * 2) % 2 === 0 ? "Nam" : "Nữ";
      const gender2 = ((i * 2) + 1) % 2 === 0 ? "Nam" : "Nữ";
      const player1Name = `${randomName()} (${gender1})`;
      const player2Name = `${randomName()} (${gender2})`;
      const teamName = `Team ${String(i + 1).padStart(2, "0")}`;
      
      const playerResult = await client.query(`
        INSERT INTO tournament_players (tournament_id, name, seed, group_name)
        VALUES ($1, $2, $3, '') RETURNING id
      `, [tournamentId, player1Name, i + 1]);
      const id1 = playerResult.rows[0].id;
      
      const playerResult2 = await client.query(`
        INSERT INTO tournament_players (tournament_id, name, seed, group_name)
        VALUES ($1, $2, $3, '') RETURNING id
      `, [tournamentId, player2Name, i + 1]);
      const id2 = playerResult2.rows[0].id;
      
      teams.push({ id: id1, name: teamName, player1: player1Name, player2: player2Name, groupName: "" });
    }
    console.log(`   ✓ ${teams.length} teams (${teams.length * 2} players)`);

    console.log(`\n3. Chia bảng (10 bảng A-J, 4 teams/bảng)...`);
    const groupNames = "ABCDEFGHIJ".split("");
    const numGroups = Math.ceil(NUM_PAIRS / 4);
    const teamsPerGroup = 4;
    
    for (let i = 0; i < teams.length; i++) {
      const groupIdx = Math.floor(i / teamsPerGroup);
      teams[i].groupName = groupNames[Math.min(groupIdx, groupNames.length - 1)];
    }
    
    const updates = teams.map((t, i) => 
      `WHEN id = ${t.id} THEN '${t.groupName}'`
    ).join(' ');
    
    await client.query(`
      UPDATE tournament_players 
      SET group_name = CASE ${updates} ELSE group_name END
      WHERE id IN (${teams.map(t => t.id).join(',')})
    `);
    
    console.log(`   ✓ Bảng: ${groupNames.slice(0, numGroups).join(", ")}`);

    console.log(`\n4. Tạo lịch (Circle Method chuẩn)...`);
    let matchOrder = 1;

    for (const group of groupNames.slice(0, numGroups)) {
      const groupTeams = teams.filter(t => t.groupName === group).sort((a, b) => a.name.localeCompare(b.name));
      const numTeams = groupTeams.length;
      
      if (numTeams < 2) continue;

      const rounds = numTeams - 1;
      const half = Math.floor(numTeams / 2);
      const pool = [...groupTeams];
      
      for (let round = 1; round <= rounds; round++) {
        for (let i = 0; i < half; i++) {
          const team1 = pool[i];
          const team2 = pool[numTeams - 1 - i];
          
          if (team1 && team2 && team1.id !== team2.id) {
            await client.query(`
              INSERT INTO tournament_matches 
              (tournament_id, team1_player1, team1_player2, team2_player1, team2_player2, group_name, round, match_order, status, referee_token, court_id)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10)
            `, [tournamentId, team1.player1, team1.player2, team2.player1, team2.player2, group, round, matchOrder++, nanoid(10), (i % NUM_COURTS) + 1]);
          }
        }
        if (round < rounds) {
          const last = pool.pop()!;
          pool.splice(1, 0, last);
        }
      }
    }

    console.log(`   ✓ ${matchOrder - 1} trận`);

    console.log(`\n5. Cập nhật trạng thái...`);
    await client.query(`UPDATE tournaments SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [tournamentId]);

    await client.query("COMMIT");

    console.log("\n" + "=".repeat(55));
    console.log("✅ TẠO GIẢI ĐẤU THÀNH CÔNG!");
    console.log("=".repeat(55));
    console.log(`\n📋 ${TOURNAMENT_NAME}`);
    console.log(`   ID: ${tournamentId} | Level: ${LEVEL} | ${CATEGORY}`);
    console.log(`   Cặp: ${NUM_PAIRS} | Bảng: ${numGroups} | Trận: ${matchOrder - 1} | Sân: ${NUM_COURTS}`);
    console.log(`\n🔗 http://localhost:5173/tournament/${tournamentId}`);

    console.log(`\n📊 Lịch đấu mẫu (Bảng A):`);
    const sample = await client.query(`
      SELECT round, team1_player2, team2_player2, court_id 
      FROM tournament_matches WHERE tournament_id = $1 AND group_name = 'A'
      ORDER BY round, match_order
    `, [tournamentId]);
    
    let currentRound = 0;
    sample.rows.forEach((m: any) => {
      if (m.round !== currentRound) {
        console.log(`\n   Vòng ${m.round}:`);
        currentRound = m.round;
      }
      console.log(`      Sân ${m.court_id}: ${m.team1_player2} vs ${m.team2_player2}`);
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Lỗi:", error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createDemoTournament().catch(console.error);
