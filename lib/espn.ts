import { findTeamId, teams } from "./teams";
import type { GroupStanding, Match, MatchEvent, MatchEventType, TeamStanding } from "./types";

const ESPN_WORLD_CUP_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=2026&limit=200";

type EspnCompetitor = {
  homeAway: "home" | "away";
  score?: string;
  winner?: boolean;
  team: {
    id?: string;
    displayName?: string;
    shortDisplayName?: string;
    abbreviation?: string;
  };
};

type EspnDetail = {
  type?: { text?: string };
  clock?: { displayValue?: string };
  team?: { id?: string };
  scoringPlay?: boolean;
  redCard?: boolean;
  yellowCard?: boolean;
  penaltyKick?: boolean;
  ownGoal?: boolean;
  athletesInvolved?: Array<{
    displayName?: string;
    shortName?: string;
    fullName?: string;
  }>;
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
    details?: EspnDetail[];
  }>;
};

type EspnPayload = {
  events?: EspnEvent[];
};

export type WorldCupFeed = {
  games: Match[];
  standings: GroupStanding[];
  nextMatches: Record<string, Match>;
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

function matchEventType(detail: EspnDetail): MatchEventType | null {
  const text = detail.type?.text ?? "";
  if (detail.scoringPlay || /goal|penalty.*scored/i.test(text)) return "goal";
  if (detail.redCard || /red card/i.test(text)) return "red-card";
  if (detail.yellowCard || /yellow card/i.test(text)) return "yellow-card";
  return null;
}

function playerName(detail: EspnDetail) {
  const athlete = detail.athletesInvolved?.[0];
  return athlete?.displayName ?? athlete?.fullName ?? athlete?.shortName ?? "Unknown player";
}

function eventDescription(type: MatchEventType, detail: EspnDetail, player: string, team: string) {
  if (type === "goal") {
    const notes = [
      detail.penaltyKick ? "penalty" : "",
      detail.ownGoal ? "own goal" : "",
    ].filter(Boolean);
    return `${player} scored for ${team}${notes.length ? ` (${notes.join(", ")})` : ""}.`;
  }
  if (type === "yellow-card") return `${player} was booked for ${team}.`;
  if (type === "red-card") return `${player} was sent off for ${team}.`;
  return `${player} was involved for ${team}.`;
}

function matchEvents(details: EspnDetail[] | undefined, competitors: EspnCompetitor[]) {
  const teamByEspnId = new Map<string, { id: string | null; name: string }>();
  for (const competitor of competitors) {
    if (!competitor.team.id) continue;
    const name = teamName(competitor);
    teamByEspnId.set(competitor.team.id, { id: findTeamId(name), name });
  }

  return (details ?? [])
    .map<MatchEvent | null>((detail) => {
      const type = matchEventType(detail);
      if (!type) return null;

      const team = teamByEspnId.get(detail.team?.id ?? "") ?? { id: null, name: "Unknown team" };
      const player = playerName(detail);
      return {
        type,
        minute: detail.clock?.displayValue ?? "-",
        teamId: team.id,
        teamName: team.name,
        playerName: player,
        description: eventDescription(type, detail, player, team.name),
      };
    })
    .filter((event): event is MatchEvent => Boolean(event))
    .slice(0, 18);
}

function matchFact(match: Match, events: MatchEvent[]) {
  const goals = events.filter((event) => event.type === "goal");
  const cards = events.filter((event) => event.type === "yellow-card" || event.type === "red-card");

  if (match.status === "SCHEDULED") {
    return `${match.homeName} and ${match.awayName} are next up in ${match.stage}.`;
  }

  if (goals[0]) {
    return `${goals[0].playerName} opened the scoring for ${goals[0].teamName} in the ${goals[0].minute}.`;
  }

  if (cards.length) {
    return `${cards.length} card${cards.length === 1 ? "" : "s"} shown, but no recorded scorer in the feed yet.`;
  }

  if (match.homeScore !== null && match.awayScore !== null) {
    const totalGoals = match.homeScore + match.awayScore;
    if (totalGoals === 0) return `A tense ${match.stage} scoreline: no goals between ${match.homeName} and ${match.awayName}.`;
    if (match.homeScore === match.awayScore) return `${match.homeName} and ${match.awayName} shared ${totalGoals} goals.`;
    const winner = match.homeScore > match.awayScore ? match.homeName : match.awayName;
    const margin = Math.abs(match.homeScore - match.awayScore);
    return `${winner} won by ${margin} goal${margin === 1 ? "" : "s"} in ${match.stage}.`;
  }

  return `Match notes will fill in as the public feed publishes events.`;
}

function isGroupMatch(match: Match) {
  return /^group\s+[a-l]$/i.test(match.stage);
}

function emptyStanding(teamId: string): TeamStanding {
  const team = teams.find((candidate) => candidate.id === teamId)!;
  return {
    teamId,
    teamName: team.name,
    group: team.group,
    rank: 0,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
  };
}

function recordResult(row: TeamStanding, goalsFor: number, goalsAgainst: number) {
  row.played += 1;
  row.goalsFor += goalsFor;
  row.goalsAgainst += goalsAgainst;
  row.goalDifference = row.goalsFor - row.goalsAgainst;

  if (goalsFor > goalsAgainst) {
    row.won += 1;
    row.points += 3;
  } else if (goalsFor < goalsAgainst) {
    row.lost += 1;
  } else {
    row.drawn += 1;
    row.points += 1;
  }
}

function buildStandings(games: Match[]) {
  const rowsByTeam = new Map(teams.map((team) => [team.id, emptyStanding(team.id)]));

  for (const match of games) {
    if (!isGroupMatch(match) || match.status !== "FINISHED") continue;
    if (!match.homeTeamId || !match.awayTeamId || match.homeScore === null || match.awayScore === null) continue;

    const home = rowsByTeam.get(match.homeTeamId);
    const away = rowsByTeam.get(match.awayTeamId);
    if (!home || !away) continue;

    recordResult(home, match.homeScore, match.awayScore);
    recordResult(away, match.awayScore, match.homeScore);
  }

  const groups = [...new Set(teams.map((team) => team.group))].sort();
  return groups.map<GroupStanding>((group) => {
    const rows = [...rowsByTeam.values()]
      .filter((row) => row.group === group)
      .sort((a, b) =>
        b.points - a.points ||
        b.goalDifference - a.goalDifference ||
        b.goalsFor - a.goalsFor ||
        a.teamName.localeCompare(b.teamName)
      )
      .map((row, index) => ({ ...row, rank: index + 1 }));

    return { group, rows };
  });
}

function buildNextMatches(games: Match[]) {
  const nextMatches: Record<string, Match> = {};
  const upcoming = games
    .filter((match) => match.status === "SCHEDULED" || match.status === "IN_PLAY")
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime());

  for (const match of upcoming) {
    if (match.homeTeamId && !nextMatches[match.homeTeamId]) nextMatches[match.homeTeamId] = match;
    if (match.awayTeamId && !nextMatches[match.awayTeamId]) nextMatches[match.awayTeamId] = match;
  }

  return nextMatches;
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

    const events = matchEvents(competition?.details, competitors);
    const match: Match = {
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
      events,
    };
    match.fact = matchFact(match, events);

    return [match];
  });

  return {
    games: sortGames(games),
    standings: buildStandings(games),
    nextMatches: buildNextMatches(games),
    eliminatedTeamIds: [...eliminatedTeamIds],
    fetchedAt: new Date().toISOString(),
  };
}
