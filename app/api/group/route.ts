import { NextRequest, NextResponse } from "next/server";
import { fetchWorldCupFeed } from "@/lib/espn";
import { getGames, getPicks, getSettings, getStatuses, setTeamStatus, storageMode, usingCloudStorage } from "@/lib/store";
import { ENTRY_FEE, isValidGroupCode, MAX_FRIENDS, normalizeCode } from "@/lib/server";
import type { GroupStanding, Match } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const code = normalizeCode(request.nextUrl.searchParams.get("code"));
  if (!isValidGroupCode(code)) {
    return NextResponse.json({ error: "That group code is not correct." }, { status: 401 });
  }

  let games = await getGames(code);
  let standings: GroupStanding[] = [];
  let nextMatches: Record<string, Match> = {};
  let updatedAt = new Date().toISOString();
  let dataSource = "Manual backup";

  try {
    const feed = await fetchWorldCupFeed();
    games = feed.games;
    standings = feed.standings;
    nextMatches = feed.nextMatches;
    updatedAt = feed.fetchedAt;
    dataSource = "ESPN public feed";
    await Promise.all(feed.eliminatedTeamIds.map((teamId) => setTeamStatus(code, teamId, "eliminated")));
  } catch (error) {
    console.error("World Cup feed unavailable; using stored games.", error);
  }

  const [picks, statuses, settings] = await Promise.all([getPicks(code), getStatuses(code), getSettings(code)]);

  return NextResponse.json({
    picks,
    statuses,
    games,
    standings,
    nextMatches,
    maxFriends: MAX_FRIENDS,
    entryFee: ENTRY_FEE,
    entriesLocked: Boolean(settings.entriesLocked),
    changesLocked: Boolean(settings.changesLocked),
    usingCloudStorage,
    storageMode,
    scoreSyncEnabled: true,
    dataSource,
    updatedAt,
  });
}
