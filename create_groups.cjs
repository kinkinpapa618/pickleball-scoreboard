const XLSX = require('xlsx');

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const workbook = XLSX.readFile('giai_demo_20_cap.xlsx');
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(worksheet);

const groupConfigs = [
  { level: "4.2", category: "Đôi Nam-Nữ", groups: 2 },
  { level: "4.2", category: "Đôi Nữ", groups: 2 },
  { level: "4.4", category: "Đôi Nam", groups: 2 }
];

const groupLetters = "ABCDEFGHIJKLMNOP";
let groupIndex = 0;
const allGroups = [];

groupConfigs.forEach(config => {
  const pairs = data.filter(d => d.Level === config.level && d["Nội dung"] === config.category);
  const shuffledPairs = shuffleArray(pairs);
  
  console.log(`\n=== ${config.level} - ${config.category} ===`);
  console.log(`Tổng cặp: ${shuffledPairs.length}, Số bảng: ${config.groups}`);
  
  const pairsPerGroup = Math.ceil(shuffledPairs.length / config.groups);
  
  for (let g = 0; g < config.groups; g++) {
    const groupName = `${config.level}-${groupLetters[groupIndex]}`;
    groupIndex++;
    const start = g * pairsPerGroup;
    const end = Math.min(start + pairsPerGroup, shuffledPairs.length);
    const groupPairs = shuffledPairs.slice(start, end);
    
    console.log(`\n📦 Bảng ${groupName} (${groupPairs.length} cặp):`);
    groupPairs.forEach((pair, idx) => {
      console.log(`  ${idx + 1}. ${pair["Tên VĐV 1"]} - ${pair["Tên VĐV 2"]}`);
      
      allGroups.push({
        "STT": allGroups.length + 1,
        "Bảng": groupName,
        "Level": config.level,
        "Nội dung": config.category,
        "Cặp": pair["STT"],
        "Tên VĐV 1": pair["Tên VĐV 1"],
        "Tên VĐV 2": pair["Tên VĐV 2"]
      });
    });
  }
});

const wsGroups = XLSX.utils.json_to_sheet(allGroups);
wsGroups["!cols"] = [
  { wch: 5 },  // STT
  { wch: 10 }, // Bảng
  { wch: 8 },  // Level
  { wch: 15 }, // Nội dung
  { wch: 5 },  // Cặp
  { wch: 20 }, // Tên VĐV 1
  { wch: 20 }, // Tên VĐV 2
];

const wbGroups = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wbGroups, wsGroups, "Chia bảng");
XLSX.writeFile(wbGroups, "giai_demo_chia_bang.xlsx");

console.log("\n\n✅ Đã tạo file chia bảng: giai_demo_chia_bang.xlsx");
