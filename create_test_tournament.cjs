const ExcelJS = require('exceljs');

const maleNames = ["Minh", "Hùng", "An", "Bảo", "Long", "Nam", "Khoa", "Phúc", "Thành", "Việt", "Dũng", "Tân", "Huy", "Lâm", "Phong", "Tuấn", "Khôi", "Ngọc", "Minh", "Quân", "Sơn", "Hải", "Đạt", "Vinh", "Bình", "Trung", "Thắng", "Tài", "Phát", "Hoàng"];
const femaleNames = ["Thị", "Lan", "Hương", "Hà", "Linh", "Ngọc", "Mai", "Phương", "Trang", "Ly", "Yến", "Duyên", "Thủy", "Liên", "Hồng", "Vân", "Kim", "Ngân", "Quỳnh", "Tâm"];

function randomName(isFemale = false) {
  if (isFemale) {
    return `Trần ${femaleNames[Math.floor(Math.random() * femaleNames.length)]} ${femaleNames[Math.floor(Math.random() * femaleNames.length)]}`;
  }
  return `Nguyễn ${maleNames[Math.floor(Math.random() * maleNames.length)]} ${maleNames[Math.floor(Math.random() * maleNames.length)]}`;
}

const levels = [
  { level: "4.8", categories: ["Đôi Nam", "Đôi Nam-Nữ", "Đôi Hỗn Hợp"] },
  { level: "5.2", categories: ["Đôi Nam", "Đôi Nam-Nữ", "Đôi Hỗn Hợp"] }
];

const pairsPerCategory = 5;
const totalPairs = levels.length * levels[0].categories.length * pairsPerCategory;

console.log(`Tạo giải với ${totalPairs} cặp (${totalPairs * 2 * 2} người)`);
console.log("==========================================");

const allData = [];
let stt = 1;

levels.forEach(lvl => {
  lvl.categories.forEach(cat => {
    console.log(`\n=== Level ${lvl.level} - ${cat} ===`);
    
    for (let i = 0; i < pairsPerCategory; i++) {
      const p1 = randomName(cat === "Đôi Nam" ? false : Math.random() > 0.5);
      const p2 = randomName(cat === "Đôi Nam" ? false : Math.random() > 0.5);
      const p3 = randomName(cat === "Đôi Nam" ? false : Math.random() > 0.5);
      const p4 = randomName(cat === "Đôi Nam" ? false : Math.random() > 0.5);
      
      const pair = {
        "STT": stt,
        "Level": lvl.level,
        "Nội dung": cat,
        "Tên VĐV 1": p1,
        "Tên VĐV 2": p2,
        "Tên VĐV 3": p3,
        "Tên VĐV 4": p4
      };
      console.log(`Cặp ${stt}: ${p1}/${p2} vs ${p3}/${p4}`);
      allData.push(pair);
      stt++;
    }
  });
});

console.log(`\n==========================================`);
console.log(`TỔNG KẾT:`);
console.log(`Tổng số cặp: ${allData.length}`);
console.log(`Tổng số người: ${allData.length * 4}`);

async function createExcel() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Danh sách cặp");

  worksheet.columns = [
    { header: "STT", key: "STT", width: 5 },
    { header: "Level", key: "Level", width: 8 },
    { header: "Nội dung", key: "Nội dung", width: 18 },
    { header: "Tên VĐV 1", key: "Tên VĐV 1", width: 18 },
    { header: "Tên VĐV 2", key: "Tên VĐV 2", width: 18 },
    { header: "Tên VĐV 3", key: "Tên VĐV 3", width: 18 },
    { header: "Tên VĐV 4", key: "Tên VĐV 4", width: 18 },
  ];

  worksheet.getRow(1).font = { bold: true };

  allData.forEach(row => {
    worksheet.addRow(row);
  });

  await workbook.xlsx.writeFile("giai_test_30_cap.xlsx");
  console.log("\n✅ Đã lưu file: giai_test_30_cap.xlsx");
}

createExcel();
