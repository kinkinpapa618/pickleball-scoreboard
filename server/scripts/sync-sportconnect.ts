import { db } from "../db";
import { tournaments, tournamentMatches, matches } from "../../shared/schema";
import { eq, and } from "drizzle-orm";

// Utility function to convert DotNet date representation
function parseDotNetDate(dotNetDate: string): Date | null {
  if (!dotNetDate) return null;
  const match = /\/Date\((\d+)\)\//.exec(dotNetDate);
  if (!match) return null;
  return new Date(parseInt(match[1]));
}

async function main() {
  try {
    const url = 'https://sportconnect.vn/Tournament/LoadMapData?tourId=3257&includeHtml=true';
    console.log("Fetching latest tournament map data from SportConnect...");
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch SportConnect data. Status: ${res.status}`);
    }
    
    const json = await res.json();
    const mapData = json.MapData;
    if (!mapData) {
      throw new Error("No MapData returned in response.");
    }
    
    // Find all occurrences of var bracketData
    const regex = /var bracketData\s*=\s*({[\s\S]*?});/g;
    let matchResult;
    const stages: any[] = [];
    
    while ((matchResult = regex.exec(mapData)) !== null) {
      stages.push(JSON.parse(matchResult[1]));
    }
    
    console.log(`Found ${stages.length} tournament stages.`);
    if (stages.length === 0) {
      console.log("No bracket stages found to synchronize.");
      process.exit(0);
    }
    
    // 1. Build team display name -> players lookup table across all matches in all stages
    const teamPlayerLookup: Record<string, string[]> = {};
    for (const stage of stages) {
      const matchesList = stage.match || [];
      for (const m of matchesList) {
        const md = m.MatchData || {};
        if (md.Teams && Array.isArray(md.Teams)) {
          for (const team of md.Teams) {
            const alias = team.Alias || team.name;
            if (alias && team.Players && Array.isArray(team.Players) && team.Players.length > 0) {
              teamPlayerLookup[alias] = team.Players.map((p: any) => p.Name || p.NickName || "");
            }
          }
        }
      }
    }
    
    function resolvePlayers(teamAlias: string): { p1: string; p2: string } {
      if (!teamAlias) return { p1: "", p2: "" };
      const resolved = teamPlayerLookup[teamAlias];
      if (resolved && resolved.length > 0) {
        return {
          p1: resolved[0] || "",
          p2: resolved[1] || ""
        };
      }
      const parts = teamAlias.split('/');
      return {
        p1: (parts[0] || "").trim(),
        p2: (parts[1] || "").trim()
      };
    }
    
    function isPlaceholder(teamName: string): boolean {
      if (!teamName || teamName.trim() === "") return true;
      const lower = teamName.toLowerCase();
      return (
        lower === 'bye' ||
        lower.startsWith('w-') ||
        lower.startsWith('l-')
      );
    }
    
    // 2. Find or create Tournament in local database
    const tourName = "GIẢI PICKLEBALL LẦN I MANDA CONS OPEN CUP - ĐÔI HỖN HỢP 5.8";
    let tourId: number;
    const existingTour = await db.select().from(tournaments).where(eq(tournaments.name, tourName)).limit(1);
    
    if (existingTour.length > 0) {
      tourId = existingTour[0].id;
      console.log(`Using existing local tournament ID: ${tourId}`);
    } else {
      const [newTour] = await db.insert(tournaments).values({
        name: tourName,
        description: "Đồng bộ tự động từ SportConnect (ID: 3257)",
        status: "active",
        winningScore: 11,
        creatorId: 1, // Default Admin
      }).returning();
      tourId = newTour.id;
      console.log(`Created new local tournament with ID: ${tourId}`);
    }
    
    // 3. Extract and import ongoing/upcoming matches from all stages
    let importedCount = 0;
    let skippedCount = 0;
    
    for (const stage of stages) {
      const matchesList = stage.match || [];
      const stageName = stage.stage && stage.stage[0] ? stage.stage[0].name : "Unknown";
      
      console.log(`Processing stage: "${stageName}" (${matchesList.length} matches)...`);
      
      for (const m of matchesList) {
        const md = m.MatchData || {};
        const status = md.ConvertStatus || 'Unknown';
        
        // We sync:
        // - "Đang thi đấu" (Ongoing)
        // - "Chuẩn bị" (Upcoming)
        // - "Dự kiến" (Planned but with real concrete teams)
        const isTargetMatch = status === 'Đang thi đấu' || status === 'Chuẩn bị' || status === 'Dự kiến';
        if (!isTargetMatch) continue;
        
        const team1 = md.Team1 || "";
        const team2 = md.Team2 || "";
        
        // Skip placeholder matches waiting for winners
        if (isPlaceholder(team1) || isPlaceholder(team2)) {
          continue;
        }
        
        // Parse round & matchOrder from MatchCode (e.g. V5-B3)
        let round = 1;
        let matchOrder = 1;
        const codeParts = (md.MatchCode || "").split('-');
        if (codeParts[0] && codeParts[0].startsWith('V')) {
          round = parseInt(codeParts[0].substring(1)) || 1;
        }
        if (codeParts[1] && codeParts[1].startsWith('B')) {
          matchOrder = parseInt(codeParts[1].substring(1)) || 1;
        } else if (codeParts[1]) {
          matchOrder = parseInt(codeParts[1]) || 1;
        }
        
        // Check if this match already exists in tournament_matches
        const existingMatch = await db
          .select()
          .from(tournamentMatches)
          .where(
            and(
              eq(tournamentMatches.tournamentId, tourId),
              eq(tournamentMatches.round, round),
              eq(tournamentMatches.matchOrder, matchOrder)
            )
          )
          .limit(1);
          
        if (existingMatch.length > 0) {
          skippedCount++;
          continue;
        }
        
        // Resolve player names
        const t1 = resolvePlayers(team1);
        const t2 = resolvePlayers(team2);
        
        // Determine status maps
        let liveMatchStatus = "pending";
        let tourMatchStatus = "pending";
        if (status === 'Đang thi đấu') {
          liveMatchStatus = "live";
          tourMatchStatus = "live";
        } else if (status === 'Chuẩn bị') {
          liveMatchStatus = "pending";
          tourMatchStatus = "scheduled";
        } else if (status === 'Dự kiến') {
          liveMatchStatus = "pending";
          tourMatchStatus = "pending";
        }
        
        // 4. Create the main match record
        const [newLiveMatch] = await db.insert(matches).values({
          team1Player1: t1.p1,
          team1Player2: t1.p2,
          team2Player1: t2.p1,
          team2Player2: t2.p2,
          status: liveMatchStatus as any,
          type: "doubles",
          tournamentName: tourName,
          matchCode: md.MatchCode || `Round ${round} - Match ${matchOrder}`,
          theme: "default",
          winningPoints: 11,
          bestOf: 1,
        }).returning();
        
        // 5. Create the tournament match linkage record
        const refereeToken = `referee_token_${Math.random().toString(36).substring(2, 10)}`;
        const scheduledTime = parseDotNetDate(md.ThoiGianDau);
        
        await db.insert(tournamentMatches).values({
          tournamentId: tourId,
          matchId: newLiveMatch.id,
          team1Player1: t1.p1,
          team1Player2: t1.p2,
          team2Player1: t2.p1,
          team2Player2: t2.p2,
          groupName: md.San || "Sân chưa xếp",
          round: round,
          matchOrder: matchOrder,
          status: tourMatchStatus,
          refereeToken: refereeToken,
          scheduledAt: scheduledTime,
        });
        
        console.log(`[Imported] Code: ${md.MatchCode} | Court: ${md.San} | ${t1.p1}/${t1.p2} vs ${t2.p1}/${t2.p2}`);
        importedCount++;
      }
    }
    
    console.log(`\nSynchronization completed successfully:`);
    console.log(`- Imported: ${importedCount} matches`);
    console.log(`- Already existed (skipped): ${skippedCount} matches`);
    
  } catch (e) {
    console.error("Error during synchronization:", e);
  }
  process.exit(0);
}

main();
