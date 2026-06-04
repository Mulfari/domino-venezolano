"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePlayerStore } from "@/lib/store/player-store";
import { useRoomStore } from "@/lib/store/room-store";
import { useRoom } from "@/hooks/use-room";
import { useHand } from "@/hooks/use-hand";
import { JoinByName } from "@/components/lobby/join-by-name";
import { SeatGrid } from "@/components/waiting-room/seat-grid";
import { ShareLink } from "@/components/waiting-room/share-link";
import { Button } from "@/components/ui/button";
import { Hand } from "@/components/game/hand";
import { RoundEndModal } from "@/components/game/round-end-modal";
import { GameOverModal } from "@/components/game/game-over-modal";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/components/ui/toast";
import { dealRound } from "@/lib/game/actions";
import { playTile, pass } from "@/lib/game/play";
import { canPlayTile } from "@/lib/game/rules";

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
    return (
      <div className="min-h-screen p-4 flex flex-col gap-3">
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
        <RoundEndModal
          open={showRoundEndModal}
          reason={gameState?.roundEndReason ?? null}
          winnerTeam={null}
          points={0}
          onContinue={() => {
            /* wired up in Task 30a */
          }}
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
