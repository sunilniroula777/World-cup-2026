import { NextRequest, NextResponse } from "next/server";
import { apiError, isValidAdminPin, isValidGroupCode, normalizeCode } from "@/lib/server";
import { setChangesLocked, setEntriesLocked, storageMode } from "@/lib/store";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return apiError("Missing entry setting details.");

  const code = normalizeCode(body.code);
  if (!isValidGroupCode(code)) return apiError("That group code is not correct.", 401);
  if (!isValidAdminPin(body.adminPin)) return apiError("Admin PIN is incorrect.", 403);
  if (storageMode === "temporary") {
    return apiError("Storage is not connected yet. Add Upstash Redis in Vercel before changing entry settings.", 503);
  }
  const shouldUpdateEntries = typeof body.entriesLocked === "boolean";
  const shouldUpdateChanges = typeof body.changesLocked === "boolean";
  if (!shouldUpdateEntries && !shouldUpdateChanges) return apiError("Choose at least one pool lock setting.");

  const updates: Promise<void>[] = [];
  if (shouldUpdateEntries) updates.push(setEntriesLocked(code, body.entriesLocked));
  if (shouldUpdateChanges) updates.push(setChangesLocked(code, body.changesLocked));
  await Promise.all(updates);
  return NextResponse.json({ ok: true });
}
