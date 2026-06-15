import { NextRequest, NextResponse } from "next/server";
import { apiError, isValidAdminPin, isValidGroupCode, normalizeCode } from "@/lib/server";
import { teamById } from "@/lib/teams";
import { setTeamStatus, storageMode } from "@/lib/store";
import type { TeamState } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return apiError("Missing team status details.");

  const code = normalizeCode(body.code);
  if (!isValidGroupCode(code)) return apiError("That group code is not correct.", 401);
  if (!isValidAdminPin(body.adminPin)) return apiError("Admin PIN is incorrect.", 403);
  if (storageMode === "temporary") {
    return apiError("Storage is not connected yet. Add Upstash Redis in Vercel before saving team statuses.", 503);
  }

  const status = body.status as TeamState;
  if (!teamById.has(body.teamId) || !["alive", "eliminated"].includes(status)) {
    return apiError("Choose a valid team and status.");
  }

  await setTeamStatus(code, body.teamId, status);
  return NextResponse.json({ ok: true });
}
