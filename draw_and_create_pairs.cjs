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

async function createPairs() {
  const athletes = [];
  for (let i = 0; i < 40; i++) {
    athletes.push({
      "STT": i + 1,
      "Tên VĐV": randomName()
    });
  }

  const shuffledAthletes = shuffleArray(athletes);

  const pairs = [];
  for (let i = 0; i < 20; i++) {
    pairs.push({
      "Cặp": i + 1,
      "VĐV 1": shuffledAthletes[i * 2]["Tên VĐV"],
      "VĐV 2": shuffledAthletes[i * 2 + 1]["Tên VĐV"]
    });
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("20 cặp VĐV");

  worksheet.columns = [
    { header: "Cặp", key: "Cặp", width: 5 },
    { header: "VĐV 1", key: "VĐV 1", width: 25 },
    { header: "VĐV 2", key: "VĐV 2", width: 25 },
  ];

  worksheet.getRow(1).font = { bold: true };

  pairs.forEach(pair => {
    worksheet.addRow(pair);
  });

  await workbook.xlsx.writeFile("mau_20_cap_vdv.xlsx");
  console.log("Đã tạo file mau_20_cap_vdv.xlsx với 20 cặp VĐV!");
  console.log("\nDanh sách các cặp:");
  pairs.forEach(pair => {
    console.log("Cặp " + pair.Cặp + ": " + pair["VĐV 1"] + " - " + pair["VĐV 2"]);
  });
}

createPairs();
