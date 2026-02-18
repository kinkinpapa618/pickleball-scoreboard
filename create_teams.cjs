const ExcelJS = require('exceljs');

const teams = [];
const teamNames = [
  "Đội Thiên Thanh", "Đội Hồng Phấn", "Đội Xanh Lá", "Đội Tím Son",
  "Đội Cam Óng", "Đội Bạc Kim", "Đội Vàng Đồng", "Đội Lục Bảo",
  "Đội Ngọc Lam", "Đội Hổ Phách", "Đội Bạch Kim", "Đội Hoàng Kim",
  "Đội Ngân Quang", "Đội Thanh Đồng", "Đội Tinh Thể", "Đội Nguyệt Quang",
  "Đội Nhật Nguyệt", "Đội Tinh Vân", "Đội Ngân Hà", "Đội Thiên Hà"
];

const firstNames = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Đặng", "Bùi", "Đỗ", "Ngô", "Vũ"];
const lastNames = ["Minh", "Hùng", "An", "Bảo", "Long", "Nam", "Khoa", "Phúc", "Thành", "Việt", "Dũng", "Tân", "Huy", "Lâm", "Phong"];

function randomName() {
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}

async function createTeams() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Danh sách đội");

  worksheet.columns = [
    { header: "STT", key: "STT", width: 5 },
    { header: "Tên đội", key: "Tên đội", width: 25 },
    { header: "Thành viên 1", key: "Thành viên 1", width: 25 },
    { header: "Thành viên 2", key: "Thành viên 2", width: 25 },
  ];

  worksheet.getRow(1).font = { bold: true };

  teamNames.forEach((teamName, index) => {
    worksheet.addRow({
      "STT": index + 1,
      "Tên đội": teamName,
      "Thành viên 1": randomName(),
      "Thành viên 2": randomName()
    });
  });

  await workbook.xlsx.writeFile("danh_sach_doi_tournament.xlsx");
  console.log("Đã tạo file danh_sach_doi_tournament.xlsx với 20 đội!");
}

createTeams();
