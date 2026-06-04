"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePlayerStore } from "@/lib/store/player-store";
import { useRoomStore } from "@/lib/store/room-store";
import { useRoom } from "@/hooks/use-room";
import { useHand } from "@/hooks/use-hand";
import { useTurnTimer } from "@/hooks/use-turn-timer";
import { useResync } from "@/hooks/use-room";
import { JoinByName } from "@/components/lobby/join-by-name";
import { SeatGrid } from "@/components/waiting-room/seat-grid";
import { ShareLink } from "@/components/waiting-room/share-link";
import { Button } from "@/components/ui/button";
import { Hand } from "@/components/game/hand";
import { OpponentHand } from "@/components/game/opponent-hand";
import { Board } from "@/components/game/board";
import { ScorePanel } from "@/components/game/score-panel";
import { TurnIndicator } from "@/components/game/turn-indicator";
import { ChatPanel } from "@/components/game/chat-panel";
import { RoundEndModal } from "@/components/game/round-end-modal";
import { GameOverModal } from "@/components/game/game-over-modal";
import { usePresence } from "@/hooks/use-presence";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/components/ui/toast";
import { dealRound, recordRoundEnd } from "@/lib/game/actions";
import { playTile, pass } from "@/lib/game/play";
import { canPlayTile } from "@/lib/game/rules";
import { GAME, SEAT_TEAM } from "@/lib/game/constants";
import { scoreDomino, scoreTrancado } from "@/lib/game/scoring";

export default function GamePage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const roomId = params.code;
  const identity = usePlayerStore((s) => s.identity);
  const loadIdentity = usePlayerStore((s) => s.loadIdentity);
  const setIdentity = usePlayerStore((s) => s.setIdentity);
  const setRoom = useRoomStore((s) => s.setRoom);
  const status = useRoomStore((s) => s.status);
  const players = useRoomStore((s) => s.players);
  const gameState = useRoomStore((s) => s.gameState);
  const myHand = useRoomStore((s) => s.myHand);
  const team0Score = useRoomStore((s) => s.team0Score);
  const team1Score = useRoomStore((s) => s.team1Score);
  const currentRound = useRoomStore((s) => s.currentRound);
  const addRoundScore = useRoomStore((s) => s.addRoundScore);
  const setCurrentRound = useRoomStore((s) => s.setCurrentRound);
  const pushToast = useToastStore((s) => s.push);

  const [joinOpen, setJoinOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [selectedTile, setSelectedTile] = useState<number | null>(null);

  useEffect(() => {
    if (!roomId) return;
    loadIdentity(roomId);
    setRoom(roomId);
    setChecked(true);
  }, [roomId, loadIdentity, setRoom]);

  useRoom();
  useHand();
  useTurnTimer();
  const presence = usePresence();
  const resync = useResync();

  // Open the join modal if not yet in the room
  useEffect(() => {
    if (!checked || !roomId) return;
    (async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("rooms")
        .select("id")
        .eq("id", roomId)
        .single();
      if (!data) {
        pushToast("Esta sala no existe", "error");
        router.push("/");
        return;
      }
      if (identity && identity.roomId === roomId) {
        // Verify the player is still in the room
        const { data: p } = await supabase
          .from("players")
          .select("id")
          .eq("id", identity.id)
          .single();
        if (!p) {
          setJoinOpen(true);
        }
      } else {
        setJoinOpen(true);
      }
    })();
  }, [checked, identity, roomId, router, pushToast]);

  if (status === "playing") {
    const me = players.find((p) => p.id === identity?.id);
    const isMyTurn = me && gameState && gameState.activeSeat === me.seat;
    const hasPlayable = isMyTurn && gameState
      ? myHand.some((t) => canPlayTile(t, gameState.boardEnds.left, gameState.boardEnds.right))
      : false;
    const onPlayTile = async (tile: number, end: "left" | "right") => {
      if (!identity || !gameState) return;
      try {
        await playTile(
          roomId,
          identity.id,
          tile,
          end,
          gameState.boardEnds.left,
          gameState.boardEnds.right
        );
        setSelectedTile(null);
      } catch (e: any) {
        pushToast(e.message || "Jugada inválida", "error");
      }
    };
    const onPass = async () => {
      if (!identity) return;
      try {
        await pass(roomId, identity.id);
      } catch (e: any) {
        pushToast(e.message || "No se pudo pasar", "error");
      }
    };
    const showRoundEndModal =
      gameState?.phase === "round_end" && status === "playing";

    // Compute round-end scores from current hands (placeholder; full wire in later tasks)
    const roundEndInfo: { winnerTeam: 0 | 1 | null; points: number } = (() => {
      if (!showRoundEndModal) return { winnerTeam: null, points: 0 };
      const reason = gameState?.roundEndReason;
      const handsAll: number[][] = players.map((p) => {
        // Without RLS access to other players' hands, fall back to a per-player stub.
        // The full computation will run from server-authoritative data in a later task.
        if (p.id === identity?.id) return myHand;
        return Array(GAME.TILES_PER_PLAYER).fill(0);
      });
      if (reason === "trancado") {
        const t = scoreTrancado(handsAll) as { points: number; team: 0 | 1 | -1 };
        return { winnerTeam: t.team === -1 ? null : t.team, points: t.points };
      }
      // Dominó: best-effort winner is the activeSeat (when no last-author info is available)
      const lastPlay = gameState?.activeSeat ?? 0;
      const winnerTeam = (SEAT_TEAM[lastPlay] ?? 0) as 0 | 1;
      const d = scoreDomino(handsAll, lastPlay, winnerTeam);
      return { winnerTeam: d.team, points: d.points };
    })();

    const onContinue = async () => {
      // Check for game end first
      if (team0Score >= GAME.TARGET_SCORE || team1Score >= GAME.TARGET_SCORE) {
        // Game over modal will be shown; nothing else to do here
        return;
      }
      const nextRound = (currentRound || 1) + 1;
      try {
        await dealRound(roomId, nextRound);
        setCurrentRound(nextRound);
      } catch (e: any) {
        pushToast(e.message || "No se pudo iniciar la nueva ronda", "error");
      }
    };
    return (
      <div className="min-h-screen p-2 md:p-4 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
          <ScorePanel />
          <div className="flex items-center gap-2">
            <TurnIndicator />
            <Button variant="ghost" onClick={() => void resync()}>
              Re-sincronizar
            </Button>
          </div>
        </div>
        <div className="flex-1 flex flex-col md:flex-row gap-2">
          <div className="hidden md:block md:w-20">
            {(() => {
              const p = presence.find((pp) => pp.seat === 1);
              if (!p) return null;
              return (
                <OpponentHand
                  seat={1}
                  position="left"
                  playerId={p.id}
                  playerName={p.name}
                  connected={p.isConnected}
                  isActive={gameState?.activeSeat === 1}
                />
              );
            })()}
          </div>
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <div className="flex justify-center">
              {(() => {
                const p = presence.find((pp) => pp.seat === 2);
                if (!p) return null;
                return (
                  <OpponentHand
                    seat={2}
                    position="top"
                    playerId={p.id}
                    playerName={p.name}
                    connected={p.isConnected}
                    isActive={gameState?.activeSeat === 2}
                  />
                );
              })()}
            </div>
            <div className="md:flex-1">
              <Board />
            </div>
            <Hand
              onTileClick={(tile) => {
                if (!gameState) return;
                if (selectedTile === tile) {
                  // Try to play on whichever end matches
                  const { left, right } = gameState.boardEnds;
                  const canLeft = canPlayTile(tile, left, left);
                  const canRight = canPlayTile(tile, right, right);
                  if (canLeft && canRight) {
                    void onPlayTile(tile, "left");
                  } else if (canRight) {
                    void onPlayTile(tile, "right");
                  } else if (canLeft) {
                    void onPlayTile(tile, "left");
                  } else {
                    void onPlayTile(tile, "right");
                  }
                } else {
                  setSelectedTile(tile);
                }
              }}
              selectedTile={selectedTile}
            />
            {isMyTurn && !hasPlayable && (
              <div className="flex justify-center">
                <Button onClick={onPass}>Pasar</Button>
              </div>
            )}
          </div>
          <div className="hidden md:block md:w-20">
            {(() => {
              const p = presence.find((pp) => pp.seat === 3);
              if (!p) return null;
              return (
                <OpponentHand
                  seat={3}
                  position="right"
                  playerId={p.id}
                  playerName={p.name}
                  connected={p.isConnected}
                  isActive={gameState?.activeSeat === 3}
                />
              );
            })()}
          </div>
        </div>
        <div className="md:hidden">
          <ChatPanel />
        </div>
        <div className="hidden md:block">
          <ChatPanel />
        </div>
        <RoundEndModal
          open={showRoundEndModal}
          reason={gameState?.roundEndReason ?? null}
          winnerTeam={roundEndInfo.winnerTeam}
          points={roundEndInfo.points}
          onContinue={onContinue}
        />
        <GameOverModal
          open={false}
          winnerTeam={0}
          finalScores={{ team0: 0, team1: 0 }}
          onNewGame={() => {}}
          onExit={() => router.push("/")}
        />
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8 flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold text-gold">Sala {roomId}</h1>
      <ShareLink roomId={roomId} />
      <SeatGrid />
      {players.length === 4 && identity && players[0]?.id === identity.id && (
        <Button
          onClick={async () => {
            try {
              await dealRound(roomId);
            } catch (e: any) {
              pushToast(e.message || "No se pudo repartir", "error");
            }
          }}
        >
          Repartir
        </Button>
      )}
      <JoinByName
        roomId={roomId}
        open={joinOpen}
        onJoined={() => {
          setJoinOpen(false);
        }}
      />
    </main>
  );
}
