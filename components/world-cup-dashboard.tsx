"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { flagUrl, teamById, teams } from "@/lib/teams";
import type { GroupData, Match, Pick, TeamState } from "@/lib/types";

const emptyGroup: GroupData = {
  picks: [],
  statuses: {},
  games: [],
  maxFriends: 20,
  entryFee: 50,
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

function MatchCard({ match }: { match: Match }) {
  const isFinished = match.status === "FINISHED";
  return (
    <article className="match-card">
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
    </article>
  );
}

function PickCard({ pick, state }: { pick: Pick; state: TeamState }) {
  const team = teamById.get(pick.teamId);
  if (!team) return null;
  const initials = pick.name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase();
  const paymentState = pick.paid ? "paid" : "unpaid";
  const statusLabel = state === "eliminated" ? "Out" : pick.paid ? "Still in" : "Not paid";

  return (
    <article className={`pick-card ${state} ${paymentState}`}>
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

  useEffect(() => {
    if (!paymentName && picks[0]) setPaymentName(picks[0].name.toLocaleLowerCase("en-US"));
    if (paymentName && !picks.some((pick) => pick.name.toLocaleLowerCase("en-US") === paymentName)) {
      setPaymentName(picks[0]?.name.toLocaleLowerCase("en-US") ?? "");
    }
  }, [paymentName, picks]);

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
          <div>
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

        <div className={`storage-banner ${group.storageMode === "temporary" ? "warning" : "ok"}`}>
          <strong>{group.storageMode === "temporary" ? "Do not share yet" : "Storage ready"}</strong>
          <span>{storageMessage(group.storageMode)}</span>
        </div>

        <section className="pick-panel">
          <div className="section-heading compact">
            <div><span className="step-number">01</span><h2>Make your pick</h2></div>
            <p>Use the same name later to change your country.</p>
          </div>
          <form className="pick-form" onSubmit={saveMyPick}>
            <label><span>Your name</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Alex" maxLength={24} required /></label>
            <label className="team-select"><span>Your country</span><select value={teamId} onChange={(event) => setTeamId(event.target.value)}>{teams.map((team) => <option key={team.id} value={team.id}>Group {team.group} · {team.name}</option>)}</select></label>
            <button className="primary-button" disabled={loading || !name.trim() || group.storageMode === "temporary"}>{loading ? "Saving..." : "Lock it in"}</button>
          </form>
        </section>

        {(notice || error) && <div className={`message-bar ${error ? "error" : "success"}`}>{error || notice}<button onClick={() => { setError(""); setNotice(""); }}>×</button></div>}

        <section className="content-section">
          <div className="section-heading">
            <div><span className="step-number">02</span><h2>Recent games</h2></div>
            <span className="updated">{group.dataSource} · Updated {new Date(group.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
          </div>
          {group.games.length ? (
            <div className="matches-strip">{group.games.slice(0, 6).map((match) => <MatchCard key={match.id} match={match} />)}</div>
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
            <div className="picks-grid">{picks.map((pick) => <PickCard key={pick.name.toLowerCase()} pick={pick} state={group.statuses[pick.teamId] ?? "alive"} />)}</div>
          ) : (
            <div className="empty-state"><span className="empty-number">01</span><strong>Be the first brave soul.</strong><span>Add your pick above and share the group code with the others.</span></div>
          )}
        </section>

        <section className="content-section">
          <div className="section-heading">
            <div><span className="step-number">04</span><h2>Prize pool</h2></div>
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
            </div>
            {group.storageMode !== "cloud" && <p className={group.storageMode === "local-file" ? "storage-note" : "storage-warning"}>{storageMessage(group.storageMode)}</p>}
          </div>
        </details>
      </div>
      <footer><span>Pool XI</span><span>Built for friendly arguments.</span></footer>
    </main>
  );
}
