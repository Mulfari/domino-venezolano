"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Board } from "@/components/game/board";
import { Hand } from "@/components/game/hand";
import { OpponentHand } from "@/components/game/opponent-hand";
import { ScorePanel } from "@/components/game/score-panel";
import { TurnIndicator } from "@/components/game/turn-indicator";
import { GameOverModal } from "@/components/game/game-over-modal";
import { useGameStore } from "@/stores/game-store";
import type { Tile, Seat } from "@/lib/game/types";

/**
 * Relative seat positions from the local player's perspective.
 * mySeat is always at the bottom. Partner is across (top).
 * Left and right opponents are on the sides.
 */
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

export default function GamePage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();

  const mySeat = useGameStore((s) => s.mySeat);
  const hands = useGameStore((s) => s.hands);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const players = useGameStore((s) => s.players);
  const status = useGameStore((s) => s.status);
  const selectedTile = useGameStore((s) => s.selectedTile);
  const playTile = useGameStore((s) => s.playTile);
  const passTurn = useGameStore((s) => s.passTurn);
  const selectTile = useGameStore((s) => s.selectTile);
  const setMySeat = useGameStore((s) => s.setMySeat);
  const setPlayers = useGameStore((s) => s.setPlayers);
  const setGameState = useGameStore((s) => s.setGameState);
  const setRoundResult = useGameStore((s) => s.setRoundResult);

  // TODO: Replace with real Supabase subscription in Phase 5
  useEffect(() => {
    // Placeholder: set up demo state for development
    if (players.length === 0) {
      setMySeat(0);
      setPlayers([
        { seat: 0, displayName: "Tú", connected: true },
        { seat: 1, displayName: "Carlos", connected: true },
        { seat: 2, displayName: "María", connected: true },
        { seat: 3, displayName: "Pedro", connected: true },
      ]);
      setGameState({
        board: { left: null, right: null, plays: [] },
        hands: {
          0: [[6, 6], [5, 4], [3, 2], [1, 0], [6, 3], [5, 1], [4, 2]],
          1: [[6, 5], [4, 4], [3, 3], [2, 1], [6, 2], [5, 0], [4, 1]],
          2: [[6, 4], [5, 5], [3, 1], [2, 0], [6, 1], [5, 3], [4, 0]],
          3: [[6, 0], [5, 2], [4, 3], [3, 0], [2, 2], [1, 1], [0, 0]],
        },
        currentTurn: 0 as Seat,
        consecutivePasses: 0,
        status: "playing",
      });
    }
  }, [players.length, setMySeat, setPlayers, setGameState]);

  if (mySeat === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <p className="text-slate-400 animate-pulse">Cargando partida...</p>
      </div>
    );
  }

  const seats = getRelativeSeats(mySeat);

  function getPlayerName(seat: Seat): string {
    return players.find((p) => p.seat === seat)?.displayName ?? `Jugador ${seat + 1}`;
  }

  function getPlayerConnected(seat: Seat): boolean {
    return players.find((p) => p.seat === seat)?.connected ?? false;
  }

  function handlePlayTile(tile: Tile, end: "left" | "right") {
    playTile(tile, end);
    // TODO: Send to server via Supabase in Phase 5
  }

  function handlePass() {
    passTurn();
    // TODO: Send to server via Supabase in Phase 5
  }

  function handlePlaceEnd(end: "left" | "right") {
    if (selectedTile) {
      handlePlayTile(selectedTile, end);
      selectTile(null);
    }
  }

  function handleNextRound() {
    setRoundResult(null);
    // TODO: Request next round from server
  }

  function handleBackToLobby() {
    router.push("/");
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 overflow-hidden select-none">
      {/* Top bar: score + turn indicator */}
      <div className="flex items-start justify-between p-3 sm:p-4 shrink-0">
        <ScorePanel />
        <TurnIndicator />
        <div className="min-w-[160px]" /> {/* Spacer for balance */}
      </div>

      {/* Partner (top) */}
      <div className="flex justify-center shrink-0 pb-2">
        <OpponentHand
          seat={seats.top}
          tileCount={hands[seats.top].length}
          playerName={getPlayerName(seats.top)}
          connected={getPlayerConnected(seats.top)}
          isCurrentTurn={currentTurn === seats.top}
          position="top"
        />
      </div>

      {/* Middle row: left opponent, board, right opponent */}
      <div className="flex flex-1 min-h-0 items-center">
        {/* Left opponent */}
        <div className="shrink-0 px-2 sm:px-4">
          <OpponentHand
            seat={seats.left}
            tileCount={hands[seats.left].length}
            playerName={getPlayerName(seats.left)}
            connected={getPlayerConnected(seats.left)}
            isCurrentTurn={currentTurn === seats.left}
            position="left"
          />
        </div>

        {/* Board */}
        <Board onPlaceEnd={handlePlaceEnd} />

        {/* Right opponent */}
        <div className="shrink-0 px-2 sm:px-4">
          <OpponentHand
            seat={seats.right}
            tileCount={hands[seats.right].length}
            playerName={getPlayerName(seats.right)}
            connected={getPlayerConnected(seats.right)}
            isCurrentTurn={currentTurn === seats.right}
            position="right"
          />
        </div>
      </div>

      {/* Player hand (bottom) */}
      <div className="shrink-0 pt-2 border-t border-slate-800/50">
        <Hand onPlayTile={handlePlayTile} onPass={handlePass} />
      </div>

      {/* Game over modal */}
      <GameOverModal
        onNextRound={handleNextRound}
        onBackToLobby={handleBackToLobby}
      />
    </div>
  );
}
