const ExcelJS = require('exceljs');

async function createTemplate() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("DanhSach");

  worksheet.columns = [
    { header: "STT", key: "STT", width: 5 },
    { header: "Level", key: "Level", width: 10 },
    { header: "Nội dung", key: "Nội dung", width: 15 },
    { header: "Tên VĐV 1", key: "player1", width: 20 },
    { header: "Tên VĐV 2", key: "player2", width: 20 },
  ];

  worksheet.getRow(1).font = { bold: true };

  worksheet.addRow({ STT: 1, Level: "4.2", Nội dung: "Đôi Nam-Nữ", player1: "Nguyễn Văn A", player2: "Trần Thị B" });
  worksheet.addRow({ STT: 2, Level: "4.2", Nội dung: "Đôi Nam-Nữ", player1: "Hoàng Văn E", player2: "Đặng Văn F" });
  worksheet.addRow({ STT: 3, Level: "4.2", Nội dung: "Đôi Nữ", player1: "Phạm Thị I", player2: "Trần Thị J" });
  worksheet.addRow({ STT: 4, Level: "4.4", Nội dung: "Đôi Nam", player1: "Phạm Văn M", player2: "Trần Văn N" });
  worksheet.addRow({ STT: 5, Level: "4.4", Nội dung: "Đôi Nam", player1: "Hoàng Văn Q", player2: "Đặng Văn R" });

  await workbook.xlsx.writeFile("Mau_Giai_Dau_Pickleball.xlsx");
  console.log("✓ Đã tạo file: Mau_Giai_Dau_Pickleball.xlsx");
}

createTemplate();
