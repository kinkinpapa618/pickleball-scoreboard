import ExcelJS from "exceljs";
import fs from "fs";

async function verifyFile() {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile("/home/runner/workspace/Danh_Sach_VDV_Giai_Dau.xlsx");
  const worksheet = workbook.worksheets[0];

  console.log("=== THÔNG TIN FILE ===");
  console.log("Số dòng:", worksheet.rowCount);
  console.log("Số cột:", worksheet.columnCount);

  console.log("\n=== HEADER (Dòng 1) ===");
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    console.log(`Cột ${colNumber}: "${cell.value}"`);
  });

  console.log("\n=== 5 DÒNG ĐẦU TIÊN ===");
  for (let i = 1; i <= 5; i++) {
    const row = worksheet.getRow(i);
    const values = [];
    row.eachCell((cell) => {
      values.push(cell.value);
    });
    console.log(`Dòng ${i}:`, values);
  }

  console.log("\n=== 5 DÒNG CUỐI ===");
  for (let i = worksheet.rowCount - 4; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    const values = [];
    row.eachCell((cell) => {
      values.push(cell.value);
    });
    console.log(`Dòng ${i}:`, values);
  }

  // Count by level and category
  let count42 = 0;
  let count44 = 0;
  let countNamNu = 0;
  let countNam = 0;

  for (let i = 2; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    const level = row.getCell(2)?.value;
    const category = row.getCell(3)?.value;

    if (level === "4.2") count42++;
    if (level === "4.4") count44++;
    if (category === "Đôi Nam-Nữ") countNamNu++;
    if (category === "Đôi Nam") countNam++;
  }

  console.log("\n=== THỐNG KÊ ===");
  console.log("Level 4.2:", count42, "cặp");
  console.log("Level 4.4:", count44, "cặp");
  console.log("Đôi Nam-Nữ:", countNamNu, "cặp");
  console.log("Đôi Nam:", countNam, "cặp");
  console.log("Tổng cặp:", worksheet.rowCount - 1);
}

verifyFile();
