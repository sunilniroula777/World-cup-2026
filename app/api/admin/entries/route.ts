import { NextRequest, NextResponse } from "next/server";
import { apiError, isValidAdminPin, isValidGroupCode, normalizeCode } from "@/lib/server";
import { setEntriesLocked, storageMode } from "@/lib/store";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return apiError("Missing entry setting details.");

  const code = normalizeCode(body.code);
  if (!isValidGroupCode(code)) return apiError("That group code is not correct.", 401);
  if (!isValidAdminPin(body.adminPin)) return apiError("Admin PIN is incorrect.", 403);
  if (storageMode === "temporary") {
    return apiError("Storage is not connected yet. Add Upstash Redis in Vercel before changing entry settings.", 503);
  }
  if (typeof body.entriesLocked !== "boolean") return apiError("Choose whether entries are open or locked.");

  await setEntriesLocked(code, body.entriesLocked);
  return NextResponse.json({ ok: true });
}
