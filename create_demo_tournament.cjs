const ExcelJS = require('exceljs');

const firstNames = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Đặng", "Bùi", "Đỗ", "Ngô", "Vũ", "Phan", "Trương", "Võ", "Đinh", "Huỳnh"];
const lastNames = ["Minh", "Hùng", "An", "Bảo", "Long", "Nam", "Khoa", "Phúc", "Thành", "Việt", "Dũng", "Tân", "Huy", "Lâm", "Phong", "Tuấn", "Khôi", "Ngọc", "Minh", "Quân"];

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

const levels = [
  {
    level: "4.2",
    categories: ["Đôi Nam-Nữ", "Đôi Nữ"],
    playersPerCategory: 10
  },
  {
    level: "4.4",
    categories: ["Đôi Nam"],
    playersPerCategory: 20
  }
];

const allData = [];
let stt = 1;
let sttByLevel = {};

levels.forEach(lvl => {
  sttByLevel[lvl.level] = 1;
});

levels.forEach(lvl => {
  lvl.categories.forEach(cat => {
    console.log(`\n=== Level ${lvl.level} - ${cat} ===`);
    
    const players = [];
    for (let i = 0; i < lvl.playersPerCategory; i++) {
      players.push({
        id: `VDV-${stt}`,
        name: randomName(),
        level: lvl.level,
        category: cat
      });
      stt++;
    }

    const shuffledPlayers = shuffleArray(players);
    const pairs = [];
    
    for (let i = 0; i < shuffledPlayers.length; i += 2) {
      if (shuffledPlayers[i + 1]) {
        const pair = {
          "STT": sttByLevel[lvl.level]++,
          "Level": lvl.level,
          "Nội dung": cat,
          "Tên VĐV 1": shuffledPlayers[i].name,
          "Tên VĐV 2": shuffledPlayers[i + 1].name,
          "ID VĐV 1": shuffledPlayers[i].id,
          "ID VĐV 2": shuffledPlayers[i + 1].id
        };
        pairs.push(pair);
        console.log(`Cặp ${pair["STT"]}: ${pair["Tên VĐV 1"]} - ${pair["Tên VĐV 2"]}`);
        allData.push(pair);
      }
    }
  });
});

console.log(`\n=== TỔNG KẾT ===`);
console.log(`Tổng số cặp: ${allData.length}`);

const level4_2 = allData.filter(d => d.Level === "4.2");
const level4_4 = allData.filter(d => d.Level === "4.4");
console.log(`\n📋 Level 4.2: ${level4_2.length} cặp`);
console.log(`   - Đôi Nam-Nữ: ${level4_2.filter(d => d["Nội dung"] === "Đôi Nam-Nữ").length} cặp`);
console.log(`   - Đôi Nữ: ${level4_2.filter(d => d["Nội dung"] === "Đôi Nữ").length} cặp`);
console.log(`\n📋 Level 4.4: ${level4_4.length} cặp`);
console.log(`   - Đôi Nam: ${level4_4.filter(d => d["Nội dung"] === "Đôi Nam").length} cặp`);

async function createExcel() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Danh sách cặp");

  worksheet.columns = [
    { header: "STT", key: "STT", width: 5 },
    { header: "Level", key: "Level", width: 8 },
    { header: "Nội dung", key: "Nội dung", width: 15 },
    { header: "Tên VĐV 1", key: "Tên VĐV 1", width: 20 },
    { header: "Tên VĐV 2", key: "Tên VĐV 2", width: 20 },
    { header: "ID VĐV 1", key: "ID VĐV 1", width: 10 },
    { header: "ID VĐV 2", key: "ID VĐV 2", width: 10 },
  ];

  worksheet.getRow(1).font = { bold: true };

  allData.forEach(row => {
    worksheet.addRow(row);
  });

  await workbook.xlsx.writeFile("giai_demo_20_cap.xlsx");
  console.log("\n✓ Đã lưu file: giai_demo_20_cap.xlsx");
}

createExcel();
