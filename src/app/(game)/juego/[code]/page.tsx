"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Board } from "@/components/game/board";
import { Hand } from "@/components/game/hand";
import { OpponentHand } from "@/components/game/opponent-hand";
import { PassIndicator } from "@/components/game/pass-indicator";
import { ScorePanel } from "@/components/game/score-panel";
import { TurnIndicator } from "@/components/game/turn-indicator";
import { TurnTimer } from "@/components/game/turn-timer";
import { GameOverModal } from "@/components/game/game-over-modal";
import { DisconnectOverlay } from "@/components/game/disconnect-overlay";
import { ChatPanel } from "@/components/chat/chat-panel";
import { SoundToggle } from "@/components/game/sound-toggle";
import { TileTracker } from "@/components/game/tile-tracker";
import { MoveLog } from "@/components/game/move-log";
import { BoardEnds } from "@/components/game/board-ends";
import { LandscapePrompt } from "@/components/game/landscape-prompt";
import { DominoSplash } from "@/components/game/domino-splash";
import { PassMeter } from "@/components/game/pass-meter";
import { useGameChannel } from "@/hooks/use-game-channel";
import { useGameStore } from "@/stores/game-store";
import { playTilePlace, playPass, playYourTurn, playVictory, playDefeat, playCapicua, playUnaFicha, playShuffle, playDouble, playStreak, playCochina } from "@/lib/sounds/sound-engine";
import { requestNotificationPermission, notifyTurn } from "@/lib/notifications/turn-notification";
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
    right: ((mySeat + 1) % 4) as Seat,
    top: ((mySeat + 2) % 4) as Seat,
    left: ((mySeat + 3) % 4) as Seat,
  };
}

/* ------------------------------------------------------------------ */
/*  Animated score counter for the round transition overlay           */
/* ------------------------------------------------------------------ */
function AnimatedScore({ from, to, duration = 900, delay = 0 }: { from: number; to: number; duration?: number; delay?: number }) {
  const [display, setDisplay] = useState(from);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (from === to) { setDisplay(to); return; }
    let startTime: number | null = null;
    function tick(now: number) {
      if (startTime === null) startTime = now;
      const elapsed = now - startTime - delay;
      if (elapsed < 0) { rafRef.current = requestAnimationFrame(tick); return; }
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [from, to, duration, delay]);

  return <>{display}</>;
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
  const [lastPassSeat, setLastPassSeat] = useState<Seat | null>(null);
  const [unaFichaAlert, setUnaFichaAlert] = useState<{ name: string; seat: Seat } | null>(null);
  const unaFichaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevHandCountsRef = useRef<number[]>([7, 7, 7, 7]);
  const [dominoSplash, setDominoSplash] = useState<{ playerName: string; isMyTeam: boolean; reason: "domino" | "locked" } | null>(null);
  const [tilePlayedAlert, setTilePlayedAlert] = useState<{ name: string; tile: Tile; seat: Seat } | null>(null);
  const tilePlayedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [capicuaAlert, setCapicuaAlert] = useState(false);
  const capicuaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevCapicuaRef = useRef(false);
  const [cochinaAlert, setCochinaAlert] = useState<{ name: string } | null>(null);
  const cochinaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevFirstPlayRef = useRef<string | null>(null);
  const [boardTransitioning, setBoardTransitioning] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [transitionRound, setTransitionRound] = useState<number | null>(null);
  const [transitionScores, setTransitionScores] = useState<{ prev: { 0: number; 1: number }; next: { 0: number; 1: number } } | null>(null);
  const [transitionWinner, setTransitionWinner] = useState<{ team: 0 | 1 | null; points: number; reason: string } | null>(null);
  const [transitionStarter, setTransitionStarter] = useState<{ name: string; isMe: boolean } | null>(null);
  const passTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const scores = useGameStore((s) => s.scores);
  const targetScore = useGameStore((s) => s.targetScore);
  const setScores = useGameStore((s) => s.setScores);
  const setRound = useGameStore((s) => s.setRound);
  const setTargetScore = useGameStore((s) => s.setTargetScore);
  const setRoundResult = useGameStore((s) => s.setRoundResult);
  const addRoundHistory = useGameStore((s) => s.addRoundHistory);
  const addMoveLog = useGameStore((s) => s.addMoveLog);
  const updatePlayerConnection = useGameStore((s) => s.updatePlayerConnection);
  const playTile = useGameStore((s) => s.playTile);
  const passTurn = useGameStore((s) => s.passTurn);
  const reset = useGameStore((s) => s.reset);

  /* Refs to keep values stable for callbacks */
  const gameIdRef = useRef(gameId);
  gameIdRef.current = gameId;
  const mySeatRef = useRef(mySeat);
  mySeatRef.current = mySeat;
  const roundRef = useRef(useGameStore.getState().round);
  useEffect(() => { roundRef.current = useGameStore.getState().round; });

  const showPassIndicator = useCallback((seat: Seat) => {
    if (passTimerRef.current) clearTimeout(passTimerRef.current);
    setLastPassSeat(seat);
    passTimerRef.current = setTimeout(() => setLastPassSeat(null), 2000);
  }, []);

  // Detect when any player drops to 1 tile and show the ¡Una ficha! toast
  useEffect(() => {
    const prev = prevHandCountsRef.current;
    handCounts.forEach((count, seat) => {
      if (count === 1 && prev[seat] > 1) {
        const name = players.find((p) => p.seat === seat)?.displayName ?? `Jugador ${seat + 1}`;
        playUnaFicha();
        if (unaFichaTimerRef.current) clearTimeout(unaFichaTimerRef.current);
        setUnaFichaAlert({ name, seat: seat as Seat });
        unaFichaTimerRef.current = setTimeout(() => setUnaFichaAlert(null), 3000);
      }
    });
    prevHandCountsRef.current = [...handCounts];
  }, [handCounts, players]);

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

  /* ---- Periodic state refresh (fallback for missed events) ---- */
  useEffect(() => {
    if (status !== "playing" || !mySeat) return;
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchGameState();
      }
    }, 15_000);
    return () => clearInterval(interval);
  }, [status, mySeat, fetchGameState]);

  /* ---- Request notification permission ---- */
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  /* ---- Warn before leaving mid-game ---- */
  useEffect(() => {
    if (status !== "playing") return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [status]);

  /* ---- Capicúa detection ---- */
  const board = useGameStore((s) => s.board);
  useEffect(() => {
    const isCapicua = board.left !== null && board.left === board.right && board.plays.length > 1;
    if (isCapicua && !prevCapicuaRef.current) {
      playCapicua();
      setCapicuaAlert(true);
      if (capicuaTimerRef.current) clearTimeout(capicuaTimerRef.current);
      capicuaTimerRef.current = setTimeout(() => setCapicuaAlert(false), 3200);
    }
    prevCapicuaRef.current = isCapicua;
  }, [board]);

  /* ---- Cochina detection — 6-6 opens the game ---- */
  useEffect(() => {
    const firstPlay = board.plays[0];
    if (!firstPlay) { prevFirstPlayRef.current = null; return; }
    const key = `${firstPlay.tile[0]}-${firstPlay.tile[1]}-${firstPlay.seat}`;
    if (key === prevFirstPlayRef.current) return;
    prevFirstPlayRef.current = key;
    if (firstPlay.tile[0] === 6 && firstPlay.tile[1] === 6) {
      playCochina();
      const name = players.find((p) => p.seat === firstPlay.seat)?.displayName ?? `Jugador ${firstPlay.seat + 1}`;
      if (cochinaTimerRef.current) clearTimeout(cochinaTimerRef.current);
      setCochinaAlert({ name });
      cochinaTimerRef.current = setTimeout(() => setCochinaAlert(null), 3500);
    }
  }, [board.plays, players]);

  /* ---- "Your turn" sound + browser notification ---- */
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
      notifyTurn();
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
          const playedTile = event.tile as Tile;
          if (playedTile[0] === playedTile[1]) playDouble();
          else playTilePlace();
          const playedName = useGameStore.getState().players.find((p) => p.seat === event.seat)?.displayName ?? `Jugador ${event.seat + 1}`;
          addMoveLog({ seat: event.seat as Seat, playerName: playedName, type: "play", tile: event.tile as Tile, round: roundRef.current });
          if (currentSeat !== null && event.seat === currentSeat) {
            break;
          }
          setHandCounts((prev) => {
            const next = [...prev];
            if (next[event.seat] > 0) next[event.seat]--;
            return next;
          });
          // Show a brief toast with the tile the opponent played
          if (tilePlayedTimerRef.current) clearTimeout(tilePlayedTimerRef.current);
          setTilePlayedAlert({ name: playedName, tile: event.tile as Tile, seat: event.seat as Seat });
          tilePlayedTimerRef.current = setTimeout(() => setTilePlayedAlert(null), 2200);
          fetchGameState();
          break;
        }

        case "turn_passed": {
          playPass();
          showPassIndicator(event.seat as Seat);
          const passedName = useGameStore.getState().players.find((p) => p.seat === event.seat)?.displayName ?? `Jugador ${event.seat + 1}`;
          addMoveLog({ seat: event.seat as Seat, playerName: passedName, type: "pass", round: roundRef.current });
          if (currentSeat !== null && event.seat === currentSeat) {
            break;
          }
          fetchGameState();
          break;
        }

        case "round_started": {
          playShuffle();
          setBoardTransitioning(true);
          setTimeout(async () => {
            if (event.game_id !== gameIdRef.current) {
              router.replace(`/juego/${event.game_id}`);
              gameIdRef.current = event.game_id;
            }
            setRoundResult(null);
            reset();
            await fetchGameState(event.game_id);
            const state = useGameStore.getState();
            setTransitionRound(state.round);
            const starterSeat = state.currentTurn;
            const starterPlayer = state.players.find((p) => p.seat === starterSeat);
            const starterName = starterPlayer?.displayName ?? `Jugador ${starterSeat + 1}`;
            const isMe = state.mySeat === starterSeat;
            setTransitionStarter({ name: starterName, isMe });
          }, 700);
          setTimeout(() => {
            setBoardTransitioning(false);
            setTransitionRound(null);
            setTransitionScores(null);
            setTransitionWinner(null);
            setTransitionStarter(null);
          }, 2800);
          break;
        }

        case "round_ended": {
          const myTeam = currentSeat !== null ? (currentSeat % 2) : null;
          if (myTeam !== null && event.winner_team === myTeam) {
            playVictory();
          } else if (event.winner_team !== null) {
            playDefeat();
          }
          // Capture current scores before updating so the overlay can animate from old → new
          const prevScores = useGameStore.getState().scores;
          setTransitionWinner({
            team: event.winner_team as (0 | 1 | null),
            points: event.points,
            reason: event.reason,
          });
          setTransitionScores({
            prev: { 0: prevScores[0], 1: prevScores[1] },
            next: { 0: event.scores.team0, 1: event.scores.team1 },
          });
          setScores({ 0: event.scores.team0, 1: event.scores.team1 });
          setRoundResult({
            winner_team: event.winner_team as (0 | 1 | null),
            points: event.points,
            reason: event.reason,
          });
          addRoundHistory({
            round: roundRef.current,
            winner_team: event.winner_team as (0 | 1 | null),
            points: event.points,
            reason: event.reason,
          });

          // Play streak sound when a team wins 3+ consecutive rounds
          if (event.winner_team !== null) {
            const updatedHistory = useGameStore.getState().roundHistory;
            let streak = 0;
            for (let i = updatedHistory.length - 1; i >= 0; i--) {
              if (updatedHistory[i].winner_team === event.winner_team) streak++;
              else break;
            }
            if (streak >= 3) playStreak();
          }

          if (event.reason === "domino") {
            // Find who played the last tile — they dominoed
            const lastPlay = useGameStore.getState().board.plays.at(-1);
            const dominoSeat = lastPlay?.seat ?? null;
            const dominoPlayer = dominoSeat !== null
              ? (useGameStore.getState().players.find((p) => p.seat === dominoSeat)?.displayName ?? `Jugador ${dominoSeat + 1}`)
              : "Jugador";
            const isMyTeamDomino = dominoSeat !== null && currentSeat !== null
              ? (dominoSeat % 2) === (currentSeat % 2)
              : false;
            setDominoSplash({ playerName: dominoPlayer, isMyTeam: isMyTeamDomino, reason: "domino" });
            // Show splash for 1.6s, then start board transition
            setTimeout(() => {
              setDominoSplash(null);
              setBoardTransitioning(true);
            }, 1600);
          } else if (event.reason === "locked") {
            // Show trancado splash briefly before board transition
            const isMyTeamLocked = currentSeat !== null && event.winner_team !== null
              ? (currentSeat % 2) === event.winner_team
              : false;
            setDominoSplash({ playerName: "", isMyTeam: isMyTeamLocked, reason: "locked" });
            setTimeout(() => {
              setDominoSplash(null);
              setBoardTransitioning(true);
            }, 1600);
          } else {
            // Start the board fade + overlay as soon as the round ends
            setBoardTransitioning(true);
          }
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
    [fetchGameState, setScores, setRoundResult, addRoundHistory, setGameState, updatePlayerConnection, reset, router, showPassIndicator]
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

    if (tile[0] === tile[1]) playDouble();
    else playTilePlace();

    // Log own play
    if (mySeat !== null) {
      addMoveLog({ seat: mySeat, playerName: displayName, type: "play", tile, round: roundRef.current });
    }

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

    // Log own pass
    if (mySeat !== null) {
      addMoveLog({ seat: mySeat, playerName: displayName, type: "pass", round: roundRef.current });
    }

    // Optimistic update
    passTurn();
    if (mySeat !== null) showPassIndicator(mySeat);

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

  function handleAutoPlay() {
    const moves = useGameStore.getState().validMoves();
    if (moves.length > 0) {
      handlePlayTile(moves[0].tile, moves[0].end);
    }
  }

  function handleBackToLobby() {
    router.push("/");
  }

  function handleRevancha() {
    if (roomCode) router.push(`/sala/${roomCode}`);
    else router.push("/");
  }

  function handleCopyCode() {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode).catch(() => {});
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    setCopiedCode(true);
    copiedTimerRef.current = setTimeout(() => setCopiedCode(false), 1800);
  }

  /* ---------------------------------------------------------------- */
  /*  Loading / error states                                          */
  /* ---------------------------------------------------------------- */
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-felt gap-3" role="status" aria-label="Cargando partida">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#c9a84c] border-t-transparent" />
        <p className="text-[#a8c4a0] animate-pulse text-sm">Cargando partida...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-felt gap-4 px-4">
        <div role="alert" className="rounded-2xl bg-red-950/30 border border-red-900/40 p-6 max-w-sm text-center space-y-3">
          <p className="text-red-400 font-semibold">Error</p>
          <p className="text-sm text-red-300/80">{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); fetchGameState().then(() => setLoading(false)); }}
            aria-label="Reintentar cargar la partida"
            className="rounded-xl bg-[#3a2210] hover:bg-[#4a2c0f] px-5 py-2 text-sm text-[#f5f0e8] transition-colors"
          >
            Reintentar
          </button>
          <button
            onClick={() => router.push("/")}
            aria-label="Volver al inicio"
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
      <div className="flex items-center justify-between px-1.5 py-0.5 sm:p-4 shrink-0 gap-1">
        <ScorePanel />
        <div className="flex items-center gap-1 sm:flex-col sm:gap-1 min-w-0">
          <TurnIndicator />
          <TurnTimer onAutoPass={handlePass} onAutoPlay={handleAutoPlay} />
        </div>
        {/* Room code badge + sound */}
        <div className="min-w-0 sm:min-w-[160px] flex items-center justify-end gap-1 sm:gap-2">
          <MoveLog />
          <TileTracker />
          <SoundToggle />
          {roomCode && (
            <motion.button
              onClick={handleCopyCode}
              whileTap={{ scale: 0.93 }}
              aria-label={`Código de sala: ${roomCode}. Toca para copiar`}
              className="relative rounded-lg bg-[#3a2210]/80 border border-[#c9a84c]/20 px-2 sm:px-3 py-1 sm:py-1.5 text-center overflow-hidden min-h-[36px] flex flex-col items-center justify-center"
              style={{ minWidth: 44 }}
            >
              <AnimatePresence mode="wait">
                {copiedCode ? (
                  <motion.span
                    key="copied"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="text-[10px] font-bold text-green-400 uppercase tracking-wider leading-none whitespace-nowrap"
                  >
                    ¡Copiado!
                  </motion.span>
                ) : (
                  <motion.span
                    key="code"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="flex flex-col items-center leading-tight"
                  >
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#a8c4a0]/60 leading-none">
                      Sala
                    </span>
                    <span className="text-[11px] sm:text-xs font-mono font-semibold text-[#c9a84c] tracking-widest leading-none mt-0.5">
                      {roomCode}
                    </span>
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )}
        </div>
      </div>

      {/* Round transition overlay */}
      <AnimatePresence>
        {boardTransitioning && (
          <motion.div
            key="round-transition"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 backdrop-blur-md pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 1.04, opacity: 0, y: -12 }}
              transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.05 }}
              className="flex flex-col items-center gap-3"
            >
              {/* Winner badge */}
              {transitionWinner && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="flex flex-col items-center gap-1"
                >
                  {transitionWinner.team === null ? (
                    <span className="text-[12px] uppercase tracking-[0.2em] text-[#a8c4a0]/80 font-semibold">
                      Empate
                    </span>
                  ) : (
                    <>
                      <span
                        className="text-[12px] uppercase tracking-[0.2em] font-bold"
                        style={{
                          color: (mySeat !== null && transitionWinner.team === (mySeat % 2))
                            ? "#c9a84c"
                            : "rgba(168,196,160,0.85)",
                        }}
                      >
                        {(mySeat !== null && transitionWinner.team === (mySeat % 2))
                          ? "¡Ganamos la ronda!"
                          : "Ronda para ellos"}
                      </span>
                      <span className="text-[10px] text-[#a8c4a0]/50 uppercase tracking-widest">
                        {transitionWinner.reason === "domino" ? "dominó" : transitionWinner.reason === "locked" ? "trancado" : "empate"} · +{transitionWinner.points} pts
                      </span>
                    </>
                  )}
                </motion.div>
              )}

              {/* Decorative line */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="h-px w-40 bg-gradient-to-r from-transparent via-[#c9a84c]/55 to-transparent"
              />

              {/* Score display with count-up animation */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.3 }}
                className="flex items-center gap-6"
              >
                {([0, 1] as const).map((team) => {
                  const myTeam = mySeat !== null ? (mySeat % 2) as 0 | 1 : null;
                  const isMyTeam = myTeam === team;
                  const color = isMyTeam ? "#c9a84c" : "#a8c4a0";
                  const fromScore = transitionScores?.prev[team] ?? scores[team];
                  const toScore = transitionScores?.next[team] ?? scores[team];
                  const pctFrom = Math.min((fromScore / (targetScore || 100)) * 100, 100);
                  const pctTo = Math.min((toScore / (targetScore || 100)) * 100, 100);
                  const isWinner = transitionWinner?.team === team;
                  return (
                    <div key={team} className="flex flex-col items-center gap-1.5 min-w-[72px]">
                      <span
                        className="text-[9px] uppercase tracking-widest font-bold"
                        style={{ color: isMyTeam ? "#c9a84c" : "rgba(168,196,160,0.65)" }}
                      >
                        {isMyTeam ? "◆ " : ""}Equipo {team + 1}
                      </span>
                      <div className="relative flex items-center justify-center">
                        <motion.span
                          className="text-3xl font-bold tabular-nums leading-none"
                          style={{ color, textShadow: isMyTeam ? "0 0 20px rgba(201,168,76,0.45)" : undefined }}
                        >
                          <AnimatedScore from={fromScore} to={toScore} duration={900} delay={300} />
                        </motion.span>
                        {isWinner && transitionWinner && transitionWinner.team !== null && (
                          <motion.span
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: -20 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.6, duration: 0.5 }}
                            className="absolute -top-1 -right-2 text-[11px] font-bold text-green-400 tabular-nums pointer-events-none"
                            style={{ textShadow: "0 0 8px rgba(74,222,128,0.7)" }}
                          >
                            +{transitionWinner.points}
                          </motion.span>
                        )}
                      </div>
                      <div className="w-20 h-1.5 rounded-full bg-black/35 overflow-hidden">
                        <motion.div
                          initial={{ width: `${pctFrom}%` }}
                          animate={{ width: `${pctTo}%` }}
                          transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                      <span className="text-[8px] tabular-nums" style={{ color: "rgba(168,196,160,0.4)" }}>
                        /{targetScore}
                      </span>
                    </div>
                  );
                })}
              </motion.div>

              {/* Decorative line */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="h-px w-40 bg-gradient-to-r from-transparent via-[#c9a84c]/55 to-transparent"
              />

              {/* New round label */}
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#a8c4a0]/55 font-semibold">
                  Nueva ronda
                </span>
                {transitionRound !== null && (
                  <motion.span
                    key={transitionRound}
                    initial={{ opacity: 0, scale: 0.55 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 340, damping: 20, delay: 0.15 }}
                    className="text-5xl font-bold text-[#c9a84c] tabular-nums leading-none"
                    style={{ textShadow: "0 0 36px rgba(201,168,76,0.5)" }}
                  >
                    {transitionRound}
                  </motion.span>
                )}
              </div>

              {/* Who starts the new round */}
              <AnimatePresence>
                {transitionStarter && (
                  <motion.div
                    key="starter"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.45, duration: 0.3 }}
                    className="flex items-center gap-2 rounded-full px-4 py-1.5"
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(201,168,76,0.25)",
                    }}
                  >
                    {/* Domino pip icon */}
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <rect x="1" y="1" width="12" height="12" rx="2.5" fill="none" stroke="#c9a84c" strokeWidth="1.2" opacity="0.7"/>
                      <circle cx="7" cy="7" r="2" fill="#c9a84c" opacity="0.9"/>
                    </svg>
                    <span className="text-[10px] text-[#a8c4a0]/60 uppercase tracking-widest leading-none">
                      Empieza
                    </span>
                    <span
                      className="text-[11px] font-bold leading-none truncate max-w-[100px]"
                      style={{
                        color: transitionStarter.isMe ? "#c9a84c" : "#f5f0e8",
                        textShadow: transitionStarter.isMe ? "0 0 12px rgba(201,168,76,0.6)" : undefined,
                      }}
                    >
                      {transitionStarter.isMe ? "¡Tú!" : transitionStarter.name}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="h-4 w-4 animate-spin rounded-full border-2 border-[#c9a84c]/50 border-t-transparent"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game area — fades out/in on round transitions */}
      <motion.div
        animate={{
          opacity: boardTransitioning ? 0 : 1,
          scale: boardTransitioning ? 0.97 : 1,
          filter: boardTransitioning ? "blur(6px)" : "blur(0px)",
        }}
        transition={{ duration: 0.35, ease: "easeInOut" }}
        className="flex flex-col flex-1 min-h-0"
      >
      {/* Partner (top) */}
      <div className="flex justify-center shrink-0 pb-0.5 sm:pb-2">
        <OpponentHand
          seat={seats.top}
          tileCount={handCounts[seats.top] ?? 0}
          playerName={getPlayerName(seats.top)}
          connected={getPlayerConnected(seats.top)}
          isCurrentTurn={currentTurn === seats.top}
          isBot={players.find((p) => p.seat === seats.top)?.isBot ?? false}
          isPartner
          position="top"
          showPass={lastPassSeat === seats.top}
        />
      </div>

      {/* Middle row: left opponent, board, right opponent */}
      <div className="relative flex flex-1 min-h-0 items-center">
        {/* Left opponent — absolute overlay on mobile, in-flow on desktop */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 sm:relative sm:left-auto sm:top-auto sm:translate-y-0 sm:shrink-0 sm:px-4">
          <OpponentHand
            seat={seats.left}
            tileCount={handCounts[seats.left] ?? 0}
            playerName={getPlayerName(seats.left)}
            connected={getPlayerConnected(seats.left)}
            isCurrentTurn={currentTurn === seats.left}
            isBot={players.find((p) => p.seat === seats.left)?.isBot ?? false}
            position="left"
            showPass={lastPassSeat === seats.left}
          />
        </div>

        {/* Board — takes full width on mobile */}
        <div className="relative flex flex-col items-center flex-1 min-h-0">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20">
            <PassMeter />
          </div>
          <Board onPlaceEnd={handlePlaceEnd} clearing={boardTransitioning} />
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20">
            <BoardEnds />
          </div>
        </div>

        {/* Right opponent — absolute overlay on mobile, in-flow on desktop */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 sm:relative sm:right-auto sm:top-auto sm:translate-y-0 sm:shrink-0 sm:px-4">
          <OpponentHand
            seat={seats.right}
            tileCount={handCounts[seats.right] ?? 0}
            playerName={getPlayerName(seats.right)}
            connected={getPlayerConnected(seats.right)}
            isCurrentTurn={currentTurn === seats.right}
            isBot={players.find((p) => p.seat === seats.right)?.isBot ?? false}
            position="right"
            showPass={lastPassSeat === seats.right}
          />
        </div>
      </div>

      {/* Player hand (bottom) */}
      <motion.div
        className="relative shrink-0 pt-0.5 sm:pt-2 border-t"
        animate={currentTurn === mySeat && status === "playing" ? {
          borderColor: ["rgba(201,168,76,0.15)", "rgba(201,168,76,0.65)", "rgba(201,168,76,0.15)"],
          boxShadow: ["0 -2px 0px rgba(201,168,76,0)", "0 -6px 20px rgba(201,168,76,0.28)", "0 -2px 0px rgba(201,168,76,0)"],
        } : {
          borderColor: "rgba(201,168,76,0.15)",
          boxShadow: "none",
        }}
        transition={currentTurn === mySeat && status === "playing" ? {
          duration: 2.2,
          repeat: Infinity,
          ease: "easeInOut",
        } : { duration: 0.5 }}
      >
        <PassIndicator show={lastPassSeat === mySeat} />
        <Hand onPlayTile={handlePlayTile} onPass={handlePass} disabled={actionLoading} />
      </motion.div>
      </motion.div>

      {/* ¡Una ficha! toast */}
      <AnimatePresence>
        {unaFichaAlert && (
          <motion.div
            key={`una-${unaFichaAlert.seat}`}
            initial={{ opacity: 0, y: -24, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 420, damping: 24 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
            role="status"
            aria-live="polite"
          >
            <div
              className="flex items-center gap-2.5 rounded-full px-5 py-2.5 backdrop-blur-sm"
              style={{
                background: "linear-gradient(135deg, #2a1600 0%, #1a0e00 100%)",
                border: "1.5px solid rgba(201,168,76,0.7)",
                boxShadow: "0 0 32px 8px rgba(201,168,76,0.35), 0 8px 24px rgba(0,0,0,0.8)",
              }}
            >
              {/* Domino icon */}
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <rect x="1" y="1" width="18" height="18" rx="3" fill="#1a0e00" stroke="#c9a84c" strokeWidth="1.5"/>
                <line x1="1" y1="10" x2="19" y2="10" stroke="#c9a84c" strokeWidth="1"/>
                <circle cx="10" cy="5" r="2" fill="#c9a84c"/>
              </svg>
              <div className="flex flex-col leading-tight">
                <span className="text-[13px] font-black text-[#c9a84c] uppercase tracking-widest leading-none">
                  ¡Una ficha!
                </span>
                <span className="text-[10px] text-[#f5f0e8]/65 leading-none mt-0.5 truncate max-w-[120px]">
                  {unaFichaAlert.name}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tile played toast — shows what tile an opponent just played */}
      <AnimatePresence>
        {tilePlayedAlert && (
          <motion.div
            key={`played-${tilePlayedAlert.seat}-${tilePlayedAlert.tile[0]}-${tilePlayedAlert.tile[1]}`}
            initial={{ opacity: 0, y: 20, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 420, damping: 24 }}
            className="fixed bottom-40 sm:bottom-28 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
            role="status"
            aria-live="polite"
          >
            <div
              className="flex items-center gap-2.5 rounded-full px-4 py-2 backdrop-blur-sm"
              style={{
                background: "linear-gradient(135deg, #0e1e14 0%, #071408 100%)",
                border: "1.5px solid rgba(168,196,160,0.35)",
                boxShadow: "0 0 20px rgba(0,0,0,0.7), 0 6px 18px rgba(0,0,0,0.6)",
              }}
            >
              {/* Mini domino icon showing the tile */}
              <svg width="28" height="16" viewBox="0 0 28 16" fill="none" aria-hidden="true">
                <rect x="0.75" y="0.75" width="26.5" height="14.5" rx="2.5" fill="#f5f0e8" stroke="#c9a84c" strokeWidth="1.5"/>
                <line x1="14" y1="1.5" x2="14" y2="14.5" stroke="#c9a84c" strokeWidth="1"/>
                {/* Left pip(s) — center only for odd values */}
                {tilePlayedAlert.tile[0] % 2 === 1 && <circle cx="7" cy="8" r="1.5" fill="#1a1a1a"/>}
                {tilePlayedAlert.tile[0] >= 2 && <circle cx="4" cy="5" r="1.2" fill="#1a1a1a"/>}
                {tilePlayedAlert.tile[0] >= 2 && <circle cx="10" cy="11" r="1.2" fill="#1a1a1a"/>}
                {tilePlayedAlert.tile[0] >= 4 && <circle cx="10" cy="5" r="1.2" fill="#1a1a1a"/>}
                {tilePlayedAlert.tile[0] >= 4 && <circle cx="4" cy="11" r="1.2" fill="#1a1a1a"/>}
                {tilePlayedAlert.tile[0] === 6 && <circle cx="4" cy="8" r="1.2" fill="#1a1a1a"/>}
                {tilePlayedAlert.tile[0] === 6 && <circle cx="10" cy="8" r="1.2" fill="#1a1a1a"/>}
                {/* Right pip(s) — center only for odd values */}
                {tilePlayedAlert.tile[1] % 2 === 1 && <circle cx="21" cy="8" r="1.5" fill="#1a1a1a"/>}
                {tilePlayedAlert.tile[1] >= 2 && <circle cx="18" cy="5" r="1.2" fill="#1a1a1a"/>}
                {tilePlayedAlert.tile[1] >= 2 && <circle cx="24" cy="11" r="1.2" fill="#1a1a1a"/>}
                {tilePlayedAlert.tile[1] >= 4 && <circle cx="24" cy="5" r="1.2" fill="#1a1a1a"/>}
                {tilePlayedAlert.tile[1] >= 4 && <circle cx="18" cy="11" r="1.2" fill="#1a1a1a"/>}
                {tilePlayedAlert.tile[1] === 6 && <circle cx="18" cy="8" r="1.2" fill="#1a1a1a"/>}
                {tilePlayedAlert.tile[1] === 6 && <circle cx="24" cy="8" r="1.2" fill="#1a1a1a"/>}
              </svg>
              <div className="flex flex-col leading-tight">
                <span className="text-[11px] font-black text-[#a8c4a0] uppercase tracking-widest leading-none">
                  {tilePlayedAlert.name}
                </span>
                <span className="text-[9px] text-[#a8c4a0]/50 leading-none mt-0.5">
                  jugó {tilePlayedAlert.tile[0]}·{tilePlayedAlert.tile[1]}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ¡Capicúa! toast — fires when both open ends match */}
      <AnimatePresence>
        {capicuaAlert && (
          <motion.div
            key="capicua-toast"
            initial={{ opacity: 0, y: -28, scale: 0.82 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 440, damping: 24 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
            role="status"
            aria-live="polite"
          >
            <div
              className="flex items-center gap-3 rounded-full px-5 py-2.5 backdrop-blur-sm"
              style={{
                background: "linear-gradient(135deg, #1a0e2a 0%, #0e0818 100%)",
                border: "1.5px solid rgba(201,168,76,0.75)",
                boxShadow: "0 0 36px 10px rgba(201,168,76,0.3), 0 8px 28px rgba(0,0,0,0.85)",
              }}
            >
              {/* Double-pip domino icon */}
              <svg width="36" height="20" viewBox="0 0 36 20" fill="none" aria-hidden="true">
                <rect x="0.75" y="0.75" width="34.5" height="18.5" rx="3" fill="#1a0e2a" stroke="#c9a84c" strokeWidth="1.5"/>
                <line x1="18" y1="1.5" x2="18" y2="18.5" stroke="#c9a84c" strokeWidth="1"/>
                <circle cx="9" cy="10" r="3" fill="#c9a84c"/>
                <circle cx="27" cy="10" r="3" fill="#c9a84c"/>
              </svg>
              <div className="flex flex-col leading-tight">
                <motion.span
                  className="text-[14px] font-black uppercase tracking-widest leading-none"
                  style={{ color: "#c9a84c", textShadow: "0 0 16px rgba(201,168,76,0.8)" }}
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                >
                  ¡Capicúa!
                </motion.span>
                <span className="text-[10px] text-[#f5f0e8]/55 leading-none mt-0.5 uppercase tracking-wider">
                  ambos extremos iguales
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ¡Cochina! toast — fires when 6-6 opens the game */}
      <AnimatePresence>
        {cochinaAlert && (
          <motion.div
            key="cochina-toast"
            initial={{ opacity: 0, y: -28, scale: 0.82 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 440, damping: 24 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
            role="status"
            aria-live="polite"
          >
            <div
              className="flex items-center gap-3 rounded-full px-5 py-2.5 backdrop-blur-sm"
              style={{
                background: "linear-gradient(135deg, #1a0e00 0%, #2a1800 100%)",
                border: "1.5px solid rgba(201,168,76,0.85)",
                boxShadow: "0 0 40px 12px rgba(201,168,76,0.4), 0 8px 28px rgba(0,0,0,0.85)",
              }}
            >
              {/* Double-six domino icon */}
              <svg width="40" height="22" viewBox="0 0 40 22" fill="none" aria-hidden="true">
                <rect x="0.75" y="0.75" width="38.5" height="20.5" rx="3.5" fill="#1a0e00" stroke="#c9a84c" strokeWidth="1.5"/>
                <line x1="20" y1="1.5" x2="20" y2="20.5" stroke="#c9a84c" strokeWidth="1"/>
                {/* Left 6 pips */}
                <circle cx="6" cy="5" r="1.5" fill="#c9a84c"/>
                <circle cx="10" cy="5" r="1.5" fill="#c9a84c"/>
                <circle cx="6" cy="11" r="1.5" fill="#c9a84c"/>
                <circle cx="10" cy="11" r="1.5" fill="#c9a84c"/>
                <circle cx="6" cy="17" r="1.5" fill="#c9a84c"/>
                <circle cx="10" cy="17" r="1.5" fill="#c9a84c"/>
                {/* Right 6 pips */}
                <circle cx="26" cy="5" r="1.5" fill="#c9a84c"/>
                <circle cx="30" cy="5" r="1.5" fill="#c9a84c"/>
                <circle cx="26" cy="11" r="1.5" fill="#c9a84c"/>
                <circle cx="30" cy="11" r="1.5" fill="#c9a84c"/>
                <circle cx="26" cy="17" r="1.5" fill="#c9a84c"/>
                <circle cx="30" cy="17" r="1.5" fill="#c9a84c"/>
              </svg>
              <div className="flex flex-col leading-tight">
                <motion.span
                  className="text-[14px] font-black uppercase tracking-widest leading-none"
                  style={{ color: "#c9a84c", textShadow: "0 0 18px rgba(201,168,76,0.9)" }}
                  animate={{ opacity: [1, 0.7, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                >
                  ¡Cochina!
                </motion.span>
                <span className="text-[10px] text-[#f5f0e8]/60 leading-none mt-0.5 truncate max-w-[130px]">
                  {cochinaAlert.name} abre con doble seis
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ¡Dominó! splash */}
      {dominoSplash && (
        <DominoSplash
          show={true}
          playerName={dominoSplash.playerName}
          isMyTeam={dominoSplash.isMyTeam}
        />
      )}

      {/* Disconnect overlay */}
      <DisconnectOverlay />

      {/* Game over modal */}
      <GameOverModal
        onNextRound={isHost ? handleNextRound : undefined}
        onBackToLobby={handleBackToLobby}
        onRevancha={isHost ? handleRevancha : undefined}
      />

      {/* Chat panel */}
      {userId && roomCode && (
        <ChatPanel
          roomCode={roomCode}
          roomId={roomId}
          gameId={gameIdRef.current}
          userId={userId}
          displayName={displayName}
        />
      )}
    </div>
  );
}
