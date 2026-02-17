const XLSX = require('xlsx');

const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.aoa_to_sheet([
  ["STT", "Level", "Nội dung", "Tên VĐV 1", "Tên VĐV 2", "Tên VĐV 3", "Tên VĐV 4"],
  [1, "4.2", "Đôi Nam-Nữ", "Nguyễn Văn A", "Trần Thị B", "Lê Văn C", "Phạm Thị D"],
  [2, "4.2", "Đôi Nam-Nữ", "Hoàng Văn E", "Đặng Văn F", "Ngô Văn G", "Vũ Văn H"],
  [3, "4.2", "Đôi Nữ", "Phạm Thị I", "Trần Thị J", "Lê Thị K", "Nguyễn Thị L"],
  [4, "4.4", "Đôi Nam", "Phạm Văn M", "Trần Văn N", "Lê Văn O", "Nguyễn Văn P"],
  [5, "4.4", "Đôi Nam", "Hoàng Văn Q", "Đặng Văn R", "Bùi Văn S", "Đỗ Văn T"],
]);

XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSach");
XLSX.writeFile(workbook, "Mau_Giai_Dau_Pickleball.xlsx");
console.log("✓ Đã tạo file: Mau_Giai_Dau_Pickleball.xlsx");
