"use client";
import { create } from "zustand";
import type { GameState, MoveRow } from "@/lib/game/state";
import { createClient } from "@/lib/supabase/client";

export interface Player {
  id: string;
  room_id: string;
  seat: number;
  name: string;
  team: number;
  joined_at: string;
  last_seen: string;
  connected: boolean;
}

interface RoomStore {
  roomId: string | null;
  status: "waiting" | "playing" | "finished";
  players: Player[];
  moves: MoveRow[];
  myHand: number[];
  myHandRound: number;
  gameState: GameState | null;
  team0Score: number;
  team1Score: number;
  currentRound: number;
  setRoom: (roomId: string) => void;
  setStatus: (status: "waiting" | "playing" | "finished") => void;
  setPlayers: (players: Player[]) => void;
  setMoves: (moves: MoveRow[]) => void;
  appendMove: (move: MoveRow) => void;
  setMyHand: (tiles: number[], round: number) => void;
  setGameState: (gs: GameState) => void;
  addTeamScore: (team: 0 | 1, points: number) => void;
  addRoundScore: (team: 0 | 1, points: number) => void;
  setCurrentRound: (round: number) => void;
  resync: () => Promise<void>;
  reset: () => void;
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  roomId: null,
  status: "waiting",
  players: [],
  moves: [],
  myHand: [],
  myHandRound: 0,
  gameState: null,
  team0Score: 0,
  team1Score: 0,
  currentRound: 1,
  setRoom: (roomId) => set({ roomId }),
  setStatus: (status) => set({ status }),
  setPlayers: (players) => set({ players }),
  setMoves: (moves) => set({ moves }),
  appendMove: (move) =>
    set((s) => ({ moves: [...s.moves, move].sort((a, b) => a.seq - b.seq) })),
  setMyHand: (tiles, round) => set({ myHand: tiles, myHandRound: round }),
  setGameState: (gs) => set({ gameState: gs }),
  addTeamScore: (team, points) =>
    set((s) => ({
      team0Score: team === 0 ? s.team0Score + points : s.team0Score,
      team1Score: team === 1 ? s.team1Score + points : s.team1Score,
    })),
  addRoundScore: (team, points) =>
    set((s) => ({
      team0Score: team === 0 ? s.team0Score + points : s.team0Score,
      team1Score: team === 1 ? s.team1Score + points : s.team1Score,
    })),
  setCurrentRound: (round) => set({ currentRound: round }),
  resync: async () => {
    const { roomId } = get();
    if (!roomId) return;
    const supabase = createClient();
    const [{ data: ms }, { data: ps }, { data: room }] = await Promise.all([
      supabase.from("moves").select("*").eq("room_id", roomId).order("seq"),
      supabase.from("players").select("*").eq("room_id", roomId).order("seat"),
      supabase.from("rooms").select("status").eq("id", roomId).single(),
    ]);
    if (ms) set({ moves: ms as MoveRow[] });
    if (ps) set({ players: ps as Player[] });
    if (room) set({ status: room.status as "waiting" | "playing" | "finished" });
  },
  reset: () =>
    set({
      roomId: null,
      status: "waiting",
      players: [],
      moves: [],
      myHand: [],
      myHandRound: 0,
      gameState: null,
      team0Score: 0,
      team1Score: 0,
      currentRound: 1,
    }),
}));
