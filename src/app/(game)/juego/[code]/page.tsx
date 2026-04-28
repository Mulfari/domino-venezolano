"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Board } from "@/components/game/board";
import { Hand } from "@/components/game/hand";
import { OpponentHand } from "@/components/game/opponent-hand";
import { ScorePanel } from "@/components/game/score-panel";
import { TurnIndicator } from "@/components/game/turn-indicator";
import { TurnTimer } from "@/components/game/turn-timer";
import { GameOverModal } from "@/components/game/game-over-modal";
import { DisconnectOverlay } from "@/components/game/disconnect-overlay";
import { ChatPanel } from "@/components/chat/chat-panel";
import { SoundToggle } from "@/components/game/sound-toggle";
import { LandscapePrompt } from "@/components/game/landscape-prompt";
import { useGameChannel } from "@/lib/realtime/use-game-channel";
import { useGameStore } from "@/stores/game-store";
import { playTilePlace, playPass, playYourTurn, playVictory, playDefeat } from "@/lib/sounds/sound-engine";
import type { GameEvent } from "@/lib/realtime/events";
import type { Tile, Seat } from "@/lib/game/types";

/* ------------------------------------------------------------------ */
/*  Types for the /api/game/state response                            */
/* ------------------------------------------------------------------ */
interface SeatInfo {
  user_id: string;
  display_name: string;
}

interface GameStateResponse {
  game_id: string;
  room_id: string;
  room_code: string;
  board: { left: number | null; right: number | null; plays: { tile: Tile; seat: Seat; end: "left" | "right" }[] };
  hand: Tile[];
  hand_counts: number[];
  current_turn: Seat;
  consecutive_passes: number;
  status: "dealing" | "playing" | "finished";
  scores: { team0: number; team1: number };
  seat: number;
  seats: (SeatInfo | null)[];
  host_id: string | null;
  round: number;
  target_score: number;
}

/* ------------------------------------------------------------------ */
/*  Relative seat positions from the local player's perspective       */
/* ------------------------------------------------------------------ */
function getRelativeSeats(mySeat: Seat): {
  bottom: Seat;
  top: Seat;
  left: Seat;
  right: Seat;
} {
  return {
    bottom: mySeat,
    left: ((mySeat + 1) % 4) as Seat,
    top: ((mySeat + 2) % 4) as Seat,
    right: ((mySeat + 3) % 4) as Seat,
  };
}

/* ------------------------------------------------------------------ */
/*  Main page component                                               */
/* ------------------------------------------------------------------ */
export default function GamePage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const gameId = params.code; // The [code] param is actually the game UUID

  /* ---- Local UI state ---- */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("Jugador");
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [hostId, setHostId] = useState<string | null>(null);
  const [handCounts, setHandCounts] = useState<number[]>([7, 7, 7, 7]);
  const [actionLoading, setActionLoading] = useState(false);

  /* ---- Zustand store ---- */
  const mySeat = useGameStore((s) => s.mySeat);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const players = useGameStore((s) => s.players);
  const status = useGameStore((s) => s.status);
  const selectedTile = useGameStore((s) => s.selectedTile);
  const selectTile = useGameStore((s) => s.selectTile);
  const setMySeat = useGameStore((s) => s.setMySeat);
  const setPlayers = useGameStore((s) => s.setPlayers);
  const setGameState = useGameStore((s) => s.setGameState);
  const setScores = useGameStore((s) => s.setScores);
  const setRound = useGameStore((s) => s.setRound);
  const setTargetScore = useGameStore((s) => s.setTargetScore);
  const setRoundResult = useGameStore((s) => s.setRoundResult);
  const updatePlayerConnection = useGameStore((s) => s.updatePlayerConnection);
  const playTile = useGameStore((s) => s.playTile);
  const passTurn = useGameStore((s) => s.passTurn);
  const reset = useGameStore((s) => s.reset);

  /* Refs to keep values stable for callbacks */
  const gameIdRef = useRef(gameId);
  gameIdRef.current = gameId;
  const mySeatRef = useRef(mySeat);
  mySeatRef.current = mySeat;

  /* ---------------------------------------------------------------- */
  /*  Fetch session + game state on mount                             */
  /* ---------------------------------------------------------------- */
  const fetchGameState = useCallback(async (gId?: string) => {
    const targetGameId = gId ?? gameIdRef.current;
    try {
      const res = await fetch(`/api/game/state?game_id=${targetGameId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Error ${res.status}`);
      }
      const data: GameStateResponse = await res.json();

      setRoomCode(data.room_code);
      setRoomId(data.room_id);
      setHostId(data.host_id);
      setMySeat(data.seat as Seat);
      setHandCounts(data.hand_counts);

      // Build player info from seats
      const playerInfos = data.seats.map((s, i) => ({
        seat: i as Seat,
        displayName: s?.display_name ?? `Jugador ${i + 1}`,
        connected: false,
        isBot: s?.user_id?.startsWith("bot_") ?? false,
      }));
      setPlayers(playerInfos);

      // Build hands: own hand is real, opponents get empty arrays
      // (we only know their counts, not their tiles)
      const handsObj = { 0: [] as Tile[], 1: [] as Tile[], 2: [] as Tile[], 3: [] as Tile[] };
      handsObj[data.seat as Seat] = data.hand;
      // For opponent hand counts, we store empty arrays — OpponentHand uses handCounts
      setGameState({
        board: data.board,
        hands: handsObj,
        currentTurn: data.current_turn,
        consecutivePasses: data.consecutive_passes,
        status: data.status,
      });

      setScores({ 0: data.scores.team0, 1: data.scores.team1 });
      setRound(data.round);
      setTargetScore(data.target_score);

      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al cargar la partida.";
      setError(msg);
      return null;
    }
  }, [setMySeat, setPlayers, setGameState, setScores, setRound, setTargetScore]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // Get current user session
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      if (!cancelled) {
        setUserId(user.id);
        setDisplayName(
          user.user_metadata?.display_name || user.email?.split("@")[0] || "Jugador"
        );
      }

      // Fetch game state
      const data = await fetchGameState();
      if (!cancelled) {
        setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [gameId, router, fetchGameState]);

  /* ---- "Your turn" sound ---- */
  const prevTurnRef = useRef<number | null>(null);
  useEffect(() => {
    if (
      mySeat !== null &&
      currentTurn === mySeat &&
      status === "playing" &&
      prevTurnRef.current !== null &&
      prevTurnRef.current !== mySeat
    ) {
      playYourTurn();
    }
    prevTurnRef.current = currentTurn;
  }, [currentTurn, mySeat, status]);

  /* ---------------------------------------------------------------- */
  /*  Handle realtime game events                                     */
  /* ---------------------------------------------------------------- */
  const handleGameEvent = useCallback(
    (event: GameEvent) => {
      const currentSeat = mySeatRef.current;

      switch (event.type) {
        case "tile_played": {
          playTilePlace();
          if (currentSeat !== null && event.seat === currentSeat) {
            break;
          }
          setHandCounts((prev) => {
            const next = [...prev];
            if (next[event.seat] > 0) next[event.seat]--;
            return next;
          });
          fetchGameState();
          break;
        }

        case "turn_passed": {
          playPass();
          if (currentSeat !== null && event.seat === currentSeat) {
            break;
          }
          fetchGameState();
          break;
        }

        case "round_started": {
          // New round — fetch fresh state with the new game_id
          if (event.game_id !== gameIdRef.current) {
            router.replace(`/juego/${event.game_id}`);
            gameIdRef.current = event.game_id;
          }
          setRoundResult(null);
          reset();
          fetchGameState(event.game_id);
          break;
        }

        case "round_ended": {
          const myTeam = currentSeat !== null ? (currentSeat % 2) : null;
          if (myTeam !== null && event.winner_team === myTeam) {
            playVictory();
          } else if (event.winner_team !== null) {
            playDefeat();
          }
          setScores({ 0: event.scores.team0, 1: event.scores.team1 });
          setRoundResult({
            winner_team: event.winner_team as (0 | 1 | null),
            points: event.points,
            reason: event.reason,
          });
          break;
        }

        case "game_state_sync": {
          const s = event.state;
          const handsObj = { 0: [] as Tile[], 1: [] as Tile[], 2: [] as Tile[], 3: [] as Tile[] };
          if (currentSeat !== null) {
            handsObj[currentSeat] = s.hands[currentSeat] ?? [];
          }
          setHandCounts(s.hands.map((h: Tile[]) => h.length));
          setGameState({
            board: s.board,
            hands: handsObj,
            currentTurn: s.current_turn,
            consecutivePasses: s.consecutive_passes,
            status: s.status,
          });
          break;
        }

        case "player_connected": {
          updatePlayerConnection(event.seat as Seat, true);
          break;
        }

        case "player_disconnected": {
          updatePlayerConnection(event.seat as Seat, false);
          break;
        }
      }
    },
    [fetchGameState, setScores, setRoundResult, setGameState, updatePlayerConnection, reset, router]
  );

  /* ---------------------------------------------------------------- */
  /*  Subscribe to realtime channel                                   */
  /* ---------------------------------------------------------------- */
  useGameChannel({
    roomCode: roomCode ?? "",
    userId: userId ?? "",
    displayName,
    seat: mySeat ?? 0,
    onEvent: handleGameEvent,
    onPresenceChange: (presencePlayers) => {
      for (let i = 0; i < 4; i++) {
        const present = presencePlayers.some((p) => p.seat === i);
        updatePlayerConnection(i as Seat, present);
      }
    },
    onReconnected: () => {
      fetchGameState();
    },
  });

  /* ---------------------------------------------------------------- */
  /*  Action handlers — call API endpoints                            */
  /* ---------------------------------------------------------------- */
  async function handlePlayTile(tile: Tile, end: "left" | "right") {
    if (actionLoading) return;
    setActionLoading(true);

    // Optimistic update
    playTile(tile, end);
    setHandCounts((prev) => {
      const next = [...prev];
      if (mySeat !== null && next[mySeat] > 0) next[mySeat]--;
      return next;
    });

    try {
      const res = await fetch("/api/game/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_id: gameIdRef.current, tile, end }),
      });

      if (!res.ok) {
        // Revert optimistic update on failure
        await fetchGameState();
        const body = await res.json().catch(() => ({}));
        console.error("Play failed:", body.error);
      }
    } catch (err) {
      console.error("Play error:", err);
      await fetchGameState();
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePass() {
    if (actionLoading) return;
    setActionLoading(true);

    // Optimistic update
    passTurn();

    try {
      const res = await fetch("/api/game/pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game_id: gameIdRef.current }),
      });

      if (!res.ok) {
        await fetchGameState();
        const body = await res.json().catch(() => ({}));
        console.error("Pass failed:", body.error);
      }
    } catch (err) {
      console.error("Pass error:", err);
      await fetchGameState();
    } finally {
      setActionLoading(false);
    }
  }

  function handlePlaceEnd(end: "left" | "right") {
    if (selectedTile) {
      handlePlayTile(selectedTile, end);
      selectTile(null);
    }
  }

  async function handleNextRound() {
    if (!roomId || actionLoading) return;
    setActionLoading(true);

    try {
      const res = await fetch("/api/game/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_id: roomId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error("Next round failed:", body.error);
      }
      // The round_started event from realtime will handle the state update
    } catch (err) {
      console.error("Next round error:", err);
    } finally {
      setActionLoading(false);
    }
  }

  function handleBackToLobby() {
    router.push("/");
  }

  /* ---------------------------------------------------------------- */
  /*  Loading / error states                                          */
  /* ---------------------------------------------------------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-felt gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c9a84c] border-t-transparent" />
        <p className="text-[#a8c4a0] animate-pulse text-sm">Cargando partida...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-felt gap-4 px-4">
        <div className="rounded-2xl bg-red-950/30 border border-red-900/40 p-6 max-w-sm text-center space-y-3">
          <p className="text-red-400 font-semibold">Error</p>
          <p className="text-sm text-red-300/80">{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); fetchGameState().then(() => setLoading(false)); }}
            className="rounded-xl bg-[#3a2210] hover:bg-[#4a2c0f] px-5 py-2 text-sm text-[#f5f0e8] transition-colors"
          >
            Reintentar
          </button>
          <button
            onClick={() => router.push("/")}
            className="block mx-auto text-sm text-[#a8c4a0]/60 hover:text-[#f5f0e8] transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  if (mySeat === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-felt">
        <p className="text-[#a8c4a0] animate-pulse">Conectando...</p>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Render the game                                                 */
  /* ---------------------------------------------------------------- */
  const seats = getRelativeSeats(mySeat);

  function getPlayerName(seat: Seat): string {
    return players.find((p) => p.seat === seat)?.displayName ?? `Jugador ${seat + 1}`;
  }

  function getPlayerConnected(seat: Seat): boolean {
    return players.find((p) => p.seat === seat)?.connected ?? false;
  }

  const isHost = userId === hostId;

  return (
    <div className="h-[100dvh] flex flex-col bg-felt overflow-hidden select-none">
      {/* Landscape prompt for mobile portrait */}
      <LandscapePrompt />

      {/* Top bar: score + turn indicator */}
      <div className="flex items-start justify-between p-2 sm:p-4 shrink-0 gap-1">
        <ScorePanel />
        <div className="flex flex-col items-center gap-0.5 sm:gap-1 min-w-0">
          <TurnIndicator />
          <TurnTimer />
        </div>
        {/* Room code badge + sound */}
        <div className="min-w-0 sm:min-w-[160px] flex items-center justify-end gap-1 sm:gap-2">
          <SoundToggle />
          {roomCode && (
            <div className="rounded-lg bg-[#3a2210]/80 border border-[#c9a84c]/20 px-2 sm:px-3 py-1 sm:py-1.5 text-center">
              <span className="text-[10px] uppercase tracking-wider text-[#a8c4a0]/60 block leading-tight">
                Sala
              </span>
              <span className="text-[10px] sm:text-xs font-mono font-semibold text-[#c9a84c] tracking-widest">
                {roomCode}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Partner (top) */}
      <div className="flex justify-center shrink-0 pb-1 sm:pb-2">
        <OpponentHand
          seat={seats.top}
          tileCount={handCounts[seats.top] ?? 0}
          playerName={getPlayerName(seats.top)}
          connected={getPlayerConnected(seats.top)}
          isCurrentTurn={currentTurn === seats.top}
          position="top"
        />
      </div>

      {/* Middle row: left opponent, board, right opponent */}
      <div className="flex flex-1 min-h-0 items-center">
        {/* Left opponent */}
        <div className="shrink-0 px-1 sm:px-4">
          <OpponentHand
            seat={seats.left}
            tileCount={handCounts[seats.left] ?? 0}
            playerName={getPlayerName(seats.left)}
            connected={getPlayerConnected(seats.left)}
            isCurrentTurn={currentTurn === seats.left}
            position="left"
          />
        </div>

        {/* Board */}
        <Board onPlaceEnd={handlePlaceEnd} />

        {/* Right opponent */}
        <div className="shrink-0 px-1 sm:px-4">
          <OpponentHand
            seat={seats.right}
            tileCount={handCounts[seats.right] ?? 0}
            playerName={getPlayerName(seats.right)}
            connected={getPlayerConnected(seats.right)}
            isCurrentTurn={currentTurn === seats.right}
            position="right"
          />
        </div>
      </div>

      {/* Player hand (bottom) */}
      <div className="shrink-0 pt-1 sm:pt-2 border-t border-[#c9a84c]/15">
        <Hand onPlayTile={handlePlayTile} onPass={handlePass} />
      </div>

      {/* Disconnect overlay */}
      <DisconnectOverlay />

      {/* Game over modal */}
      <GameOverModal
        onNextRound={isHost ? handleNextRound : undefined}
        onBackToLobby={handleBackToLobby}
      />

      {/* Chat panel */}
      {userId && roomCode && (
        <ChatPanel
          roomCode={roomCode}
          gameId={gameIdRef.current}
          userId={userId}
          displayName={displayName}
        />
      )}
    </div>
  );
}
