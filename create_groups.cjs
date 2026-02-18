const ExcelJS = require('exceljs');

async function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

async function createGroups() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('giai_demo_20_cap.xlsx');
  const worksheet = workbook.worksheets[0];
  const data = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      const rowData = {};
      row.eachCell((cell, colNumber) => {
        const header = worksheet.getRow(1).getCell(colNumber).value;
        rowData[header] = cell.value;
      });
      data.push(rowData);
    }
  });

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

  const wbGroups = new ExcelJS.Workbook();
  const wsGroups = wbGroups.addWorksheet("Chia bảng");

  wsGroups.columns = [
    { header: "STT", key: "STT", width: 5 },
    { header: "Bảng", key: "Bảng", width: 10 },
    { header: "Level", key: "Level", width: 8 },
    { header: "Nội dung", key: "Nội dung", width: 15 },
    { header: "Cặp", key: "Cặp", width: 5 },
    { header: "Tên VĐV 1", key: "Tên VĐV 1", width: 20 },
    { header: "Tên VĐV 2", key: "Tên VĐV 2", width: 20 },
  ];

  wsGroups.getRow(1).font = { bold: true };

  allGroups.forEach(row => {
    wsGroups.addRow(row);
  });

  await wbGroups.xlsx.writeFile("giai_demo_chia_bang.xlsx");
  console.log("\n\n✅ Đã tạo file chia bảng: giai_demo_chia_bang.xlsx");
}

createGroups();
