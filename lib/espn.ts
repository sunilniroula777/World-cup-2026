import { findTeamId } from "./teams";
import type { Match } from "./types";

const ESPN_WORLD_CUP_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=2026&limit=200";

type EspnCompetitor = {
  homeAway: "home" | "away";
  score?: string;
  winner?: boolean;
  team: {
    displayName?: string;
    shortDisplayName?: string;
    abbreviation?: string;
  };
};

type EspnEvent = {
  id: string;
  date: string;
  season?: { slug?: string };
  competitions?: Array<{
    altGameNote?: string;
    status?: {
      type?: {
        state?: "pre" | "in" | "post";
        completed?: boolean;
      };
    };
    competitors?: EspnCompetitor[];
  }>;
};

type EspnPayload = {
  events?: EspnEvent[];
};

export type WorldCupFeed = {
  games: Match[];
  eliminatedTeamIds: string[];
  fetchedAt: string;
};

function teamName(competitor: EspnCompetitor) {
  return competitor.team.displayName ?? competitor.team.shortDisplayName ?? competitor.team.abbreviation ?? "TBD";
}

function score(value: string | undefined, status: Match["status"]) {
  if (status === "SCHEDULED") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function stage(note: string | undefined, slug: string | undefined) {
  if (note) return note.replace(/^FIFA World Cup,\s*/i, "");
  return (slug ?? "World Cup").replaceAll("-", " ");
}

function isKnockout(value: string) {
  return /round of 32|round of 16|quarter|semi|third-place|3rd-place|final/i.test(value);
}

function sortGames(games: Match[]) {
  const live = games.filter((match) => match.status === "IN_PLAY");
  const finished = games
    .filter((match) => match.status === "FINISHED")
    .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime())
    .slice(0, 12);
  const upcoming = games
    .filter((match) => match.status === "SCHEDULED" && new Date(match.utcDate).getTime() >= Date.now())
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
    .slice(0, 12);

  return [...live, ...finished, ...upcoming].slice(0, 24);
}

export async function fetchWorldCupFeed(): Promise<WorldCupFeed> {
  const response = await fetch(ESPN_WORLD_CUP_URL, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 },
  });

  if (!response.ok) throw new Error(`ESPN World Cup feed returned ${response.status}`);

  const payload = (await response.json()) as EspnPayload;
  const eliminatedTeamIds = new Set<string>();
  const games = (payload.events ?? []).flatMap<Match>((event) => {
    const competition = event.competitions?.[0];
    const competitors = competition?.competitors ?? [];
    const home = competitors.find((competitor) => competitor.homeAway === "home");
    const away = competitors.find((competitor) => competitor.homeAway === "away");
    if (!home || !away) return [];

    const state = competition?.status?.type?.state;
    const status: Match["status"] = state === "post" ? "FINISHED" : state === "in" ? "IN_PLAY" : "SCHEDULED";
    const homeName = teamName(home);
    const awayName = teamName(away);
    const homeTeamId = findTeamId(homeName);
    const awayTeamId = findTeamId(awayName);
    const matchStage = stage(competition?.altGameNote, event.season?.slug);

    if (status === "FINISHED" && isKnockout(matchStage)) {
      if (home.winner === false && away.winner === true && homeTeamId) eliminatedTeamIds.add(homeTeamId);
      if (away.winner === false && home.winner === true && awayTeamId) eliminatedTeamIds.add(awayTeamId);
    }

    return [{
      id: `espn-${event.id}`,
      homeTeamId,
      homeName,
      awayTeamId,
      awayName,
      homeScore: score(home.score, status),
      awayScore: score(away.score, status),
      status,
      stage: matchStage,
      utcDate: event.date,
    }];
  });

  return {
    games: sortGames(games),
    eliminatedTeamIds: [...eliminatedTeamIds],
    fetchedAt: new Date().toISOString(),
  };
}
