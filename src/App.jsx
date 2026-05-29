console.log("💥💥💥 HELLO FROM LOCAL CODE 💥💥💥");
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
const activeGame = games[currentGame];
const players = activeGame?.players ?? [];
const stage = activeGame?.stage ?? 1;
const results = activeGame?.results ?? {};

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

        const row = payload.new || payload.old;

        if (!row?.id) return;

setGames((prev) => {
  const copy = { ...prev };

  if (payload.eventType === "DELETE") {
    delete copy[row.id];

    if (row.id === currentGame) {
      setCurrentGame(null);
    }

    return copy;
  }

  copy[row.id] = {
    ...(copy[row.id] || {}),
    ...row,
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
          players: game.players || [],
          stage: game.stage || 1,
          results: game.results || {},
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


  // ======================
  // SAVE EVERYTHING
  // ======================

  // =========================
  // 👥 PLAYERS
  // =========================

async function addPlayer() {
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
  const gameName = prompt("Navn på nyt spil?");
  if (!gameName) return;

  const id = Date.now().toString();

  const newGame = {
    id,
    name: gameName.trim(),
    players: [],
    stage: 1,
    results: {},
  };

  // 1. LOCAL STATE (din nuværende app)
  const newGames = {
    ...games,
    [id]: newGame,
  };

setGames(newGames);
setCurrentGame(id);

  // 2. SUPABASE (NY DEL 🚀)
  const { error } = await supabase.from("games").insert([
    {
      id: newGame.id,
      name: newGame.name,
      players: newGame.players,
      stage: newGame.stage,
      results: newGame.results,
    },
  ]);

  console.log("SUPABASE INSERT ERROR:", error);
}

function switchGame(gameId) {
  const selectedGame = games[gameId];

  if (!selectedGame) return;

  setCurrentGame(gameId);

}

async function deleteGame() {
  if (!currentGame) return;

  const confirmDelete = window.confirm("Vil du slette dette spil?");
  if (!confirmDelete) return;

  // find næste game FØR delete
  const remainingIds = Object.keys(games).filter(
    (id) => id !== currentGame
  );

  const nextGame = remainingIds[0] || null;

  // delete i Supabase
  const { error } = await supabase
    .from("games")
    .delete()
    .eq("id", currentGame);

  console.log("DELETE ERROR:", error);

  // kun skift current game lokalt
  setCurrentGame(nextGame);
}

function deletePlayer(playerId) {
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
  // =========================
  // 📝 RESULTS
  // =========================

async function updateResult(playerId, rider, field, value) {
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

  // =========================
  // 🟡 CLASSIFICATIONS
  // =========================

  const gcClassification = [...riderStats].sort(
    (a, b) => a.time - b.time
  );

  const mountainClassification = [...riderStats].sort(
    (a, b) => b.mountain - a.mountain
  );

  const sprintClassification = [...riderStats].sort(
    (a, b) => b.sprint - a.sprint
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
      if (rider.playerId === player.id) {
        gcPoints += gcBonus(index);
      }
    });

    // Mountain bonus
    let mountainPoints = 0;

    mountainClassification.forEach((rider, index) => {
      if (rider.playerId === player.id) {
        mountainPoints += otherBonus(index);
      }
    });

    // Sprint bonus
    let sprintPoints = 0;

    sprintClassification.forEach((rider, index) => {
      if (rider.playerId === player.id) {
        sprintPoints += otherBonus(index);
      }
    });

    // Team bonus
    let teamPoints = 0;

    const teamIndex = teamClassification.findIndex(
      (t) => t.playerId === player.id
    );

    if (teamIndex !== -1) {
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

<button onClick={createNewGame}>
  Nyt spil
</button>

<select
  value={currentGame}
  onChange={(e) => switchGame(e.target.value)}
>
  {Object.entries(games).map(([id, game]) => (
    <option key={id} value={id}>
      {game.name || "Unavngivet spil"}
    </option>
  ))}
</select>

<button onClick={deleteGame}>
  Slet spil
</button>     

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

<button onClick={addPlayer}>Tilføj spiller</button>

<ul>
  {players.map((p) => (
    <li
      key={p.id}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "4px 0",
      }}
    >
      <span>{p.name}</span>

      <button
        onClick={() => deletePlayer(p.id)}
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

      {/* INPUTS */}
      {players.map((p) => (
      <div
  key={p.id}
  style={{
    border: "1px solid #e5e5e5",
    margin: 10,
    borderRadius: "12px",
    backgroundColor: "#f0f0f0",
    border: `10px solid ${p.color}`,
    boxShadow: "0 10px 10px rgba(0,0,0,0.05)",
  }}
>
          <h3>{p.name}</h3>

          {/* SPRINTER */}
          <h4>Sprinter</h4>

          <input
            placeholder="Tid mm:ss"
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

          <input
            type="number"
            placeholder="Tourpoint"
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

          <input
            type="number"
            placeholder="Bjerg"
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

          <input
            type="number"
            placeholder="Sprint"
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

          {/* ROULEUR */}
          <h4>Rouleur</h4>

          <input
            placeholder="Tid mm:ss"
            value={getValue(p.id, "rouleur", "time")}
            onChange={(e) =>
              updateResult(
                p.id,
                "rouleur",
                "time",
                e.target.value
              )
            }
          />

          <input
            type="number"
            placeholder="Tourpoint"
            value={getValue(p.id, "rouleur", "tourPoints")}
            onChange={(e) =>
              updateResult(
                p.id,
                "rouleur",
                "tourPoints",
                num(e)
              )
            }
          />

          <input
            type="number"
            placeholder="Bjerg"
            value={getValue(p.id, "rouleur", "mountain")}
            onChange={(e) =>
              updateResult(
                p.id,
                "rouleur",
                "mountain",
                num(e)
              )
            }
          />

          <input
            type="number"
            placeholder="Sprint"
            value={getValue(p.id, "rouleur", "sprint")}
            onChange={(e) =>
              updateResult(
                p.id,
                "rouleur",
                "sprint",
                num(e)
              )
            }
          />
        </div>
      ))}
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "20px",
    marginTop: "20px",
    alignItems: "start",
  }}
  className="dashboard-grid"
>
      {/* GC */}
<div
  style={{
    backgroundColor: "#f8f8f8",
    borderRadius: "14px",
    padding: "16px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
    border: "1px solid #e5e5e5",
  }}
>
    <h2
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",

    backgroundColor: "#f5f5f5",
    padding: "10px 12px",
    borderRadius: "10px",
    margin: "10px 0",

    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  }}
>
  <Jersey type="gc" />
  Gul trøje
</h2>
      <ul
  style={{
    listStyle: "none",
    padding: 0,
    margin: 0,
  }}
>
        {gcClassification.map((r, i) => (
      <li
  key={i}
  style={{
    backgroundColor:
      i === 0 ? "#fff7cc" : "transparent",

    border:
      i === 0
        ? "2px solid #f2d200"
        : "none",

    borderRadius: "10px",

    padding: "2px",

    marginBottom: "6px",

    fontWeight:
      i === 0 ? "bold" : "normal",

    boxShadow:
      i === 0
        ? "0 2px 6px rgba(0,0,0,0.12)"
        : "none",
    
  }}
>

  {i === 0 && <Jersey type="gc" />}
  {r.player} - {r.rider} - {secondsToTime(r.time)}
</li>
        ))}
      </ul>
</div>

      {/* MOUNTAIN */}
<div
  style={{
    backgroundColor: "#f8f8f8",
    borderRadius: "14px",
    padding: "16px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
    border: "1px solid #e5e5e5",
  }}
>
<h2
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",

    backgroundColor: "#f5f5f5",
    padding: "10px 12px",
    borderRadius: "10px",
    margin: "10px 0",

    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  }}
>
  <Jersey type="mountain" />
  Bjergtrøje
</h2>

      <ul
  style={{
    listStyle: "none",
    padding: 0,
    margin: 0,
  }}
>
        {mountainClassification.map((r, i) => (
          <li
  key={i}
  style={{
    backgroundColor: i === 0 ? "#fff0f0" : "transparent",
border: i === 0 ? "2px solid #d33" : "none",

    borderRadius: "10px",

    padding: "2px",

    marginBottom: "6px",

    fontWeight:
      i === 0 ? "bold" : "normal",

    boxShadow:
      i === 0
        ? "0 2px 6px rgba(0,0,0,0.12)"
        : "none",
  }}
>
  {i === 0 && <Jersey type="mountain" />}
  {r.player} - {r.rider} - {r.mountain} point
</li>
        ))}
      </ul>
</div>

      {/* SPRINT */}
<div
  style={{
    backgroundColor: "#f8f8f8",
    borderRadius: "14px",
    padding: "16px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
    border: "1px solid #e5e5e5",
  }}
>
     <h2
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",

    backgroundColor: "#f5f5f5",
    padding: "10px 12px",
    borderRadius: "10px",
    margin: "10px 0",

    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  }}
>
  <Jersey type="sprint" />
  Pointtrøje
</h2>

      <ul
  style={{
    listStyle: "none",
    padding: 0,
    margin: 0,
  }}
>
        {sprintClassification.map((r, i) => (
        <li
  key={i}
  style={{
    backgroundColor: i === 0 ? "#efffed" : "transparent",
border: i === 0 ? "2px solid #2fa84f" : "none",

    borderRadius: "10px",

    padding: "2px",

    marginBottom: "6px",

    fontWeight:
      i === 0 ? "bold" : "normal",

    boxShadow:
      i === 0
        ? "0 2px 6px rgba(0,0,0,0.12)"
        : "none",
  }}
>
  {i === 0 && <Jersey type="sprint" />}
  {r.player} - {r.rider} - {r.sprint} point
</li>
        ))}
      </ul>
</div>

      {/* TEAM */}
<div
  style={{
    backgroundColor: "#f8f8f8",
    borderRadius: "14px",
    padding: "16px",
    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
    border: "1px solid #e5e5e5",
  }}
>
   <h2
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",

    backgroundColor: "#f5f5f5",
    padding: "10px 12px",
    borderRadius: "10px",
    margin: "10px 0",

    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  }}
>
  👥 Holdkonkurrence
</h2>

      <ul
  style={{
    listStyle: "none",
    padding: 0,
    margin: 0,
  }}
>
        {teamClassification.map((t, i) => (
       <li
  key={i}
  style={{
    backgroundColor: i === 0 ? "#f2f2f2" : "transparent",
border: i === 0 ? "2px solid #555" : "none",

    borderRadius: "10px",

    padding: "2px",

    marginBottom: "6px",

    fontWeight:
      i === 0 ? "bold" : "normal",

    boxShadow:
      i === 0
        ? "0 2px 6px rgba(0,0,0,0.12)"
        : "none",
  }}
>
  {i === 0 && "👥 "}
  {t.player} - {secondsToTime(t.time)}
</li>
        ))}
      </ul>
</div>
</div>

      {/* FINAL */}
    <h2>🏆 Samlet stilling</h2>

<div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
  
  {/* 2. plads */}
  {finalClassification[1] && (
    <div style={{
      flex: 1,
      background: "#c0c0c0",
      padding: "10px",
      borderRadius: "10px",
      textAlign: "center",
      height: "120px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center"
    }}>
      <div style={{ fontSize: "24px" }}>🥈</div>
      <strong>{finalClassification[1].player}</strong>
      <div>{finalClassification[1].total} point</div>
    </div>
  )}

  {/* 1. plads */}
  {finalClassification[0] && (
    <div style={{
      flex: 1.2,
      background: "gold",
      padding: "10px",
      borderRadius: "10px",
      textAlign: "center",
      height: "150px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      boxShadow: "0 4px 10px rgba(0,0,0,0.2)"
    }}>
      <div style={{ fontSize: "30px" }}>🥇</div>
      <strong>{finalClassification[0].player}</strong>
      <div>{finalClassification[0].total} point</div>
    </div>
  )}

  {/* 3. plads */}
  {finalClassification[2] && (
    <div style={{
      flex: 1,
      background: "#cd7f32",
      padding: "10px",
      borderRadius: "10px",
      textAlign: "center",
      height: "100px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center"
    }}>
      <div style={{ fontSize: "20px" }}>🥉</div>
      <strong>{finalClassification[2].player}</strong>
      <div>{finalClassification[2].total} point</div>
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
    </div>
  );
}
