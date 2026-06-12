import { NextRequest, NextResponse } from "next/server";
import { fetchWorldCupFeed } from "@/lib/espn";
import { apiError, isValidAdminPin, isValidGroupCode, normalizeCode } from "@/lib/server";
import { setGames, setTeamStatus } from "@/lib/store";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return apiError("Missing refresh details.");

  const code = normalizeCode(body.code);
  if (!isValidGroupCode(code)) return apiError("That group code is not correct.", 401);
  if (!isValidAdminPin(body.adminPin)) return apiError("Admin PIN is incorrect.", 403);

  try {
    const feed = await fetchWorldCupFeed();
    await Promise.all([
      setGames(code, feed.games),
      ...feed.eliminatedTeamIds.map((teamId) => setTeamStatus(code, teamId, "eliminated")),
    ]);
    return NextResponse.json({ ok: true, matches: feed.games.length });
  } catch (error) {
    console.error("Could not refresh ESPN World Cup feed.", error);
    return apiError("The public score feed is temporarily unavailable. Try again shortly.", 502);
  }
}
