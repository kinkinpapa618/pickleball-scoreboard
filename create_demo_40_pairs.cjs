const ExcelJS = require('exceljs');

const firstNames = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Đặng", "Bùi", "Đỗ", "Ngô", "Vũ", "Phan", "Trương", "Võ", "Đinh", "Huỳnh", "Lý", "Trịnh", "Đào", "Thái", "Ngụy"];
const lastNames = ["Minh", "Hùng", "An", "Bảo", "Long", "Nam", "Khoa", "Phúc", "Thành", "Việt", "Dũng", "Tân", "Huy", "Lâm", "Phong", "Tuấn", "Khôi", "Ngọc", "Minh", "Quân", "Tuấn", "Hải", "Văn", "Sơn", "Thanh", "Bình", "Trung", "Hiếu", "Nghĩa", "Đức"];

function randomName() {
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function generateId() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

async function createDemoTournament() {
  const NUM_PAIRS = 40;
  const LEVEL = "4.4";
  const CATEGORY = "Đôi Nam-Nữ";
  
  console.log("=== TẠO GIẢI ĐẤU DEMO ===");
  console.log(`Số cặp: ${NUM_PAIRS}`);
  console.log(`Level: ${LEVEL}`);
  console.log(`Nội dung: ${CATEGORY}`);
  console.log("");

  const players = [];
  for (let i = 0; i < NUM_PAIRS * 2; i++) {
    players.push({
      id: generateId(),
      name: randomName(),
      level: LEVEL,
      gender: i % 2 === 0 ? "Nam" : "Nữ"
    });
  }

  const shuffledPlayers = shuffleArray(players);
  const pairs = [];
  
  for (let i = 0; i < shuffledPlayers.length; i += 2) {
    if (shuffledPlayers[i + 1]) {
      const pair = {
        "STT": Math.floor(i / 2) + 1,
        "Level": LEVEL,
        "Nội dung": CATEGORY,
        "ID VĐV 1": shuffledPlayers[i].id,
        "Tên VĐV 1": shuffledPlayers[i].name,
        "Giới tính 1": shuffledPlayers[i].gender,
        "ID VĐV 2": shuffledPlayers[i + 1].id,
        "Tên VĐV 2": shuffledPlayers[i + 1].name,
        "Giới tính 2": shuffledPlayers[i + 1].gender
      };
      pairs.push(pair);
    }
  }

  console.log("=== DANH SÁCH CẶP ĐẤU ===");
  pairs.forEach(pair => {
    console.log(`Cặp ${String(pair["STT"]).padStart(2, '0')}: ${pair["Tên VĐV 1"]} (${pair["Giới tính 1"]}) - ${pair["Tên VĐV 2"]} (${pair["Giới tính 2"]})`);
  });

  console.log(`\n=== CHIA BẢNG TỰ ĐỘNG ===`);
  const numGroups = Math.ceil(NUM_PAIRS / 4);
  const pairsPerGroup = Math.ceil(NUM_PAIRS / numGroups);
  
  console.log(`Số bảng: ${numGroups}`);
  console.log(`Cặp/bảng: ~${Math.ceil(NUM_PAIRS / numGroups)}`);

  const shuffledPairs = shuffleArray([...pairs]);
  const groups = {};
  const groupNames = "ABCDEFGHIJKLMNOP".split("");

  for (let i = 0; i < shuffledPairs.length; i++) {
    const groupIdx = Math.floor(i / pairsPerGroup);
    const groupName = `${LEVEL}-${groupNames[groupIdx]}`;
    
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push({
      ...shuffledPairs[i],
      "Bảng": groupName
    });
  }

  Object.keys(groups).forEach(groupName => {
    console.log(`\n📦 ${groupName} (${groups[groupName].length} cặp):`);
    groups[groupName].forEach((pair, idx) => {
      console.log(`   ${idx + 1}. ${pair["Tên VĐV 1"]} - ${pair["Tên VĐV 2"]}`);
    });
  });

  console.log(`\n=== TẠO LỊCH THI ĐẤU (Round Robin trong bảng) ===`);
  const allMatches = [];

  Object.keys(groups).forEach(groupName => {
    const groupPairs = groups[groupName];
    const numTeams = groupPairs.length;
    const rounds = numTeams - 1;
    const half = Math.ceil(numTeams / 2);

    const teamPool = groupPairs.map(p => ({ ...p }));
    
    for (let round = 1; round <= rounds; round++) {
      for (let i = 0; i < half; i++) {
        const team1 = teamPool[i];
        const team2 = teamPool[numTeams - 1 - i];
        
        if (team1 && team2) {
          const match = {
            "Vòng": round,
            "Bảng": groupName,
            "Trận": i + 1,
            "Cặp 1 STT": team1["STT"],
            "Cặp 1 VĐV 1": team1["Tên VĐV 1"],
            "Cặp 1 VĐV 2": team1["Tên VĐV 2"],
            "Cặp 2 STT": team2["STT"],
            "Cặp 2 VĐV 1": team2["Tên VĐV 1"],
            "Cặp 2 VĐV 2": team2["Tên VĐV 2"],
            "Tỷ số": "",
            "Người thắng": ""
          };
          allMatches.push(match);
          console.log(`   ${groupName} - V${round}: ${team1["Tên VĐV 1"]}/${team1["Tên VĐV 2"]} vs ${team2["Tên VĐV 1"]}/${team2["Tên VĐV 2"]}`);
        }
      }
      teamPool.splice(1, 0, teamPool.pop());
    }
  });

  const wb = new ExcelJS.Workbook();
  
  const wsPairs = wb.addWorksheet("Danh sách cặp");
  wsPairs.columns = [
    { header: "STT", key: "STT", width: 5 },
    { header: "Level", key: "Level", width: 8 },
    { header: "Nội dung", key: "Nội dung", width: 15 },
    { header: "ID VĐV 1", key: "ID VĐV 1", width: 12 },
    { header: "Tên VĐV 1", key: "Tên VĐV 1", width: 20 },
    { header: "Giới tính 1", key: "Giới tính 1", width: 10 },
    { header: "ID VĐV 2", key: "ID VĐV 2", width: 12 },
    { header: "Tên VĐV 2", key: "Tên VĐV 2", width: 20 },
    { header: "Giới tính 2", key: "Giới tính 2", width: 10 },
  ];
  wsPairs.getRow(1).font = { bold: true };
  pairs.forEach(row => wsPairs.addRow(row));

  const wsGroups = wb.addWorksheet("Chia bảng");
  wsGroups.columns = [
    { header: "STT", key: "STT", width: 5 },
    { header: "Bảng", key: "Bảng", width: 10 },
    { header: "Level", key: "Level", width: 8 },
    { header: "Nội dung", key: "Nội dung", width: 15 },
    { header: "ID VĐV 1", key: "ID VĐV 1", width: 12 },
    { header: "Tên VĐV 1", key: "Tên VĐV 1", width: 20 },
    { header: "ID VĐV 2", key: "ID VĐV 2", width: 12 },
    { header: "Tên VĐV 2", key: "Tên VĐV 2", width: 20 },
  ];
  wsGroups.getRow(1).font = { bold: true };
  Object.values(groups).flat().forEach(row => wsGroups.addRow(row));

  const wsSchedule = wb.addWorksheet("Lịch thi đấu");
  wsSchedule.columns = [
    { header: "Vòng", key: "Vòng", width: 8 },
    { header: "Bảng", key: "Bảng", width: 10 },
    { header: "Trận", key: "Trận", width: 8 },
    { header: "Cặp 1 STT", key: "Cặp 1 STT", width: 10 },
    { header: "Cặp 1 VĐV 1", key: "Cặp 1 VĐV 1", width: 18 },
    { header: "Cặp 1 VĐV 2", key: "Cặp 1 VĐV 2", width: 18 },
    { header: "Cặp 2 STT", key: "Cặp 2 STT", width: 10 },
    { header: "Cặp 2 VĐV 1", key: "Cặp 2 VĐV 1", width: 18 },
    { header: "Cặp 2 VĐV 2", key: "Cặp 2 VĐV 2", width: 18 },
    { header: "Tỷ số", key: "Tỷ số", width: 12 },
    { header: "Người thắng", key: "Người thắng", width: 10 },
  ];
  wsSchedule.getRow(1).font = { bold: true };
  allMatches.forEach(row => wsSchedule.addRow(row));

  await wb.xlsx.writeFile("giai_demo_40_cap_44_mix.xlsx");
  
  console.log("\n=== TỔNG KẾT ===");
  console.log(`✅ Tổng cặp: ${pairs.length}`);
  console.log(`✅ Số bảng: ${Object.keys(groups).length}`);
  console.log(`✅ Tổng trận: ${allMatches.length}`);
  console.log(`✅ File: giai_demo_40_cap_44_mix.xlsx`);
  console.log(`\n📋 Cấu hình giải đấu:`);
  console.log(`   - Level: ${LEVEL}`);
  console.log(`   - Nội dung: ${CATEGORY}`);
  console.log(`   - Format: Chia bảng + Vòng tròn trong bảng`);
}

createDemoTournament().catch(console.error);
