const XLSX = require('xlsx');

const maleNames = ["Minh", "Hùng", "An", "Bảo", "Long", "Nam", "Khoa", "Phúc", "Thành", "Việt", "Dũng", "Tân", "Huy", "Lâm", "Phong", "Tuấn", "Khôi", "Ngọc", "Minh", "Quân", "Sơn", "Hải", "Đạt", "Vinh", "Bình", "Trung", "Thắng", "Tài", "Phát", "Hoàng"];
const femaleNames = ["Thị", "Lan", "Hương", "Hà", "Linh", "Ngọc", "Mai", "Phương", "Trang", "Ly", "Yến", "Duyên", "Thủy", "Liên", "Hồng", "Vân", "Kim", "Ngân", "Quỳnh", "Tâm"];

function randomName(isFemale = false) {
  if (isFemale) {
    return `Trần ${femaleNames[Math.floor(Math.random() * femaleNames.length)]} ${femaleNames[Math.floor(Math.random() * femaleNames.length)]}`;
  }
  return `Nguyễn ${maleNames[Math.floor(Math.random() * maleNames.length)]} ${maleNames[Math.floor(Math.random() * maleNames.length)]}`;
}

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Cấu hình giải đấu
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
    
    let players1, players2;
    
    if (cat === "Đôi Nam") {
      // Nam vs Nam: 4 nam
      players1 = [randomName(false), randomName(false)];
      players2 = [randomName(false), randomName(false)];
    } else if (cat === "Đôi Nam-Nữ") {
      // Nam-Nữ vs Nam-Nữ: 2 nam + 2 nữ
      players1 = [randomName(false), randomName(true)];
      players2 = [randomName(false), randomName(true)];
    } else {
      // Hỗn hợp vs Hỗn hợp: 2 nam + 2 nữ
      players1 = [randomName(false), randomName(true)];
      players2 = [randomName(false), randomName(true)];
    }
    
    // Tạo các cặp đấu
    for (let i = 0; i < pairsPerCategory; i++) {
      // Mỗi cặp đấu gồm 2 đội, mỗi đội 2 người
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

// Tạo Excel
const worksheet = XLSX.utils.json_to_sheet(allData);

worksheet["!cols"] = [
  { wch: 5 },   // STT
  { wch: 8 },   // Level
  { wch: 18 },  // Nội dung
  { wch: 18 },  // Tên VĐV 1
  { wch: 18 },  // Tên VĐV 2
  { wch: 18 },  // Tên VĐV 3
  { wch: 18 },  // Tên VĐV 4
];

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách cặp");

XLSX.writeFile(workbook, "giai_test_30_cap.xlsx");
console.log("\n✅ Đã lưu file: giai_test_30_cap.xlsx");
