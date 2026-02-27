import "dotenv/config";
import { db } from "./server/db";
import { matches, users, tournaments, tournamentPlayers, tournamentMatches, settings, chats, managerConnections, notifications, workSchedules, players, courts } from "./drizzle/schema";
import { eq } from "drizzle-orm";

async function exportData() {
  console.log("📤 Đang export dữ liệu từ Neon...");
  
  try {
    // Export all tables
    const data: any = {};
    
    console.log("1. Export users...");
    data.users = await db.select().from(users);
    
    console.log("2. Export players...");
    data.players = await db.select().from(players);
    
    console.log("3. Export courts...");
    data.courts = await db.select().from(courts);
    
    console.log("4. Export matches...");
    data.matches = await db.select().from(matches);
    
    console.log("5. Export tournaments...");
    data.tournaments = await db.select().from(tournaments);
    
    console.log("6. Export tournamentPlayers...");
    data.tournamentPlayers = await db.select().from(tournamentPlayers);
    
    console.log("7. Export tournamentMatches...");
    data.tournamentMatches = await db.select().from(tournamentMatches);
    
    console.log("8. Export settings...");
    data.settings = await db.select().from(settings);
    
    console.log("9. Export chats...");
    data.chats = await db.select().from(chats);
    
    console.log("10. Export managerConnections...");
    data.managerConnections = await db.select().from(managerConnections);
    
    console.log("11. Export notifications...");
    data.notifications = await db.select().from(notifications);
    
    console.log("12. Export workSchedules...");
    data.workSchedules = await db.select().from(workSchedules);
    
    console.log("\n📊 Thống kê dữ liệu:");
    console.log(`- Users: ${data.users.length}`);
    console.log(`- Players: ${data.players.length}`);
    console.log(`- Courts: ${data.courts.length}`);
    console.log(`- Matches: ${data.matches.length}`);
    console.log(`- Tournaments: ${data.tournaments.length}`);
    console.log(`- TournamentPlayers: ${data.tournamentPlayers.length}`);
    console.log(`- TournamentMatches: ${data.tournamentMatches.length}`);
    console.log(`- Settings: ${data.settings.length}`);
    console.log(`- Chats: ${data.chats.length}`);
    console.log(`- ManagerConnections: ${data.managerConnections.length}`);
    console.log(`- Notifications: ${data.notifications.length}`);
    console.log(`- WorkSchedules: ${data.workSchedules.length}`);
    
    // Save to file
    const fs = await import('fs');
    fs.writeFileSync('./exported-data.json', JSON.stringify(data, null, 2));
    console.log("\n✅ Đã lưu vào file: exported-data.json");
    
  } catch (error) {
    console.error("❌ Lỗi export:", error);
  }
  
  process.exit(0);
}

exportData();
