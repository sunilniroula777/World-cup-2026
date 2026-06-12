import { NextRequest, NextResponse } from "next/server";
import { apiError, isValidAdminPin, isValidGroupCode, normalizeCode } from "@/lib/server";
import { teamById } from "@/lib/teams";
import { getGames, setGames } from "@/lib/store";
import type { Match } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return apiError("Missing match details.");

  const code = normalizeCode(body.code);
  if (!isValidGroupCode(code)) return apiError("That group code is not correct.", 401);
  if (!isValidAdminPin(body.adminPin)) return apiError("Admin PIN is incorrect.", 403);
  if (!teamById.has(body.homeTeamId) || !teamById.has(body.awayTeamId) || body.homeTeamId === body.awayTeamId) {
    return apiError("Choose two different teams.");
  }

  const homeScore = Number(body.homeScore);
  const awayScore = Number(body.awayScore);
  if (!Number.isInteger(homeScore) || homeScore < 0 || !Number.isInteger(awayScore) || awayScore < 0) {
    return apiError("Scores must be whole numbers of zero or more.");
  }

  const home = teamById.get(body.homeTeamId)!;
  const away = teamById.get(body.awayTeamId)!;
  const match: Match = {
    id: `manual-${Date.now()}`,
    homeTeamId: home.id,
    homeName: home.name,
    awayTeamId: away.id,
    awayName: away.name,
    homeScore,
    awayScore,
    status: "FINISHED",
    stage: typeof body.stage === "string" && body.stage.trim() ? body.stage.trim() : "World Cup",
    utcDate: new Date().toISOString(),
  };

  await setGames(code, [match, ...(await getGames(code))]);
  return NextResponse.json({ ok: true });
}
