import ExcelJS from "exceljs";

async function createTournamentFile() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "System";
  workbook.created = new Date();

  const ws = workbook.addWorksheet("DanhSach");

  ws.columns = [
    { header: "STT", key: "stt", width: 6 },
    { header: "Level", key: "level", width: 10 },
    { header: "Nội dung", key: "category", width: 15 },
    { header: "Tên VĐV 1", key: "p1", width: 22 },
    { header: "Tên VĐV 2", key: "p2", width: 22 },
    { header: "Tên VĐV 3", key: "p3", width: 22 },
    { header: "Tên VĐV 4", key: "p4", width: 22 },
  ];

  // Style header
  ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  ws.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4F81BD" },
  };
  ws.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

  const maleNames = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi", "Đỗ", "Ngô", "Trương", "Dương", "Đinh", "Cao", "Trịnh", "Hà", "Phan", "Lương", "Tạ", "Đoàn"];
  const femaleNames = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi", "Đỗ", "Ngô", "Trương", "Dương", "Đinh", "Cao", "Trịnh", "Hà", "Phan", "Lương", "Tạ", "Đoàn"];
  const lastNames = ["Minh", "Thành", "Hùng", "Dũng", "Tài", "Đức", "Khoa", "Bảo", "Nam", "Phong", "Thuận", "Hòa", "Sơn", "Trung", "Quân", "Phước", "An", "Bình", "Tuấn", "Việt", "Khánh", "Long", "Tùng", "Mạnh", "Thắng", "Lộc", "Phúc", "Hải", "Vinh", "Trí"];

  function getName(isFemale) {
    const first = isFemale ? femaleNames[Math.floor(Math.random() * femaleNames.length)] : maleNames[Math.floor(Math.random() * maleNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${first} ${last}`;
  }

  let stt = 1;

  // 20 cặp Đôi Nam-Nữ (Level 4.2)
  for (let i = 0; i < 20; i++) {
    ws.addRow({
      stt: stt++,
      level: "4.2",
      category: "Đôi Nam-Nữ",
      p1: getName(false),
      p2: getName(true),
      p3: getName(false),
      p4: getName(true),
    });
  }

  // 20 cặp Đôi Nam (Level 4.4)
  for (let i = 0; i < 20; i++) {
    ws.addRow({
      stt: stt++,
      level: "4.4",
      category: "Đôi Nam",
      p1: getName(false),
      p2: getName(false),
      p3: getName(false),
      p4: getName(false),
    });
  }

  // Border for all data rows
  ws.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      row.alignment = { vertical: "middle" };
    }
  });

  await workbook.xlsx.writeFile("/home/runner/workspace/Danh_Sach_VDV_Giai_Dau.xlsx");
  console.log("OK: /home/runner/workspace/Danh_Sach_VDV_Giai_Dau.xlsx");
  console.log("- 20 cặp Đôi Nam-Nữ (4.2)");
  console.log("- 20 cặp Đôi Nam (4.4)");
}

createTournamentFile();
