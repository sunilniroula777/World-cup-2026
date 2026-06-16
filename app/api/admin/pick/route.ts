import { NextRequest, NextResponse } from "next/server";
import { apiError, isValidAdminPin, isValidGroupCode, normalizeCode } from "@/lib/server";
import { removePick, storageMode } from "@/lib/store";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return apiError("Missing pool entry details.");

  const code = normalizeCode(body.code);
  if (!isValidGroupCode(code)) return apiError("That group code is not correct.", 401);
  if (!isValidAdminPin(body.adminPin)) return apiError("Admin PIN is incorrect.", 403);
  if (storageMode === "temporary") {
    return apiError("Storage is not connected yet. Add Upstash Redis in Vercel before removing pool entries.", 503);
  }

  const normalizedName = typeof body.name === "string" ? body.name.trim().toLocaleLowerCase("en-US") : "";
  if (!normalizedName) return apiError("Choose a pool entry to remove.");

  const removed = await removePick(code, normalizedName);
  if (!removed) return apiError("That person is not in the pool yet.", 404);

  return NextResponse.json({ ok: true });
}
