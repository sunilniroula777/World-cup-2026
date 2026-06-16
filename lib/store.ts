import { Redis } from "@upstash/redis";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Match, Pick, TeamState } from "./types";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;
const useLocalFile = !redis && !process.env.VERCEL;
const dataDirectory = path.join(process.cwd(), ".data");
const dataFile = path.join(dataDirectory, "cup-circle.json");
const temporaryDataFile = path.join(dataDirectory, "cup-circle.tmp.json");

type MemoryStore = {
  picks: Map<string, Map<string, Pick>>;
  statuses: Map<string, Map<string, TeamState>>;
  games: Map<string, Match[]>;
};

type StoredGroup = {
  picks: Record<string, Pick>;
  statuses: Record<string, TeamState>;
  games: Match[];
};

type FileStore = {
  groups: Record<string, StoredGroup>;
};

const globalStore = globalThis as typeof globalThis & { __cupCircleStore?: MemoryStore };
const memory = globalStore.__cupCircleStore ?? {
  picks: new Map(),
  statuses: new Map(),
  games: new Map(),
};
globalStore.__cupCircleStore = memory;

const key = (code: string, type: string) => `cup-circle:${code.toUpperCase()}:${type}`;
const groupKey = (code: string) => code.toUpperCase();

let fileWriteQueue = Promise.resolve();

async function readLocalStore(): Promise<FileStore> {
  try {
    return JSON.parse(await readFile(dataFile, "utf8")) as FileStore;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("Could not read local Cup Circle data; starting with an empty store.", error);
    }
    return { groups: {} };
  }
}

async function writeLocalStore(store: FileStore) {
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(temporaryDataFile, JSON.stringify(store, null, 2), "utf8");
  await rename(temporaryDataFile, dataFile);
}

async function updateLocalStore<T = void>(change: (store: FileStore) => T) {
  let result: T;
  const operation = fileWriteQueue.then(async () => {
    const store = await readLocalStore();
    result = change(store);
    await writeLocalStore(store);
  });
  fileWriteQueue = operation.catch(() => undefined);
  await operation;
  return result!;
}

function emptyGroup(): StoredGroup {
  return { picks: {}, statuses: {}, games: [] };
}

function ensureGroup(store: FileStore, code: string) {
  const normalizedCode = groupKey(code);
  store.groups[normalizedCode] ??= emptyGroup();
  return store.groups[normalizedCode];
}

async function getLocalGroup(code: string) {
  await fileWriteQueue;
  const store = await readLocalStore();
  return store.groups[groupKey(code)] ?? emptyGroup();
}

export const usingCloudStorage = Boolean(redis);
export const storageMode = redis ? "cloud" : useLocalFile ? "local-file" : "temporary";

export async function getPicks(code: string): Promise<Pick[]> {
  if (redis) {
    const result = await redis.hgetall<Record<string, Pick>>(key(code, "picks"));
    return Object.values(result ?? {}).sort((a, b) => a.name.localeCompare(b.name));
  }
  if (useLocalFile) {
    return Object.values((await getLocalGroup(code)).picks).sort((a, b) => a.name.localeCompare(b.name));
  }
  return [...(memory.picks.get(code) ?? new Map()).values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function savePick(code: string, normalizedName: string, pick: Pick) {
  const previousPick = await getPick(code, normalizedName);
  const nextPick = previousPick ? { ...pick, paid: previousPick.paid, paidAt: previousPick.paidAt } : pick;
  if (redis) {
    await redis.hset(key(code, "picks"), { [normalizedName]: nextPick });
    return;
  }
  if (useLocalFile) {
    await updateLocalStore((store) => {
      ensureGroup(store, code).picks[normalizedName] = nextPick;
    });
    return;
  }
  const groupPicks = memory.picks.get(code) ?? new Map<string, Pick>();
  groupPicks.set(normalizedName, nextPick);
  memory.picks.set(code, groupPicks);
}

export async function getPick(code: string, normalizedName: string): Promise<Pick | null> {
  if (redis) return (await redis.hget<Pick>(key(code, "picks"), normalizedName)) ?? null;
  if (useLocalFile) return (await getLocalGroup(code)).picks[normalizedName] ?? null;
  return memory.picks.get(code)?.get(normalizedName) ?? null;
}

export async function setPickPaid(code: string, normalizedName: string, paid: boolean) {
  const updatePayment = (pick: Pick): Pick => {
    const nextPick: Pick = { ...pick, paid };
    if (paid) {
      nextPick.paidAt = new Date().toISOString();
    } else {
      delete nextPick.paidAt;
    }
    return nextPick;
  };

  if (redis) {
    const pick = await getPick(code, normalizedName);
    if (!pick) return false;
    await redis.hset(key(code, "picks"), { [normalizedName]: updatePayment(pick) });
    return true;
  }
  if (useLocalFile) {
    return updateLocalStore((store) => {
      const group = ensureGroup(store, code);
      const pick = group.picks[normalizedName];
      if (!pick) return false;
      group.picks[normalizedName] = updatePayment(pick);
      return true;
    });
  }

  const pick = memory.picks.get(code)?.get(normalizedName);
  if (!pick) return false;
  memory.picks.get(code)!.set(normalizedName, updatePayment(pick));
  return true;
}

export async function pickCount(code: string) {
  if (redis) return redis.hlen(key(code, "picks"));
  if (useLocalFile) return Object.keys((await getLocalGroup(code)).picks).length;
  return memory.picks.get(code)?.size ?? 0;
}

export async function pickExists(code: string, normalizedName: string) {
  if (redis) return Boolean(await redis.hexists(key(code, "picks"), normalizedName));
  if (useLocalFile) return Boolean((await getLocalGroup(code)).picks[normalizedName]);
  return memory.picks.get(code)?.has(normalizedName) ?? false;
}

export async function getStatuses(code: string): Promise<Record<string, TeamState>> {
  if (redis) {
    return (await redis.hgetall<Record<string, TeamState>>(key(code, "statuses"))) ?? {};
  }
  if (useLocalFile) return (await getLocalGroup(code)).statuses;
  return Object.fromEntries(memory.statuses.get(code) ?? []);
}

export async function setTeamStatus(code: string, teamId: string, status: TeamState) {
  if (redis) {
    await redis.hset(key(code, "statuses"), { [teamId]: status });
    return;
  }
  if (useLocalFile) {
    await updateLocalStore((store) => {
      ensureGroup(store, code).statuses[teamId] = status;
    });
    return;
  }
  const statuses = memory.statuses.get(code) ?? new Map<string, TeamState>();
  statuses.set(teamId, status);
  memory.statuses.set(code, statuses);
}

export async function getGames(code: string): Promise<Match[]> {
  if (redis) return (await redis.get<Match[]>(key(code, "games"))) ?? [];
  if (useLocalFile) return (await getLocalGroup(code)).games;
  return memory.games.get(code) ?? [];
}

export async function setGames(code: string, games: Match[]) {
  const recent = games.slice(0, 24);
  if (redis) {
    await redis.set(key(code, "games"), recent);
    return;
  }
  if (useLocalFile) {
    await updateLocalStore((store) => {
      ensureGroup(store, code).games = recent;
    });
    return;
  }
  memory.games.set(code, recent);
}
