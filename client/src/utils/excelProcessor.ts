import ExcelJS from "exceljs";
import { PlayerData } from "@/components/ExcelUpload";

export async function processExcel(fileData: ArrayBuffer, level: string): Promise<PlayerData[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileData);
  const worksheet = workbook.worksheets[0];

  const rows: any[] = [];
  worksheet.eachRow((row) => {
    const values = [];
    for (let i = 1; i <= row.cellCount; i++) {
      values.push(row.getCell(i).value);
    }
    rows.push(values);
  });

  if (rows.length < 2) return [];

  const headers: string[] = rows[0].map((h: any) => String(h || "").toLowerCase().trim());
  
  const players: PlayerData[] = [];
  const p1Idx = headers.findIndex(h => h.includes("vđv 1") || h.includes("tên vđv 1") || h.includes("player1") || h.includes("tên vdv 1"));
  const level1Idx = headers.findIndex(h => h.includes("level vdv1") || h.includes("level vđv1"));
  const p2Idx = headers.findIndex(h => h.includes("vđv 2") || h.includes("tên vđv 2") || h.includes("player2") || h.includes("tên vdv 2"));
  const level2Idx = headers.findIndex(h => h.includes("level vdv2") || h.includes("level vđv2"));
  const catIdx = headers.findIndex(h => h.includes("nội dung"));
  const seedIdx = headers.findIndex(h => h.includes("hạt giống") || h.includes("seed"));
  const sttIdx = headers.findIndex(h => h.includes("stt"));

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const p1 = p1Idx >= 0 && row[p1Idx] ? String(row[p1Idx]).trim() : "";
    const p2 = p2Idx >= 0 && row[p2Idx] ? String(row[p2Idx]).trim() : "";
    
    if (!p1 && !p2) continue;

    const category = catIdx >= 0 && row[catIdx] ? String(row[catIdx]).trim() : "";
    const level1 = level1Idx >= 0 && row[level1Idx] ? String(row[level1Idx]).trim() : level;
    const level2 = level2Idx >= 0 && row[level2Idx] ? String(row[level2Idx]).trim() : level;
    const seed = seedIdx >= 0 && row[seedIdx] ? (row[seedIdx] === 1 || row[seedIdx] === "1" ? 1 : undefined) : undefined;
    const pairIndex = sttIdx >= 0 && row[sttIdx] ? Number(row[sttIdx]) : i;

    players.push({
      player1: p1 || undefined,
      player2: p2 || undefined,
      level1: level1 || undefined,
      level2: level2 || undefined,
      category: category || undefined,
      pairIndex: pairIndex,
      seed: seed,
    });
  }

  return players;
}
