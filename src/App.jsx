console.log("💥💥💥 HELLO FROM LOCAL CODE 💥💥💥");
import "./App.css";
import ridersImg from "./assets/rouleur-new.png";
import rouleurNew from "./assets/rouleur-new.png";
import sprinterNew from "./assets/sprinter-new.png";
import yellowJerseyRider from "./assets/yellow-jersey-rider.png";
import mountainJerseyRider from "./assets/mountain-jersey-rider.png";
import sprintJerseyRider from "./assets/sprinter-jersey-rider.png";
import teamRiders from "./assets/team-jersey-rider.png";
import { supabase } from "./supabase";
import { useState, useEffect } from "react";


function Jersey({ type }) {
  const style = {
    width: "18px",
    height: "18px",
    display: "inline-block",
    marginRight: "6px",
    verticalAlign: "middle",
  };

  if (type === "gc") {
    return (
      <svg viewBox="0 0 24 24" style={style}>
        <path
          fill="gold"
          d="M7 3h10l2 4-3 3v11H8V10L5 7l2-4z"
        />
      </svg>
    );
  }

  if (type === "sprint") {
    return (
      <svg viewBox="0 0 24 24" style={style}>
        <path
          fill="green"
          d="M7 3h10l2 4-3 3v11H8V10L5 7l2-4z"
        />
      </svg>
    );
  }

  if (type === "mountain") {
    return (
      <svg viewBox="0 0 24 24" style={style}>
        <path
          fill="white"
          stroke="red"
          strokeWidth="2"
          d="M7 3h10l2 4-3 3v11H8V10L5 7l2-4z"
        />
      </svg>
    );
  }

  return null;
}
function TimeIcon() {
  return (
    <svg className="svg-icon" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="13" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 13V9M12 13l3 2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 2h6M12 2v3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function TourIcon() {
  return (
    <svg className="svg-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 20h10M9 17h6M10 14h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 5h8v3a4 4 0 0 1-8 0V5Z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M8 7H5c0 3 1.5 5 4 5M16 7h3c0 3-1.5 5-4 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function MountainIcon() {
  return (
    <svg className="svg-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 19L10 7l4 7 3-5 4 10H3Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 7l2 5 2-2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SprintIcon() {
  return (
    <svg className="svg-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 21V4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 5h10l-2 4 2 4H7V5Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 5v8M12 5v8M15 5v8" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
export default function App() {
console.log("🔥 APP RENDERING");

  // ======================
  // LOAD INITIAL STATE
  // ======================

const [loading, setLoading] = useState(true);
const [games, setGames] = useState({});
const [currentGame, setCurrentGame] = useState(null); 
const [name, setName] = useState("");
const [playerColor, setPlayerColor] = useState("blue");
const [deleteModal, setDeleteModal] = useState(null);
const [newGameName, setNewGameName] = useState("");
const [newGameAdminCode, setNewGameAdminCode] = useState("");
const [adminInput, setAdminInput] = useState("");
const [unlockedGames, setUnlockedGames] = useState({});
const [lockCodeInput, setLockCodeInput] = useState("");
const [showDeleteGameConfirm, setShowDeleteGameConfirm] = useState(false);
const [openFatigue, setOpenFatigue] = useState(null);
const activeGame = games[currentGame] ?? null;
const players = activeGame?.players ?? [];
const stage = activeGame?.stage ?? 1;
const results = activeGame?.results ?? {};
const fatigueCards = activeGame?.fatigue_cards ?? {};

const isLocked =
  !!activeGame?.admin_code && activeGame.admin_code.length > 0;

const isAdmin =
  !isLocked || unlockedGames[currentGame];

console.log("currentGame:", currentGame);
console.log("games keys:", Object.keys(games));

async function saveGame(patch = {}) {
  if (!currentGame) return;

  const updatedGame = {
    id: currentGame,
    name: games[currentGame]?.name,
    players,
    stage,
    results,
    ...patch,
  };

const { data, error } = await supabase
  .from("games")
  .update(updatedGame)
  .eq("id", currentGame);

console.log("🧪 SAVE RESULT:", data);

if (error) {
  console.log("SAVE ERROR:", error);
}
}

function updateCurrentGame(patch) {
  if (!currentGame) return;

  setGames((prev) => ({
    ...prev,
    [currentGame]: {
      ...prev[currentGame],
      ...patch,
    },
  }));
}

useEffect(() => {
  const channel = supabase
    .channel("games-realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "games",
      },
(payload) => {
  console.log("🔥 REALTIME:", payload);

  const eventType = payload.eventType;
  const oldRow = payload.old;
  const newRow = payload.new;

  const id = oldRow?.id ?? newRow?.id;
  if (!id) return;

  setGames((prev) => {
    const copy = { ...prev };

    if (eventType === "DELETE") {
      delete copy[id];

      // ⚠️ vigtig: brug COPY, ikke games
      const remainingIds = Object.keys(copy);

      // opdater currentGame HER (ikke udenfor)
      setCurrentGame((current) => {
        if (current !== id) return current;
        return remainingIds[0] || null;
      });

      return copy;
    }

    copy[id] = {
      ...(prev[id] || {}),
      ...(newRow || oldRow),
    };

    return copy;
  });
}
    )
    .subscribe((status) => {
      console.log("📡 Realtime status:", status);
    });

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

useEffect(() => {
  async function loadGames() {
    const { data, error } = await supabase
      .from("games")
      .select("*");

    if (error) {
      console.log(error);
      return;
    }

    if (!data) {
      setGames({});
      setCurrentGame(null);
      setLoading(false);
      return;
    }

    const formatted = Object.fromEntries(
      data.map((game) => [
        game.id,
       {
  id: game.id,
  name: game.name,
  admin_code: game.admin_code || "",
  players: game.players || [],
  stage: game.stage || 1,
  results: game.results || {},
  fatigue_cards: game.fatigue_cards || {},
},
      ])
    );

    setGames(formatted);

    setCurrentGame((prev) => {
      // behold valgt game hvis det stadig findes
      if (prev && formatted[prev]) return prev;

      // ellers vælg første
      return data?.[0]?.id || null;
    });

    setLoading(false);
  }

  loadGames();
}, []);

function unlockGame() {
  if (!currentGame) return;

  if (adminInput === activeGame?.admin_code) {
    setUnlockedGames({
      ...unlockedGames,
      [currentGame]: true,
    });

    setAdminInput("");
  } else {
    alert("Forkert admin-kode");
  }
}

function switchGame(gameId) {
  const selectedGame = games[gameId];

  if (!selectedGame) return;

  setCurrentGame(gameId);
}

async function lockCurrentGame() {
  if (!currentGame) return;
  if (activeGame?.admin_code) return;
  if (!lockCodeInput.trim()) return;

  const newCode = lockCodeInput.trim();

  const { error } = await supabase
    .from("games")
    .update({ admin_code: newCode })
    .eq("id", currentGame);

  console.log("LOCK GAME ERROR:", error);

  setLockCodeInput("");
}
  // ======================
  // SAVE EVERYTHING
  // ======================

  // =========================
  // 👥 PLAYERS
  // =========================

async function addPlayer() {
  if (!isAdmin) return;
  if (!name.trim()) return;
  if (!currentGame) return;

  const newPlayers = [
    ...players,
    { id: Date.now(), name, color: playerColor },
  ];

  await supabase
    .from("games")
    .update({ players: newPlayers })
    .eq("id", currentGame);

  setName("");
}

async function createNewGame() {
  if (!newGameName.trim()) return;

  const id = Date.now().toString();

  const newGame = {
    id,
    name: newGameName.trim(),
    admin_code: newGameAdminCode.trim(),
    players: [],
    stage: 1,
    results: {},
  };

  setGames({
    ...games,
    [id]: newGame,
  });

  setCurrentGame(id);

  setNewGameName("");
setNewGameAdminCode("");


  const { error } = await supabase.from("games").insert([
    {
      id: newGame.id,
      name: newGame.name,
      admin_code: newGame.admin_code,
      players: newGame.players,
      stage: newGame.stage,
      results: newGame.results,
    },
  ]);

  console.log("SUPABASE INSERT ERROR:", error);
}


async function deleteGame() {
  if (!isAdmin) return;
  if (!currentGame) return;

  const { error } = await supabase
    .from("games")
    .delete()
    .eq("id", currentGame);

  console.log("DELETE ERROR:", error);

  setShowDeleteGameConfirm(false);
}

function deletePlayer(playerId) {
  if (!isAdmin) return;

  const player = players.find(p => p.id === playerId);

  setDeleteModal(player);
}

function confirmDelete() {
  if (!deleteModal) return;

  const playerId = deleteModal.id;

  const updatedPlayers = players.filter(p => p.id !== playerId);

  const updatedResults = { ...results };

  Object.keys(updatedResults).forEach((stageKey) => {
    if (updatedResults[stageKey]) {
      delete updatedResults[stageKey][playerId];
    }
  });

updateCurrentGame({
  players: updatedPlayers,
  results: updatedResults,
});

saveGame({
  players: updatedPlayers,
  results: updatedResults,
});

setDeleteModal(null);
}

function cancelDelete() {
  setDeleteModal(null);
}

console.log("FIRST PLAYER:", players[0]);
function updateTieBreak(playerId, rider, direction) {
  if (!isAdmin) return;

  setGames((prev) => {
    const copy = { ...prev };

    const entry =
      copy[currentGame]
        ?.results?.[stage]?.[playerId]?.[rider];

    if (!entry) return prev;

    const current = entry.tieBreakOrder ?? 0;
    const newValue = current + direction;

    copy[currentGame].results[stage][playerId][rider] = {
      ...entry,
      tieBreakOrder: newValue,
    };

    return copy;
  });
}

function updateTieBreakOrder(list) {
  return list.map((r, index) => ({
    ...r,
    tieBreakOrder: index,
  }));
}

function moveUp(index) {
  setGames((prev) => {
    const updated = [...stageLeaderboard];

    if (index === 0) return prev;

    [updated[index - 1], updated[index]] =
      [updated[index], updated[index - 1]];

    const fixed = updateTieBreakOrder(updated);

    // TODO: gem i results (næste step)
    return prev;
  });
}

function moveDown(index) {
  setGames((prev) => {
    const updated = [...stageLeaderboard];

    if (index === updated.length - 1) return prev;

    [updated[index + 1], updated[index]] =
      [updated[index], updated[index + 1]];

    const fixed = updateTieBreakOrder(updated);

    return prev;
  });
}


  // =========================
  // 📝 RESULTS
  // =========================

async function updateResult(playerId, rider, field, value) {
  if (!isAdmin) return;
  const newResults = {
    ...results,
    [stage]: {
      ...results[stage],
      [playerId]: {
        ...results[stage]?.[playerId],
        [rider]: {
          ...results[stage]?.[playerId]?.[rider],
          [field]: value,
        },
      },
    },
  };

  await supabase
    .from("games")
    .update({ results: newResults })
    .eq("id", currentGame);

  }

  function getFatigueValue(playerId, rider) {
  return fatigueCards?.[playerId]?.[rider] ?? 0;
}

async function updateFatigue(playerId, rider, value) {
  if (!isAdmin) return;

  const newFatigueCards = {
    ...fatigueCards,
    [playerId]: {
      ...fatigueCards?.[playerId],
      [rider]: value,
    },
  };

  setGames((prev) => ({
    ...prev,
    [currentGame]: {
      ...prev[currentGame],
      fatigue_cards: newFatigueCards,
    },
  }));

  await supabase
    .from("games")
    .update({ fatigue_cards: newFatigueCards })
    .eq("id", currentGame);
}

  function getValue(playerId, rider, field) {
    return results?.[stage]?.[playerId]?.[rider]?.[field] ?? "";
  }

  function num(e) {
    return Number(e.target.value || 0);
  }

  // =========================
  // ⏱ TIME HELPERS
  // =========================

  function timeToSeconds(time) {
    if (!time) return 0;

    const parts = time.split(":");

    if (parts.length !== 2) return 0;

    return Number(parts[0]) * 60 + Number(parts[1]);
  }

  function secondsToTime(total) {
    const minutes = Math.floor(total / 60);
    const seconds = total % 60;

    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }
  
function isActive(r) {
  const hasPoints =
    r.mountain > 0 || r.sprint > 0 || r.tourPoints > 0;

  const hasTime = r.time > 0;

  return hasPoints || hasTime;
}
  // =========================
  // 📊 RIDER STATS
  // =========================

  const riderStats = [];

  players.forEach((player) => {
    ["sprinter", "rouleur"].forEach((riderType) => {
      let totalTime = 0;
      let totalTourPoints = 0;
      let totalMountain = 0;
      let totalSprint = 0;

      Object.values(results).forEach((stageData) => {
        const rider = stageData?.[player.id]?.[riderType];

        if (!rider) return;

        totalTime += timeToSeconds(rider.time);
        totalTourPoints += rider.tourPoints || 0;
        totalMountain += rider.mountain || 0;
        totalSprint += rider.sprint || 0;
      });

      riderStats.push({
        playerId: player.id,
        player: player.name,
        rider: riderType,
        time: totalTime,
        tourPoints: totalTourPoints,
        mountain: totalMountain,
        sprint: totalSprint,
      });
    });
  });

  function getLatestStageWithData() {
  const stages = Object.keys(results)
    .map(Number)
    .sort((a, b) => b - a);

  return stages[0] || 1;
}

const latestStage = getLatestStageWithData();

  // =========================
  // 🟡 CLASSIFICATIONS
  // =========================
console.log("🔥 FULL RESULTS:", results);
console.log("🏁 CURRENT STAGE:", stage);
console.log("📦 STAGE DATA:", results?.[stage]);

function toSeconds(time) {
  if (typeof time === "number") return time;

  if (typeof time === "string" && time.includes(":")) {
    const [m, s] = time.split(":").map(Number);
    return m * 60 + s;
  }

  return 0;
}

const stageLeaderboard = Object.entries(results?.[stage] || {})
  .flatMap(([playerId, riders]) =>
    Object.entries(riders || {}).map(([rider, data]) => {

      const player = players.find(
        (p) => String(p.id) === String(playerId)
      );

      const rawTime = data?.time;

      const time = toSeconds(rawTime);

      return {
        playerId,
        playerName: player?.name || "Ukendt",
        riderType: rider,
        rawTime,
        time,
        tieBreakOrder: data?.tieBreakOrder ?? 0,
      };
    })
  )
  .sort((a, b) => {
    if (a.time !== b.time) return a.time - b.time;
    return a.tieBreakOrder - b.tieBreakOrder;
  });

const gcClassification = [...riderStats].sort(
  (a, b) => {
    // først samletid
    if (a.time !== b.time) {
      return a.time - b.time;
    }

    // tie-break = seneste etape
    const aTime = timeToSeconds(
      results?.[latestStage]?.[a.playerId]?.[a.rider]?.time
    );

    const bTime = timeToSeconds(
      results?.[latestStage]?.[b.playerId]?.[b.rider]?.time
    );

    return aTime - bTime;
  }
);

const mountainClassification = [...riderStats].sort(
  (a, b) => {
    // først bjergpoint
    if (b.mountain !== a.mountain) {
      return b.mountain - a.mountain;
    }

    // tie-break = seneste etape-tid
    const aTime = timeToSeconds(
      results?.[latestStage]?.[a.playerId]?.[a.rider]?.time
    );

    const bTime = timeToSeconds(
      results?.[latestStage]?.[b.playerId]?.[b.rider]?.time
    );

    return aTime - bTime;
  }
);

const sprintClassification = [...riderStats].sort(
  (a, b) => {
    if (b.sprint !== a.sprint) {
      return b.sprint - a.sprint;
    }

    const aTime = timeToSeconds(
      results?.[latestStage]?.[a.playerId]?.[a.rider]?.time
    );

    const bTime = timeToSeconds(
      results?.[latestStage]?.[b.playerId]?.[b.rider]?.time
    );

    return aTime - bTime;
  }
);

  // =========================
  // 👥 TEAM TIME
  // =========================

  const teamClassification = players
    .map((player) => {
      let totalTime = 0;

      Object.values(results).forEach((stageData) => {
        const sprinter = stageData?.[player.id]?.sprinter;
        const rouleur = stageData?.[player.id]?.rouleur;

        totalTime +=
          timeToSeconds(sprinter?.time) +
          timeToSeconds(rouleur?.time);
      });

      return {
        playerId: player.id,
        player: player.name,
        time: totalTime,
      };
    })
    .sort((a, b) => a.time - b.time);

  // =========================
  // 🏆 BONUS SYSTEM
  // =========================

  function gcBonus(index) {
    if (index === 0) return 7;
    if (index === 1) return 5;
    if (index === 2) return 3;
    return 0;
  }

  function otherBonus(index) {
    if (index === 0) return 3;
    if (index === 1) return 2;
    if (index === 2) return 1;
    return 0;
  }

  // =========================
  // 🏆 FINAL TOTALS
  // =========================

  const finalTotals = players.map((player) => {
    let stageTourPoints = 0;

    // Etape-tourpoint
    riderStats.forEach((r) => {
      if (r.playerId === player.id) {
        stageTourPoints += r.tourPoints;
      }
    });

    // GC bonus
    let gcPoints = 0;

   gcClassification.forEach((rider, index) => {
  if (rider.playerId !== player.id) return;

  if (!isActive(rider)) return;

  gcPoints += gcBonus(index);
});

    // Mountain bonus
    let mountainPoints = 0;

   mountainClassification.forEach((rider, index) => {
  if (rider.playerId !== player.id) return;

  if (!isActive(rider)) return;

  mountainPoints += otherBonus(index);
});

    // Sprint bonus
    let sprintPoints = 0;

    sprintClassification.forEach((rider, index) => {
  if (rider.playerId !== player.id) return;

  if (!isActive(rider)) return;

  sprintPoints += otherBonus(index);
});

    // Team bonus
    let teamPoints = 0;

    const teamIndex = teamClassification.findIndex(
      (t) => t.playerId === player.id
    );

   if (teamIndex !== -1 && teamClassification[teamIndex]?.time > 0) {
  teamPoints = otherBonus(teamIndex);
}

    return {
      player: player.name,
      total:
        stageTourPoints +
        gcPoints +
        mountainPoints +
        sprintPoints +
        teamPoints,
    };
  });

  const finalClassification = [...finalTotals].sort(
    (a, b) => b.total - a.total
  );

  // =========================
  // 🧾 UI
  // =========================

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>Flamme Rouge Manager</h1>

<input
  type="text"
  placeholder="Spilnavn"
  value={newGameName}
  onChange={(e) => setNewGameName(e.target.value)}
/>

<input
  type="text"
  placeholder="Admin-kode (valgfri)"
  value={newGameAdminCode}
  onChange={(e) => setNewGameAdminCode(e.target.value)}
/>

<div className="game-switcher">
  <button onClick={createNewGame}>
    Nyt spil
  </button>

  <select
    value={currentGame ?? ""}
    onChange={(e) => switchGame(e.target.value)}
  >
    {Object.entries(games).map(([id, game]) => (
      <option key={id} value={id}>
        {game.name || "Unavngivet spil"} {game.admin_code ? "🔒" : ""}
      </option>
    ))}
  </select>
</div>

{isLocked && !isAdmin && (
  <div style={{ marginTop: "10px", marginBottom: "10px" }}>
    <strong>🔒 Dette spil er låst</strong>

    <br />

    <input
      type="password"
      placeholder="Admin-kode"
      value={adminInput}
      onChange={(e) => setAdminInput(e.target.value)}
    />

    <button onClick={unlockGame}>
      Lås op
    </button>
  </div>
)}

{isAdmin && isLocked && (
  <p>🔓 Admin-tilstand aktiv</p>
)}

<button
  onClick={() => setShowDeleteGameConfirm(true)}
  disabled={!isAdmin}
  style={{
    opacity: isAdmin ? 1 : 0.4,
    cursor: isAdmin ? "pointer" : "not-allowed",
  }}
>
  Slet spil
</button>

{!activeGame?.admin_code && (
  <>
    <input
      type="text"
      placeholder="Admin-kode"
      value={lockCodeInput}
      onChange={(e) => setLockCodeInput(e.target.value)}
    />

    <button
      onClick={lockCurrentGame}
      disabled={!lockCodeInput.trim()}
    >
      Lås spil
    </button>
  </>
)}

      {/* PLAYERS */}
<h2>Spillere</h2>

<input
  value={name}
  onChange={(e) => setName(e.target.value)}
  placeholder="Spillernavn"
/>

<select
  value={playerColor}
  onChange={(e) => setPlayerColor(e.target.value)}
>
  <option value="red">Rød</option>
  <option value="blue">Blå</option>
  <option value="white">Hvid</option>
  <option value="black">Sort</option>
  <option value="pink">Lyserød</option>
  <option value="green">Grøn</option>
</select>

<button onClick={addPlayer} disabled={!isAdmin}>
  Tilføj spiller
</button>

<ul
  className="player-list"
  style={{
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "10px",
    listStyle: "none",
    padding: 0,
    margin: 0,
  }}
>
  {players.map((p) => (
    <li
      key={p.id}
      style={{
  display: "flex",
  alignItems: "center",
  gap: "4px",
  padding: "4px 8px",
  background: "transparent",
}}
    >
      <span>{p.name}</span>

      <button
        onClick={() => deletePlayer(p.id)}
        disabled={!isAdmin}
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "red",
          fontSize: "16px",
        }}
        title="Slet spiller"
      >
        ❌
      </button>
    </li>
  ))}
</ul>

      {/* STAGE */}
      <h2>Etape</h2>

      <select
value={stage}
onChange={async (e) => {
  const newStage = Number(e.target.value);

  await supabase
    .from("games")
    .update({ stage: newStage })
    .eq("id", currentGame);
}}
      >
        {Array.from({ length: 21 }, (_, i) => (
          <option key={i + 1} value={i + 1}>
            Etape {i + 1}
          </option>
        ))}
      </select>

{/* STAGE LEADERBOARD */}
<div className="stage-newspaper">
  <div className="stage-newspaper-top">
  <div className="stage-top-left">
    Flamme Rouge
  </div>

  <div className="stage-top-center">
    <div className="stage-main-title">
      Etapestilling
    </div>
    <div className="stage-sub-title">
      Dagens resultater
    </div>
  </div>

  <div className="stage-top-right">
    Etape {stage}
  </div>
</div>

  <div className="stage-results-columns">
    {stageLeaderboard.map((r, i) => (
      <div
        key={`${r.playerId}-${r.riderType}`}
        className="stage-result-row"
      >
        <div className="stage-rank">{i + 1}</div>

        <div className="stage-rider">
          <strong>{r.playerName}</strong>
          <span>{r.riderType}</span>
        </div>

        <div className="stage-time">{r.rawTime}</div>

        <div className="tie-controls">
          <button
            className="tie-btn"
            disabled={!isAdmin}
            onClick={() => updateTieBreak(r.playerId, r.riderType, -1)}
          >
            ↑
          </button>

          <button
            className="tie-btn"
            disabled={!isAdmin}
            onClick={() => updateTieBreak(r.playerId, r.riderType, 1)}
          >
            ↓
          </button>
        </div>
      </div>
    ))}
  </div>
</div>

      {players.map((p) => (
  <div
  key={p.id}
  className="player-card"
  style={{
    "--player-color": p.color,
  }}
>
  <div className="player-card-header">
    <h3>{p.name}</h3>
  </div>

          {/* SPRINTER */}
<div
  className="rider-section sprinter-section"
  style={{
    "--riders-img": `url(${sprinterNew})`,
  }}
>
  <div className="rider-content">
    <h4 className="rider-title sprinter-title">Sprinter</h4>

    <button
  className="fatigue-toggle"
  type="button"
  onClick={() =>
    setOpenFatigue(
      openFatigue === `${p.id}-sprinter`
        ? null
        : `${p.id}-sprinter`
    )
  }
>
  Træthedskort
</button>

{openFatigue === `${p.id}-sprinter` && (
  <div className="fatigue-popover">
    <img
    src="/fatigue-rider.png"
    alt="Træt rytter"
    className="fatigue-image"
  />
    <label>
      Antal træthedskort
      <input
        disabled={!isAdmin}
        type="number"
        min="0"
        value={getFatigueValue(p.id, "sprinter")}
        onChange={(e) =>
          updateFatigue(
            p.id,
            "sprinter",
            Number(e.target.value)
          )
        }
      />
    </label>
  </div>
)}
    <div className="rider-input-grid">
      <div className="stat-field">
  <div className="stat-label">
    Tid
  </div>

  <div className="stat-input-row">
    <span className="stat-icon"><TimeIcon /></span>

    <input
      disabled={!isAdmin}
      value={getValue(p.id, "sprinter", "time")}
      onChange={(e) =>
        updateResult(
          p.id,
          "sprinter",
          "time",
          e.target.value
        )
      }
    />
  </div>
</div>

      <div className="stat-field">
  <div className="stat-label">
    Tourpoint
  </div>

  <div className="stat-input-row">
    <span className="stat-icon"><TourIcon /></span>

    <input
      disabled={!isAdmin}
      type="number"
      value={getValue(p.id, "sprinter", "tourPoints")}
      onChange={(e) =>
        updateResult(
          p.id,
          "sprinter",
          "tourPoints",
          num(e)
        )
      }
    />
  </div>
</div>

      <div className="stat-field">
  <div className="stat-label">
    Bjergpoint
  </div>

  <div className="stat-input-row">
    <span className="stat-icon"><MountainIcon /></span>

    <input
      disabled={!isAdmin}
      type="number"
      value={getValue(p.id, "sprinter", "mountain")}
      onChange={(e) =>
        updateResult(
          p.id,
          "sprinter",
          "mountain",
          num(e)
        )
      }
    />
  </div>
</div>

      <div className="stat-field">
  <div className="stat-label">
    Sprintpoint
  </div>

  <div className="stat-input-row">
    <span className="stat-icon"><SprintIcon /></span>

    <input
      disabled={!isAdmin}
      type="number"
      value={getValue(p.id, "sprinter", "sprint")}
      onChange={(e) =>
        updateResult(
          p.id,
          "sprinter",
          "sprint",
          num(e)
        )
      }
    />
  </div>
</div>

    </div>
  </div>
</div>

          {/* ROULEUR */}
        
        <div
  className="rider-section rouleur-section"
  style={{ "--riders-img": `url(${rouleurNew})` }}
>
  <div className="rider-content">
    <h4 className="rider-title rouleur-title">
      Rouleur 
    </h4>
    
    <button
  className="fatigue-toggle"
  type="button"
  onClick={() =>
    setOpenFatigue(
      openFatigue === `${p.id}-rouleur`
        ? null
        : `${p.id}-rouleur`
    )
  }
>
  Træthedskort
</button>

{openFatigue === `${p.id}-rouleur` && (
  <div className="fatigue-popover">
    <img
    src="/fatigue-rider.png"
    alt="Træt rytter"
    className="fatigue-image"
  />
    <label>
      Antal træthedskort
      <input
        disabled={!isAdmin}
        type="number"
        min="0"
        value={getFatigueValue(p.id, "rouleur")}
        onChange={(e) =>
          updateFatigue(
            p.id,
            "rouleur",
            Number(e.target.value)
          )
        }
      />
    </label>
  </div>
)}

    <div className="rider-input-grid">

  <div className="stat-field">
    <div className="stat-label">Tid</div>
    <div className="stat-input-row">
      <span className="stat-icon"><TimeIcon /></span>
      <input
        disabled={!isAdmin}
        value={getValue(p.id, "rouleur", "time")}
        onChange={(e) =>
          updateResult(p.id, "rouleur", "time", e.target.value)
        }
      />
    </div>
  </div>

  <div className="stat-field">
    <div className="stat-label">Tourpoint</div>
    <div className="stat-input-row">
      <span className="stat-icon"><TourIcon /></span>
      <input
        disabled={!isAdmin}
        type="number"
        value={getValue(p.id, "rouleur", "tourPoints")}
        onChange={(e) =>
          updateResult(p.id, "rouleur", "tourPoints", num(e))
        }
      />
    </div>
  </div>

  <div className="stat-field">
    <div className="stat-label">Bjergpoint</div>
    <div className="stat-input-row">
      <span className="stat-icon"><MountainIcon /></span>
      <input
        disabled={!isAdmin}
        type="number"
        value={getValue(p.id, "rouleur", "mountain")}
        onChange={(e) =>
          updateResult(p.id, "rouleur", "mountain", num(e))
        }
      />
    </div>
  </div>

  <div className="stat-field">
    <div className="stat-label">Sprintpoint</div>
    <div className="stat-input-row">
      <span className="stat-icon"><SprintIcon /></span>
      <input
        disabled={!isAdmin}
        type="number"
        value={getValue(p.id, "rouleur", "sprint")}
        onChange={(e) =>
          updateResult(p.id, "rouleur", "sprint", num(e))
        }
      />
    </div>
  </div>

</div>
  </div>
</div>
        </div>
      ))}
<div
  style={{
  display: "grid",
  gridTemplateColumns: "repeat(2, auto)",
  justifyContent: "center",
  columnGap: "10px",
  rowGap: "10px",
  marginTop: "20px",
  alignItems: "start",
}}
  className="dashboard-grid"
>
{/* GC */}
<div className="classification-card classification-card--yellow">
  <div className="classification-header">
    <div className="classification-portrait">
  <img
    src={yellowJerseyRider}
    alt="Gul trøje"
  />
</div>

    <div className="classification-title-block">
      
      <h2 className="classification-title">
        Den gule trøje
      </h2>

      
    </div>
  </div>

  <div className="classification-list">
    {gcClassification.map((r, i) => (
      <div
        key={i}
        className={`classification-row ${i === 0 ? "classification-row--leader" : ""}`}
      >
        <div className="classification-rank">
          {i + 1}
        </div>

        <div className="classification-rider">
          <strong>{r.player}</strong>
          <span>{r.rider}</span>
        </div>

        <div className="classification-time">
          {i === 0
            ? secondsToTime(r.time)
            : "+" + secondsToTime(r.time - gcClassification[0].time)}
        </div>
      </div>
    ))}
  </div>
</div>

     {/* MOUNTAIN */}
<div className="classification-card classification-card--mountain">
  <div className="classification-header">
    <div className="classification-portrait">
      <img
        src={mountainJerseyRider}
        alt="Bjergtrøje"
      />
    </div>

    <div className="classification-title-block">
      <h2 className="classification-title">
        Bjergtrøjen
      </h2>
    </div>
  </div>

  <div className="classification-list">
    {mountainClassification.map((r, i) => (
      <div
        key={i}
        className={`classification-row ${
          i === 0 ? "classification-row--mountain-leader" : ""
        }`}
      >
        <div className="classification-rank">
          {i + 1}
        </div>

        <div className="classification-rider">
          <strong>{r.player}</strong>
          <span>{r.rider}</span>
        </div>

        <div className="classification-time">
          {r.mountain} point
        </div>
      </div>
    ))}
  </div>
</div>

      {/* SPRINT */}
<div className="classification-card classification-card--sprint">
  <div className="classification-header">
    <div className="classification-portrait">
      <img
        src={sprintJerseyRider}
        alt="Sprinttrøje"
      />
    </div>

    <div className="classification-title-block">
      <h2 className="classification-title">
        Pointtrøjen
      </h2>
    </div>
  </div>

  <div className="classification-list">
    {sprintClassification.map((r, i) => (
      <div
        key={i}
        className={`classification-row ${
          i === 0 ? "classification-row--sprint-leader" : ""
        }`}
      >
        <div className="classification-rank">
          {i + 1}
        </div>

        <div className="classification-rider">
          <strong>{r.player}</strong>
          <span>{r.rider}</span>
        </div>

        <div className="classification-time">
          {r.sprint} point
        </div>
      </div>
    ))}
  </div>
</div>

      {/* TEAM */}
<div className="classification-card classification-card--team">
  <div className="classification-header">
    <div className="classification-portrait classification-portrait--team">
      <img
        src={teamRiders}
        alt="Holdkonkurrence"
      />
    </div>

    <div className="classification-title-block">
      <h2 className="classification-title">
        Holdtid
      </h2>
    </div>
  </div>

  <div className="classification-list">
    {teamClassification.map((t, i) => (
      <div
        key={i}
        className={`classification-row ${
          i === 0 ? "classification-row--team-leader" : ""
        }`}
      >
        <div className="classification-rank">
          {i + 1}
        </div>

        <div className="classification-rider">
          <strong>{t.player}</strong>
          <span>hold</span>
        </div>

        <div className="classification-time">
          {i === 0
            ? secondsToTime(t.time)
            : "+" + secondsToTime(t.time - teamClassification[0].time)}
        </div>
      </div>
    ))}
  </div>
</div>
</div>

     <h2 className="podium-title">
    Samlet stilling
</h2>

<div className="podium-container">

  <img
  src="/podium.png"
  alt="Podie"
  className="podium-image"
/>

  {finalClassification[0] && (
    <div className="podium-label podium-first">
      <strong>{finalClassification[0].player}</strong>
      <span>{finalClassification[0].total} point</span>
    </div>
  )}

  {finalClassification[1] && (
    <div className="podium-label podium-second">
      <strong>{finalClassification[1].player}</strong>
      <span>{finalClassification[1].total} point</span>
    </div>
  )}

  {finalClassification[2] && (
    <div className="podium-label podium-third">
      <strong>{finalClassification[2].player}</strong>
      <span>{finalClassification[2].total} point</span>
    </div>
  )}

</div>
<div style={{ marginTop: "20px" }}>
  <h3>Øvrige placeringer</h3>

  <ul style={{ listStyle: "none", paddingLeft: 0 }}>
    {finalClassification.slice(3).map((t, i) => (
      <li key={i + 3}>
        {i + 4}. {t.player} - {t.total} point
      </li>
    ))}
  </ul>
</div>
{deleteModal && (
  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,

      backgroundColor: "rgba(0,0,0,0.5)",

      display: "flex",
      justifyContent: "center",
      alignItems: "center",

      zIndex: 999,
    }}
  >
    <div
      style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "12px",
        minWidth: "280px",
        textAlign: "center",
      }}
    >
      <h3>Slet spiller?</h3>

      <p style={{ marginBottom: "20px" }}>
        {deleteModal.name}
      </p>

      <div style={{ display: "flex", justifyContent: "space-around" }}>
        <button onClick={confirmDelete}>
          Ja
        </button>

        <button onClick={cancelDelete}>
          Nej
        </button>
      </div>
    </div>
  </div>
)}
{showDeleteGameConfirm && (
  <div className="confirm-overlay">
    <div className="confirm-box">
      <h3>Slet spil?</h3>

      <p>
        Er du sikker på, at du vil slette dette spil?
      </p>

      <div className="confirm-buttons">
        <button
          onClick={() => setShowDeleteGameConfirm(false)}
        >
          Annuller
        </button>

        <button
          onClick={deleteGame}
        >
          Slet spil
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
