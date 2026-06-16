export type TeamState = "alive" | "eliminated";

export type Pick = {
  name: string;
  teamId: string;
  paid?: boolean;
  paidAt?: string;
  updatedAt: string;
};

export type Match = {
  id: string;
  homeTeamId: string | null;
  homeName: string;
  awayTeamId: string | null;
  awayName: string;
  homeScore: number | null;
  awayScore: number | null;
  status: "FINISHED" | "SCHEDULED" | "IN_PLAY";
  stage: string;
  utcDate: string;
};

export type TeamStanding = {
  teamId: string;
  teamName: string;
  group: string;
  rank: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

export type GroupStanding = {
  group: string;
  rows: TeamStanding[];
};

export type GroupData = {
  picks: Pick[];
  statuses: Record<string, TeamState>;
  games: Match[];
  standings: GroupStanding[];
  nextMatches: Record<string, Match>;
  maxFriends: number;
  entryFee: number;
  usingCloudStorage: boolean;
  storageMode?: "cloud" | "local-file" | "temporary";
  scoreSyncEnabled: boolean;
  dataSource?: string;
  updatedAt: string;
};
