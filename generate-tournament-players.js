import ExcelJS from "exceljs";
import fs from "fs";

async function generateTournamentFile() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("DanhSach");

  worksheet.addRow(["STT", "Level", "Nội dung", "Tên VĐV 1", "Tên VĐV 2", "Tên VĐV 3", "Tên VĐV 4"]);

  const maleNames = [
    "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi",
    "Đỗ", "Ngô", "Trương", "Dương", "Đinh", "Cao", "Trịnh", "Hà",
    "Phan", "Lương", "Tạ", "Đoàn"
  ];

  const femaleNames = [
    "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Vũ", "Đặng", "Bùi",
    "Đỗ", "Ngô", "Trương", "Dương", "Đinh", "Cao", "Trịnh", "Hà",
    "Phan", "Lương", "Tạ", "Đoàn"
  ];

  const lastNames = [
    "Minh", "Thành", "Hùng", "Dũng", "Tài", "Đức", "Khoa", "Bảo", "Nam", "Phong",
    "Thuận", "Hòa", "Sơn", "Trung", "Quân", "Phước", "An", "Bình", "Tuấn", "Việt",
    "Khánh", "Long", "Tùng", "Mạnh", "Thắng", "Lộc", "Phúc", "Hải", "Vinh", "Trí"
  ];

  function randomName(isFemale) {
    const firstPart = isFemale 
      ? femaleNames[Math.floor(Math.random() * femaleNames.length)] 
      : maleNames[Math.floor(Math.random() * maleNames.length)];
    const lastPart = lastNames[Math.floor(Math.random() * lastNames.length)];
    return `${firstPart} ${lastPart}`;
  }

  let stt = 1;

  // 20 cặp Đôi Nam-Nữ (Level 4.2)
  for (let i = 0; i < 20; i++) {
    const male1 = randomName(false);
    const female1 = randomName(true);
    const male2 = randomName(false);
    const female2 = randomName(true);
    worksheet.addRow([stt++, "4.2", "Đôi Nam-Nữ", male1, female1, male2, female2]);
  }

  // 20 cặp Đôi Nam (Level 4.4)
  for (let i = 0; i < 20; i++) {
    const male1 = randomName(false);
    const male2 = randomName(false);
    const male3 = randomName(false);
    const male4 = randomName(false);
    worksheet.addRow([stt++, "4.4", "Đôi Nam", male1, male2, male3, male4]);
  }

  // Format header
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF4F81BD" }
  };
  headerRow.font = { color: { argb: "FFFFFFFF" }, bold: true };

  // Set column widths
  worksheet.getColumn("A").width = 6;
  worksheet.getColumn("B").width = 10;
  worksheet.getColumn("C").width = 15;
  worksheet.getColumn("D").width = 22;
  worksheet.getColumn("E").width = 22;
  worksheet.getColumn("F").width = 22;
  worksheet.getColumn("G").width = 22;

  await workbook.xlsx.writeFile("/home/runner/workspace/Danh_Sach_VDV_Giai_Dau.xlsx");

  console.log("Đã tạo file: /home/runner/workspace/Danh_Sach_VDV_Giai_Dau.xlsx");
  console.log("- 20 cặp Đôi Nam-Nữ (Level 4.2)");
  console.log("- 20 cặp Đôi Nam (Level 4.4)");
}

generateTournamentFile();
