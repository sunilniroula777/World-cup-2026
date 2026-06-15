export type TeamState = "alive" | "eliminated";

export type Pick = {
  name: string;
  teamId: string;
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

export type GroupData = {
  picks: Pick[];
  statuses: Record<string, TeamState>;
  games: Match[];
  maxFriends: number;
  usingCloudStorage: boolean;
  storageMode?: "cloud" | "local-file" | "temporary";
  scoreSyncEnabled: boolean;
  dataSource?: string;
  updatedAt: string;
};
