import { NextRequest, NextResponse } from "next/server";
import { teamById } from "@/lib/teams";
import { getSettings, pickCount, pickExists, savePick, storageMode } from "@/lib/store";
import { apiError, isValidGroupCode, MAX_FRIENDS, normalizeCode } from "@/lib/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return apiError("Please send a name and team.");

  const code = normalizeCode(body.code);
  if (!isValidGroupCode(code)) return apiError("That group code is not correct.", 401);
  if (storageMode === "temporary") {
    return apiError("The pool is not open yet. Ask the organizer to finish setup.", 503);
  }

  const name = typeof body.name === "string" ? body.name.trim().replace(/\s+/g, " ") : "";
  const teamId = typeof body.teamId === "string" ? body.teamId : "";
  if (name.length < 2 || name.length > 24) return apiError("Use a name between 2 and 24 characters.");
  if (!teamById.has(teamId)) return apiError("Choose a World Cup team.");

  const normalizedName = name.toLocaleLowerCase("en-US");
  const exists = await pickExists(code, normalizedName);
  const settings = await getSettings(code);
  if (!exists && settings.entriesLocked) {
    return apiError("New entries are locked by the organizer. Existing players can still update their picks.", 423);
  }
  if (!exists && (await pickCount(code)) >= MAX_FRIENDS) {
    return apiError("This group already has 20 friends. Existing friends can still update their picks.", 409);
  }

  await savePick(code, normalizedName, {
    name,
    teamId,
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
