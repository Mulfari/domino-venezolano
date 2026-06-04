"use client";
import { create } from "zustand";

interface PlayerIdentity {
  id: string;
  roomId: string;
}

const STORAGE_PREFIX = "domino:player:";

function storageKey(roomId: string) {
  return `${STORAGE_PREFIX}${roomId}`;
}

function generateUuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export const usePlayerStore = create<{
  identity: PlayerIdentity | null;
  setIdentity: (id: string, roomId: string) => void;
  loadIdentity: (roomId: string) => void;
  clearIdentity: () => void;
}>((set) => ({
  identity: null,
  setIdentity: (id, roomId) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey(roomId), id);
    }
    set({ identity: { id, roomId } });
  },
  loadIdentity: (roomId) => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(storageKey(roomId));
    if (stored) {
      set({ identity: { id: stored, roomId } });
    }
  },
  clearIdentity: () => {
    if (typeof window !== "undefined" && usePlayerStore.getState().identity) {
      const { roomId } = usePlayerStore.getState().identity!;
      localStorage.removeItem(storageKey(roomId));
    }
    set({ identity: null });
  },
}));

export function createNewPlayerId(): string {
  return generateUuid();
}
