import { NextRequest, NextResponse } from "next/server";
import { apiError, isValidAdminPin, isValidGroupCode, normalizeCode } from "@/lib/server";
import { setPickPaid, storageMode } from "@/lib/store";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return apiError("Missing payment details.");

  const code = normalizeCode(body.code);
  if (!isValidGroupCode(code)) return apiError("That group code is not correct.", 401);
  if (!isValidAdminPin(body.adminPin)) return apiError("Admin PIN is incorrect.", 403);
  if (storageMode === "temporary") {
    return apiError("Storage is not connected yet. Add Upstash Redis in Vercel before saving pool payments.", 503);
  }

  const normalizedName = typeof body.name === "string" ? body.name.trim().toLocaleLowerCase("en-US") : "";
  if (!normalizedName) return apiError("Choose a pool entry.");
  if (typeof body.paid !== "boolean") return apiError("Choose paid or not paid.");

  const updated = await setPickPaid(code, normalizedName, body.paid);
  if (!updated) return apiError("That person is not in the pool yet.", 404);

  return NextResponse.json({ ok: true });
}
