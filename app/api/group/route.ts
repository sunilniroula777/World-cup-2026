import { NextRequest, NextResponse } from "next/server";
import { fetchWorldCupFeed } from "@/lib/espn";
import { getGames, getPicks, getStatuses, setTeamStatus, usingCloudStorage } from "@/lib/store";
import { isValidGroupCode, MAX_FRIENDS, normalizeCode } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const code = normalizeCode(request.nextUrl.searchParams.get("code"));
  if (!isValidGroupCode(code)) {
    return NextResponse.json({ error: "That group code is not correct." }, { status: 401 });
  }

  let games = await getGames(code);
  let updatedAt = new Date().toISOString();
  let dataSource = "Manual backup";

  try {
    const feed = await fetchWorldCupFeed();
    games = feed.games;
    updatedAt = feed.fetchedAt;
    dataSource = "ESPN public feed";
    await Promise.all(feed.eliminatedTeamIds.map((teamId) => setTeamStatus(code, teamId, "eliminated")));
  } catch (error) {
    console.error("World Cup feed unavailable; using stored games.", error);
  }

  const [picks, statuses] = await Promise.all([getPicks(code), getStatuses(code)]);

  return NextResponse.json({
    picks,
    statuses,
    games,
    maxFriends: MAX_FRIENDS,
    usingCloudStorage,
    scoreSyncEnabled: true,
    dataSource,
    updatedAt,
  });
}
