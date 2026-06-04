"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePlayerStore } from "@/lib/store/player-store";
import { useRoomStore } from "@/lib/store/room-store";
import { useRoom } from "@/hooks/use-room";
import { JoinByName } from "@/components/lobby/join-by-name";
import { SeatGrid } from "@/components/waiting-room/seat-grid";
import { ShareLink } from "@/components/waiting-room/share-link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useToastStore } from "@/components/ui/toast";
import { dealRound } from "@/lib/game/actions";

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
  const pushToast = useToastStore((s) => s.push);

  const [joinOpen, setJoinOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!roomId) return;
    loadIdentity(roomId);
    setRoom(roomId);
    setChecked(true);
  }, [roomId, loadIdentity, setRoom]);

  useRoom();

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
    return <div className="p-4">Juego en progreso (UI en construcción)</div>;
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
