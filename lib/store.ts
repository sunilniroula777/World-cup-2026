import { Redis } from "@upstash/redis";
import type { Match, Pick, TeamState } from "./types";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

type MemoryStore = {
  picks: Map<string, Map<string, Pick>>;
  statuses: Map<string, Map<string, TeamState>>;
  games: Map<string, Match[]>;
};

const globalStore = globalThis as typeof globalThis & { __cupCircleStore?: MemoryStore };
const memory = globalStore.__cupCircleStore ?? {
  picks: new Map(),
  statuses: new Map(),
  games: new Map(),
};
globalStore.__cupCircleStore = memory;

const key = (code: string, type: string) => `cup-circle:${code.toUpperCase()}:${type}`;

export const usingCloudStorage = Boolean(redis);

export async function getPicks(code: string): Promise<Pick[]> {
  if (redis) {
    const result = await redis.hgetall<Record<string, Pick>>(key(code, "picks"));
    return Object.values(result ?? {}).sort((a, b) => a.name.localeCompare(b.name));
  }
  return [...(memory.picks.get(code) ?? new Map()).values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function savePick(code: string, normalizedName: string, pick: Pick) {
  if (redis) {
    await redis.hset(key(code, "picks"), { [normalizedName]: pick });
    return;
  }
  const groupPicks = memory.picks.get(code) ?? new Map<string, Pick>();
  groupPicks.set(normalizedName, pick);
  memory.picks.set(code, groupPicks);
}

export async function pickCount(code: string) {
  if (redis) return redis.hlen(key(code, "picks"));
  return memory.picks.get(code)?.size ?? 0;
}

export async function pickExists(code: string, normalizedName: string) {
  if (redis) return Boolean(await redis.hexists(key(code, "picks"), normalizedName));
  return memory.picks.get(code)?.has(normalizedName) ?? false;
}

export async function getStatuses(code: string): Promise<Record<string, TeamState>> {
  if (redis) {
    return (await redis.hgetall<Record<string, TeamState>>(key(code, "statuses"))) ?? {};
  }
  return Object.fromEntries(memory.statuses.get(code) ?? []);
}

export async function setTeamStatus(code: string, teamId: string, status: TeamState) {
  if (redis) {
    await redis.hset(key(code, "statuses"), { [teamId]: status });
    return;
  }
  const statuses = memory.statuses.get(code) ?? new Map<string, TeamState>();
  statuses.set(teamId, status);
  memory.statuses.set(code, statuses);
}

export async function getGames(code: string): Promise<Match[]> {
  if (redis) return (await redis.get<Match[]>(key(code, "games"))) ?? [];
  return memory.games.get(code) ?? [];
}

export async function setGames(code: string, games: Match[]) {
  const recent = games.slice(0, 24);
  if (redis) {
    await redis.set(key(code, "games"), recent);
    return;
  }
  memory.games.set(code, recent);
}
