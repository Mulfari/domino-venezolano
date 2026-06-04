"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToastStore } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";
import { createNewPlayerId, usePlayerStore } from "@/lib/store/player-store";
import { useRoomStore } from "@/lib/store/room-store";
import { useRouter } from "next/navigation";

interface Props {
  roomId: string;
  open: boolean;
  onJoined: () => void;
}

export function JoinByName({ roomId, open, onJoined }: Props) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const pushToast = useToastStore((s) => s.push);
  const setIdentity = usePlayerStore((s) => s.setIdentity);
  const setRoom = useRoomStore((s) => s.setRoom);
  const router = useRouter();

  const join = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    try {
      const supabase = createClient();
      const { data: existing } = await supabase
        .from("players")
        .select("seat")
        .eq("room_id", roomId)
        .order("seat", { ascending: false })
        .limit(1);

      if (existing && existing.length > 0 && existing[0].seat >= 3) {
        pushToast("Esta sala ya está llena", "error");
        setBusy(false);
        return;
      }

      const nextSeat = existing && existing.length > 0 ? existing[0].seat + 1 : 0;
      const team = nextSeat % 2 === 0 ? 0 : 1;
      const playerId = createNewPlayerId();

      const { error } = await supabase.from("players").insert({
        id: playerId,
        room_id: roomId,
        seat: nextSeat,
        name: name.trim(),
        team,
      });

      if (error) throw error;

      setIdentity(playerId, roomId);
      setRoom(roomId);
      onJoined();
    } catch (err: any) {
      pushToast(err.message || "No se pudo unir", "error");
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={() => {}}>
      <h2 className="text-2xl font-bold text-gold mb-4">Únete a la partida</h2>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tu nombre"
        className="w-full px-4 py-2 rounded-lg bg-ivory text-wood mb-4"
        maxLength={20}
        autoFocus
      />
      <div className="flex gap-2 justify-end">
        <Button variant="primary" onClick={join} disabled={!name.trim() || busy}>
          {busy ? "Uniendo..." : "Unirme"}
        </Button>
      </div>
    </Modal>
  );
}
