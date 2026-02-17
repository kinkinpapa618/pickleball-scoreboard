const XLSX = require('xlsx');

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

teamNames.forEach((teamName, index) => {
  teams.push({
    "STT": index + 1,
    "Tên đội": teamName,
    "Thành viên 1": randomName(),
    "Thành viên 2": randomName()
  });
});

const worksheet = XLSX.utils.json_to_sheet(teams);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Danh sách đội");

XLSX.writeFile(workbook, "danh_sach_doi_tournament.xlsx");
console.log("Đã tạo file danh_sach_doi_tournament.xlsx với 20 đội!");
