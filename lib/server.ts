import { NextResponse } from "next/server";

export const MAX_FRIENDS = 20;
export const ENTRY_FEE = 50;

export function normalizeCode(value: unknown) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

export function isValidGroupCode(value: unknown) {
  const expected = (process.env.GROUP_CODE || "FRIENDS26").trim().toUpperCase();
  return normalizeCode(value) === expected;
}

export function isValidAdminPin(value: unknown) {
  return typeof value === "string" && value === (process.env.ADMIN_PIN || "2026");
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
