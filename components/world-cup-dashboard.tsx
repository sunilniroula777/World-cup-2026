"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { countryFactForMatch, flagUrl, teamById, teams } from "@/lib/teams";
import type { GroupData, GroupStanding, Match, MatchEvent, Pick, TeamState } from "@/lib/types";

const emptyGroup: GroupData = {
  picks: [],
  statuses: {},
  games: [],
  standings: [],
  nextMatches: {},
  maxFriends: 20,
  entryFee: 50,
  entriesLocked: false,
  usingCloudStorage: false,
  storageMode: "temporary",
  scoreSyncEnabled: false,
  dataSource: "Manual backup",
  updatedAt: new Date(0).toISOString(),
};

function Flag({ teamId, name }: { teamId: string | null; name: string }) {
  const team = teamId ? teamById.get(teamId) : null;
  if (!team) return <span className="flag-fallback">{name.slice(0, 2).toUpperCase()}</span>;
  return <img className="flag" src={flagUrl(team.flagCode)} alt={`${team.name} flag`} />;
}

function formatStage(stage: string) {
  return stage.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatMatchDate(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function MatchCard({
  match,
  active,
  onSelect,
}: {
  match: Match;
  active: boolean;
  onSelect: () => void;
}) {
  const isFinished = match.status === "FINISHED";
  const eventCount = match.events?.length ?? 0;
  return (
    <article
      className={`match-card ${active ? "active" : ""}`}
      role="button"
      tabIndex={0}
      aria-pressed={active}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="match-meta">
        <span>{formatStage(match.stage)}</span>
        <span className={match.status === "IN_PLAY" ? "live-dot" : ""}>
          {match.status === "IN_PLAY" ? "Live" : formatMatchDate(match.utcDate)}
        </span>
      </div>
      <div className="match-team">
        <Flag teamId={match.homeTeamId} name={match.homeName} />
        <strong>{match.homeName}</strong>
        <b>{isFinished || match.status === "IN_PLAY" ? match.homeScore ?? "-" : ""}</b>
      </div>
      <div className="match-team">
        <Flag teamId={match.awayTeamId} name={match.awayName} />
        <strong>{match.awayName}</strong>
        <b>{isFinished || match.status === "IN_PLAY" ? match.awayScore ?? "-" : ""}</b>
      </div>
      <span className="match-detail-hint">{active ? "Hide details" : eventCount ? `${eventCount} events` : "Match notes"}</span>
    </article>
  );
}

function fallbackMatchFact(match: Match) {
  return countryFactForMatch(match.homeTeamId, match.awayTeamId, match.id);
}

function eventIcon(type: MatchEvent["type"]) {
  if (type === "goal") return "G";
  if (type === "red-card") return "R";
  if (type === "yellow-card") return "Y";
  return "•";
}

function EventList({ title, events, empty }: { title: string; events: MatchEvent[]; empty: string }) {
  return (
    <div className="event-list">
      <h4>{title}</h4>
      {events.length ? (
        events.map((event, index) => (
          <div className={`event-row ${event.type}`} key={`${event.minute}-${event.playerName}-${index}`}>
            <span className="event-icon">{eventIcon(event.type)}</span>
            <div>
              <strong>{event.playerName}</strong>
              <span>{event.minute} · {event.teamName}</span>
            </div>
          </div>
        ))
      ) : (
        <p>{empty}</p>
      )}
    </div>
  );
}

function MatchDetailPanel({ match }: { match: Match }) {
  const events = match.events ?? [];
  const goals = events.filter((event) => event.type === "goal");
  const cards = events.filter((event) => event.type === "yellow-card" || event.type === "red-card");

  return (
    <article className="match-detail-panel">
      <div className="match-detail-header">
        <div>
          <span>Match notebook</span>
          <h3>{match.homeName} vs {match.awayName}</h3>
        </div>
        <b>{match.status === "IN_PLAY" ? "Live" : formatMatchDate(match.utcDate)}</b>
      </div>
      <div className="match-fact">
        <span>Country fact</span>
        <strong>{match.fact ?? fallbackMatchFact(match)}</strong>
      </div>
      <div className="event-grid">
        <EventList title="Scorers" events={goals} empty={match.status === "SCHEDULED" ? "No scorers yet." : "No scorers listed in the feed yet."} />
        <EventList title="Cards" events={cards} empty={match.status === "SCHEDULED" ? "No cards yet." : "No cards listed in the feed yet."} />
      </div>
    </article>
  );
}

function teamResult(teamId: string, match: Match) {
  const isHome = match.homeTeamId === teamId;
  const teamScore = isHome ? match.homeScore : match.awayScore;
  const opponentScore = isHome ? match.awayScore : match.homeScore;
  if (teamScore === null || opponentScore === null) return "Result pending";
  if (teamScore > opponentScore) return `Won ${teamScore}-${opponentScore}`;
  if (teamScore < opponentScore) return `Lost ${teamScore}-${opponentScore}`;
  return `Drew ${teamScore}-${opponentScore}`;
}

function teamOpponent(teamId: string, match: Match) {
  return match.homeTeamId === teamId ? match.awayName : match.homeName;
}

function matchOpponent(teamId: string, match: Match) {
  return match.homeTeamId === teamId ? match.awayName : match.homeName;
}

function matchLabel(match: Match) {
  return match.status === "IN_PLAY" ? "Live now" : formatMatchDate(match.utcDate);
}

const banterLines = [
  "Booked an early flight home.",
  "VAR could not save this dream.",
  "Group chat is about to be spicy.",
  "The parade has been respectfully postponed.",
  "Time to scout a backup bandwagon.",
  "Their trophy charge is now a documentary.",
];

function banterLine(name: string, teamName: string) {
  const seed = `${name}-${teamName}`.split("").reduce((total, letter) => total + letter.charCodeAt(0), 0);
  return banterLines[seed % banterLines.length];
}

function GroupTables({ standings }: { standings: GroupStanding[] }) {
  if (!standings.length) {
    return <div className="empty-state small"><strong>No table yet.</strong><span>Group standings appear when the public feed is available.</span></div>;
  }

  return (
    <div className="standings-grid">
      {standings.map((standing) => (
        <article className={`standing-card group-${standing.group.toLowerCase()}`} key={standing.group}>
          <h3>Group {standing.group}</h3>
          <div className="standing-head">
            <span>Team</span><span>P</span><span>GD</span><span>Pts</span>
          </div>
          {standing.rows.map((row) => {
            const team = teamById.get(row.teamId);
            return (
              <div className={`standing-row ${row.rank <= 2 ? "advance" : ""}`} key={row.teamId}>
                <strong>{row.rank}. {team?.shortName ?? row.teamName}</strong>
                <span>{row.played}</span>
                <span>{row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}</span>
                <b>{row.points}</b>
              </div>
            );
          })}
        </article>
      ))}
    </div>
  );
}

function PickCard({
  pick,
  state,
  lastResult,
  nextMatch,
  groupStanding,
}: {
  pick: Pick;
  state: TeamState;
  lastResult?: Match;
  nextMatch?: Match;
  groupStanding?: GroupStanding;
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const team = teamById.get(pick.teamId);
  if (!team) return null;
  const initials = pick.name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase();
  const paymentState = pick.paid ? "paid" : "unpaid";
  const statusLabel = state === "eliminated" ? "Out" : pick.paid ? "Still in" : "Not paid";
  const resultText = lastResult ? teamResult(team.id, lastResult) : "No result yet";
  const opponentText = lastResult ? `vs ${teamOpponent(team.id, lastResult)}` : "Waiting for first match";
  const nextMatchText = nextMatch ? matchLabel(nextMatch) : "No fixture yet";
  const nextOpponentText = nextMatch ? `vs ${matchOpponent(team.id, nextMatch)}` : "Waiting for schedule";
  const roastText = banterLine(pick.name, team.name);
  const standingRowsByTeam = new Map(groupStanding?.rows.map((row) => [row.teamId, row]) ?? []);
  const teamsInGroup = teams.filter((candidate) => candidate.group === team.group);
  const groupRows = teamsInGroup
    .map((candidate, index) => ({
      team: candidate,
      standing: standingRowsByTeam.get(candidate.id),
      rank: standingRowsByTeam.get(candidate.id)?.rank ?? index + 1,
    }))
    .sort((a, b) => a.rank - b.rank || a.team.name.localeCompare(b.team.name));

  function toggleFlip() {
    setIsFlipped((flipped) => !flipped);
  }

  return (
    <article
      className={`pick-card group-${team.group.toLowerCase()} ${state} ${paymentState} ${isFlipped ? "flipped" : ""}`}
      role="button"
      tabIndex={0}
      aria-label={`${pick.name}'s ${team.name} card. ${isFlipped ? "Showing group table" : "Showing pick details"}.`}
      aria-pressed={isFlipped}
      onClick={toggleFlip}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggleFlip();
        }
      }}
    >
      <div className="pick-card-inner">
        <div className="pick-face pick-front" aria-hidden={isFlipped}>
          <div className="pick-card-top">
            <div className="avatar">{initials}</div>
            <div>
              <span className="picked-by">Picked by</span>
              <h3>{pick.name}</h3>
            </div>
            <span className="state-pill">{statusLabel}</span>
          </div>
          <div className="country-lockup">
            <Flag teamId={team.id} name={team.name} />
            <div>
              <span>Group {team.group}</span>
              <h2>{team.name}</h2>
            </div>
          </div>
          <div className="captain-row">
            <span>Captain</span>
            <strong>{team.captain}</strong>
          </div>
          <div className="result-row">
            <span>Last result</span>
            <strong>{resultText}</strong>
            <small>{opponentText}</small>
          </div>
          <div className="result-row">
            <span>Next match</span>
            <strong>{nextMatchText}</strong>
            <small>{nextOpponentText}</small>
          </div>
          <span className="flip-hint">Tap to view Group {team.group}</span>
          {state === "eliminated" && (
            <div className="banter-strip">
              <strong>Friendly banter</strong>
              <span>{roastText}</span>
            </div>
          )}
        </div>

        <div className="pick-face pick-back" aria-hidden={!isFlipped}>
          <div className="pick-back-top">
            <div>
              <span>Group {team.group}</span>
              <h3>{team.name}'s road</h3>
            </div>
            <Flag teamId={team.id} name={team.name} />
          </div>
          <div className="group-back-head">
            <span>Team</span><span>P</span><span>GD</span><span>Pts</span>
          </div>
          <div className="group-back-table">
            {groupRows.map((row) => (
              <div className={`group-back-row ${row.team.id === team.id ? "selected" : ""}`} key={row.team.id}>
                <div className="group-back-team">
                  <Flag teamId={row.team.id} name={row.team.name} />
                  <strong>{row.rank}. {row.team.shortName}</strong>
                  <small>{row.team.name}</small>
                </div>
                <span>{row.standing?.played ?? "-"}</span>
                <span>{row.standing ? (row.standing.goalDifference > 0 ? `+${row.standing.goalDifference}` : row.standing.goalDifference) : "-"}</span>
                <b>{row.standing?.points ?? "-"}</b>
              </div>
            ))}
          </div>
          <span className="flip-hint back-hint">Tap to return to {pick.name}'s pick</span>
        </div>
      </div>
    </article>
  );
}

function storageMessage(mode: GroupData["storageMode"]) {
  if (mode === "cloud") return "Cloud storage is active. Friend picks are saved in Upstash Redis.";
  if (mode === "local-file") return "Local file storage is active. Preview picks survive server restarts on this computer.";
  return "Storage setup required. Connect Upstash Redis in Vercel before friends submit picks.";
}

export function WorldCupDashboard() {
  const [groupCode, setGroupCode] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [group, setGroup] = useState<GroupData>(emptyGroup);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [teamId, setTeamId] = useState("argentina");
  const [adminPin, setAdminPin] = useState("");
  const [adminTeamId, setAdminTeamId] = useState("argentina");
  const [adminStatus, setAdminStatus] = useState<TeamState>("eliminated");
  const [homeTeamId, setHomeTeamId] = useState("mexico");
  const [awayTeamId, setAwayTeamId] = useState("south-africa");
  const [homeScore, setHomeScore] = useState("0");
  const [awayScore, setAwayScore] = useState("0");
  const [paymentName, setPaymentName] = useState("");
  const [paymentPaid, setPaymentPaid] = useState("true");
  const [removeName, setRemoveName] = useState("");
  const [entriesLockedChoice, setEntriesLockedChoice] = useState("false");
  const [showGroupTables, setShowGroupTables] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState("");

  const loadGroup = useCallback(async (code: string, quiet = false) => {
    if (!quiet) setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/group?code=${encodeURIComponent(code)}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not open the group.");
      setGroup(payload);
      setGroupCode(code.toUpperCase());
      localStorage.setItem("cup-circle-code", code.toUpperCase());
    } catch (caught) {
      if (!quiet) setError(caught instanceof Error ? caught.message : "Could not open the group.");
    } finally {
      if (!quiet) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("cup-circle-code");
    if (saved) {
      setCodeInput(saved);
      void loadGroup(saved);
    }
  }, [loadGroup]);

  useEffect(() => {
    if (!groupCode) return;
    const interval = window.setInterval(() => void loadGroup(groupCode, true), 30000);
    return () => window.clearInterval(interval);
  }, [groupCode, loadGroup]);

  const picks = useMemo(
    () => [...group.picks].sort((a, b) => {
      const aOut = group.statuses[a.teamId] === "eliminated" ? 1 : 0;
      const bOut = group.statuses[b.teamId] === "eliminated" ? 1 : 0;
      return aOut - bOut || a.name.localeCompare(b.name);
    }),
    [group.picks, group.statuses]
  );
  const aliveCount = picks.filter((pick) => group.statuses[pick.teamId] !== "eliminated").length;
  const paidCount = picks.filter((pick) => pick.paid).length;
  const collectedPool = paidCount * group.entryFee;
  const expectedPool = picks.length * group.entryFee;
  const entriesArePaused = group.storageMode === "temporary";
  const entriesAreLocked = Boolean(group.entriesLocked);
  const showAdminDiagnostics = adminPin.trim().length > 0;
  const latestFinishedMatchByTeam = useMemo(() => {
    const latest = new Map<string, Match>();
    const finishedMatches = group.games
      .filter((match) => match.status === "FINISHED")
      .sort((a, b) => new Date(b.utcDate).getTime() - new Date(a.utcDate).getTime());

    for (const match of finishedMatches) {
      if (match.homeTeamId && !latest.has(match.homeTeamId)) latest.set(match.homeTeamId, match);
      if (match.awayTeamId && !latest.has(match.awayTeamId)) latest.set(match.awayTeamId, match);
    }

    return latest;
  }, [group.games]);
  const recentGames = useMemo(() => group.games.slice(0, 6), [group.games]);
  const selectedMatch = useMemo(
    () => recentGames.find((match) => match.id === selectedMatchId) ?? null,
    [recentGames, selectedMatchId]
  );
  const groupStandingByLetter = useMemo(() => {
    const standings = new Map<string, GroupStanding>();
    for (const standing of group.standings) standings.set(standing.group, standing);
    return standings;
  }, [group.standings]);
  useEffect(() => {
    if (selectedMatchId && !recentGames.some((match) => match.id === selectedMatchId)) setSelectedMatchId("");
  }, [recentGames, selectedMatchId]);
  useEffect(() => {
    if (!paymentName && picks[0]) setPaymentName(picks[0].name.toLocaleLowerCase("en-US"));
    if (paymentName && !picks.some((pick) => pick.name.toLocaleLowerCase("en-US") === paymentName)) {
      setPaymentName(picks[0]?.name.toLocaleLowerCase("en-US") ?? "");
    }
    if (!removeName && picks[0]) setRemoveName(picks[0].name.toLocaleLowerCase("en-US"));
    if (removeName && !picks.some((pick) => pick.name.toLocaleLowerCase("en-US") === removeName)) {
      setRemoveName(picks[0]?.name.toLocaleLowerCase("en-US") ?? "");
    }
  }, [paymentName, picks, removeName]);

  useEffect(() => {
    setEntriesLockedChoice(group.entriesLocked ? "true" : "false");
  }, [group.entriesLocked]);

  async function submitCode(event: FormEvent) {
    event.preventDefault();
    if (codeInput.trim()) await loadGroup(codeInput.trim());
  }

  async function apiPost(path: string, body: Record<string, unknown>, successMessage: string) {
    setError("");
    setNotice("");
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: groupCode, ...body }),
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Something went wrong.");
    setNotice(successMessage);
    await loadGroup(groupCode, true);
    return payload;
  }

  async function saveMyPick(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await apiPost("/api/picks", { name, teamId }, "Pick saved. The board is updated.");
      setName("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save your pick.");
    } finally {
      setLoading(false);
    }
  }

  async function updateTeamStatus(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await apiPost("/api/admin/team", { adminPin, teamId: adminTeamId, status: adminStatus }, "Team status updated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update the team.");
    } finally {
      setLoading(false);
    }
  }

  async function addGame(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await apiPost("/api/admin/game", { adminPin, homeTeamId, awayTeamId, homeScore, awayScore }, "Recent game added.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not add the game.");
    } finally {
      setLoading(false);
    }
  }

  async function syncGames() {
    setLoading(true);
    try {
      const result = await apiPost("/api/admin/sync", { adminPin }, "Scores synced.");
      setNotice(`Scores synced: ${result.matches} tournament matches found.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not sync scores.");
    } finally {
      setLoading(false);
    }
  }

  async function updatePayment(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await apiPost("/api/admin/payment", { adminPin, name: paymentName, paid: paymentPaid === "true" }, "Pool payment updated.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update the pool payment.");
    } finally {
      setLoading(false);
    }
  }

  async function removeEntry(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await apiPost("/api/admin/pick", { adminPin, name: removeName }, "Pool entry removed.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not remove the pool entry.");
    } finally {
      setLoading(false);
    }
  }

  async function updateEntrySettings(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await apiPost("/api/admin/entries", { adminPin, entriesLocked: entriesLockedChoice === "true" }, entriesLockedChoice === "true" ? "New entries locked." : "New entries opened.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update entry settings.");
    } finally {
      setLoading(false);
    }
  }

  if (!groupCode) {
    return (
      <main className="gate-shell">
        <section className="gate-card">
          <div className="mini-mark"><span>26</span></div>
          <p className="eyebrow">Private World Cup pool</p>
          <h1>Pool XI</h1>
          <p className="gate-copy">Pick a country, track the prize pool, and follow the tournament together.</p>
          <form onSubmit={submitCode} className="gate-form">
            <label htmlFor="group-code">Your group code</label>
            <div>
              <input id="group-code" value={codeInput} onChange={(event) => setCodeInput(event.target.value)} placeholder="e.g. FRIENDS26" autoCapitalize="characters" />
              <button disabled={loading}>{loading ? "Opening..." : "Join circle"}</button>
            </div>
          </form>
          {error && <p className="message error">{error}</p>}
          <p className="gate-footnote">No account needed. Ask the organizer for the code.</p>
        </section>
        <div className="gate-ball" aria-hidden="true">26</div>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Pool XI home">
          <span className="brand-mark">26</span>
          <span>Pool XI</span>
        </a>
        <div className="top-actions">
          <span className="group-chip"><i /> Group {groupCode}</span>
          <button className="text-button" onClick={() => { localStorage.removeItem("cup-circle-code"); setGroupCode(""); }}>Leave</button>
        </div>
      </header>

      <div className="page" id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow light">World Cup 2026</p>
            <h1>Your World<br /><em>Cup pool</em></h1>
            <p>A clean board for picks, payments, recent games, and who is still alive.</p>
          </div>
          <div className="hero-scoreboard">
            <div><strong>${collectedPool}</strong><span>Prize pool</span></div>
            <div><strong>{picks.length}</strong><span>Friends in</span></div>
            <div><strong>{paidCount}/{picks.length}</strong><span>Paid entries</span></div>
            <div><strong>{group.maxFriends - picks.length}</strong><span>Spots left</span></div>
          </div>
        </section>

        <section className="pick-panel">
          <div className="section-heading compact">
            <div><span className="step-number">01</span><h2>Make your pick</h2></div>
            <p>Use the same name later to change your country.</p>
          </div>
          <form className="pick-form" onSubmit={saveMyPick}>
            <label><span>Your name</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Alex" maxLength={24} required /></label>
            <label className="team-select"><span>Your country</span><select value={teamId} onChange={(event) => setTeamId(event.target.value)}>{teams.map((team) => <option key={team.id} value={team.id}>Group {team.group} · {team.name}</option>)}</select></label>
            <button className="primary-button" disabled={loading || !name.trim() || entriesArePaused}>{loading ? "Saving..." : "Lock it in"}</button>
          </form>
          {entriesArePaused && <p className="setup-note">The pool is almost ready. The organizer will open picks shortly.</p>}
          {entriesAreLocked && !entriesArePaused && <p className="setup-note locked">New entries are locked. Existing players can still update using the same name.</p>}
        </section>

        {(notice || error) && <div className={`message-bar ${error ? "error" : "success"}`}>{error || notice}<button onClick={() => { setError(""); setNotice(""); }}>×</button></div>}

        <section className="content-section">
          <div className="section-heading">
            <div><span className="step-number">02</span><h2>Recent games</h2></div>
            <span className="updated">{group.dataSource} · Updated {new Date(group.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
          </div>
          {group.games.length ? (
            <>
              <div className="matches-strip">
                {recentGames.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    active={selectedMatchId === match.id}
                    onSelect={() => setSelectedMatchId((current) => current === match.id ? "" : match.id)}
                  />
                ))}
              </div>
              {selectedMatch ? (
                <MatchDetailPanel match={selectedMatch} />
              ) : (
                <div className="match-detail-empty">Tap a match to see scorers, cards, and one quick match note.</div>
              )}
            </>
          ) : (
            <div className="empty-state small"><strong>No scores yet.</strong><span>The organizer can sync or add the first result in Admin controls.</span></div>
          )}
        </section>

        <section className="content-section">
          <div className="section-heading">
            <div><span className="step-number">03</span><h2>The circle</h2></div>
            <div className="legend"><span><i className="alive-dot" />Still in</span><span><i className="out-dot" />Eliminated</span></div>
          </div>
          {picks.length ? (
            <div className="picks-grid">{picks.map((pick) => (
              <PickCard
                key={pick.name.toLowerCase()}
                pick={pick}
                state={group.statuses[pick.teamId] ?? "alive"}
                lastResult={latestFinishedMatchByTeam.get(pick.teamId)}
                nextMatch={group.nextMatches[pick.teamId]}
                groupStanding={groupStandingByLetter.get(teamById.get(pick.teamId)?.group ?? "")}
              />
            ))}</div>
          ) : (
            <div className="empty-state"><span className="empty-number">01</span><strong>Be the first brave soul.</strong><span>Add your pick above and share the group code with the others.</span></div>
          )}
        </section>

        <section className="content-section group-section">
          <div className="section-heading">
            <div><span className="step-number">04</span><h2>Group tables</h2></div>
            <button
              className="toggle-button"
              type="button"
              aria-expanded={showGroupTables}
              onClick={() => setShowGroupTables((visible) => !visible)}
            >
              {showGroupTables ? "Hide tables" : "Show tables"}
            </button>
          </div>
          {showGroupTables ? (
            <GroupTables standings={group.standings} />
          ) : (
            <div className="standings-teaser">
              <div>
                <strong>Group standings live here.</strong>
                <span>Tap the button to open the color-coded tables after checking everyone&apos;s picks.</span>
              </div>
              <div className="group-chips" aria-hidden="true">
                {"ABCDEFGHIJKL".split("").map((groupLetter) => <span className={`group-${groupLetter.toLowerCase()}`} key={groupLetter}>{groupLetter}</span>)}
              </div>
            </div>
          )}
        </section>

        <section className="content-section">
          <div className="section-heading">
            <div><span className="step-number">05</span><h2>Prize pool</h2></div>
            <span className="updated">${group.entryFee} entry fee</span>
          </div>
          <div className="pool-summary">
            <div><strong>${collectedPool}</strong><span>Collected</span></div>
            <div><strong>${expectedPool}</strong><span>If everyone pays</span></div>
            <div><strong>{paidCount}/{picks.length}</strong><span>Paid entries</span></div>
          </div>
          {picks.length ? (
            <div className="pool-list">
              {picks.map((pick) => {
                const team = teamById.get(pick.teamId);
                return (
                  <article className="pool-row" key={`pool-${pick.name.toLowerCase()}`}>
                    <div>
                      <strong>{pick.name}</strong>
                      <span>{team?.name ?? "Unknown team"}</span>
                    </div>
                    <b className={pick.paid ? "paid" : "pending"}>{pick.paid ? "Paid $50" : "Not paid"}</b>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state small"><strong>No pool entries yet.</strong><span>Friends appear here after they make a pick.</span></div>
          )}
        </section>

        <details className="admin-panel">
          <summary><span>Organizer controls</span><small>Scores, sync and eliminations</small></summary>
          <div className="admin-body">
            <label className="pin-field"><span>Admin PIN</span><input type="password" value={adminPin} onChange={(event) => setAdminPin(event.target.value)} placeholder="Required for changes" /></label>
            <div className="admin-grid">
              <form onSubmit={updateTeamStatus} className="admin-card">
                <h3>Team status</h3>
                <select value={adminTeamId} onChange={(event) => setAdminTeamId(event.target.value)}>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select>
                <select value={adminStatus} onChange={(event) => setAdminStatus(event.target.value as TeamState)}><option value="eliminated">Eliminated</option><option value="alive">Still alive</option></select>
                <button disabled={loading || !adminPin}>Update status</button>
              </form>
              <form onSubmit={addGame} className="admin-card">
                <h3>Add a result</h3>
                <div className="score-entry"><select value={homeTeamId} onChange={(event) => setHomeTeamId(event.target.value)}>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select><input type="number" min="0" value={homeScore} onChange={(event) => setHomeScore(event.target.value)} /></div>
                <div className="score-entry"><select value={awayTeamId} onChange={(event) => setAwayTeamId(event.target.value)}>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select><input type="number" min="0" value={awayScore} onChange={(event) => setAwayScore(event.target.value)} /></div>
                <button disabled={loading || !adminPin}>Add game</button>
              </form>
              <div className="admin-card sync-card">
                <h3>Sync tournament</h3>
                <p>Refresh the public ESPN feed now. The dashboard also checks automatically every 30 seconds.</p>
                <button type="button" onClick={syncGames} disabled={loading || !adminPin}>Refresh scores now</button>
              </div>
              <form onSubmit={updateEntrySettings} className="admin-card">
                <h3>Entry lock</h3>
                <p>Close the pool to new names once your friends are in. Existing names can still update picks.</p>
                <select value={entriesLockedChoice} onChange={(event) => setEntriesLockedChoice(event.target.value)}>
                  <option value="false">Open new entries</option>
                  <option value="true">Lock new entries</option>
                </select>
                <button disabled={loading || !adminPin}>Save entry setting</button>
              </form>
              <form onSubmit={updatePayment} className="admin-card">
                <h3>Pool payment</h3>
                <select value={paymentName} onChange={(event) => setPaymentName(event.target.value)} disabled={!picks.length}>
                  {picks.length ? picks.map((pick) => <option key={pick.name.toLowerCase()} value={pick.name.toLocaleLowerCase("en-US")}>{pick.name}</option>) : <option value="">No entries yet</option>}
                </select>
                <select value={paymentPaid} onChange={(event) => setPaymentPaid(event.target.value)}>
                  <option value="true">Paid $50</option>
                  <option value="false">Not paid</option>
                </select>
                <button disabled={loading || !adminPin || !picks.length}>Update payment</button>
              </form>
              <form onSubmit={removeEntry} className="admin-card danger-card">
                <h3>Remove entry</h3>
                <p>Delete a mistaken name from the pool. They can rejoin with the correct name after this.</p>
                <select value={removeName} onChange={(event) => setRemoveName(event.target.value)} disabled={!picks.length}>
                  {picks.length ? picks.map((pick) => <option key={`remove-${pick.name.toLowerCase()}`} value={pick.name.toLocaleLowerCase("en-US")}>{pick.name}</option>) : <option value="">No entries yet</option>}
                </select>
                <button disabled={loading || !adminPin || !picks.length}>Remove person</button>
              </form>
            </div>
            {showAdminDiagnostics && <p className={group.storageMode === "cloud" || group.storageMode === "local-file" ? "storage-note" : "storage-warning"}>{storageMessage(group.storageMode)}</p>}
          </div>
        </details>
      </div>
      <footer><span>Pool XI</span><span>Built for friendly arguments.</span></footer>
    </main>
  );
}
