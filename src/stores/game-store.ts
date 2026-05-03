import { create } from "zustand";
import type {
  Tile,
  Seat,
  Team,
  BoardState,
  GameStatus,
  PlayedTile,
  RoundResult,
} from "@/lib/game/types";
import { getValidMoves } from "@/lib/game/engine";

export interface RoundHistoryEntry {
  round: number;
  winner_team: Team | null;
  points: number;
  reason: "domino" | "locked" | "tied";
  is_capicua?: boolean;
}

export interface MoveLogEntry {
  id: number;
  seat: Seat;
  playerName: string;
  type: "play" | "pass";
  tile?: Tile;
  end?: "left" | "right";
  round: number;
  // Board ends at the moment of a pass — used to infer which pips the passer lacks
  passedOnLeft?: number | null;
  passedOnRight?: number | null;
}

/** Serializable version of GameState for the store (no Map). */
interface SerializableHands {
  0: Tile[];
  1: Tile[];
  2: Tile[];
  3: Tile[];
}

interface Scores {
  0: number;
  1: number;
}

interface PlayerInfo {
  seat: Seat;
  displayName: string;
  connected: boolean;
  isBot?: boolean;
}

interface GameStore {
  // --- State ---
  board: BoardState;
  hands: SerializableHands;
  currentTurn: Seat;
  consecutivePasses: number;
  status: GameStatus;
  mySeat: Seat | null;
  scores: Scores;
  round: number;
  targetScore: number;
  players: PlayerInfo[];
  roundResult: RoundResult | null;
  roundHistory: RoundHistoryEntry[];
  moveLog: MoveLogEntry[];
  selectedTile: Tile | null;

  // --- Derived (computed via getters) ---
  isMyTurn: () => boolean;
  myHand: () => Tile[];
  validMoves: () => { tile: Tile; end: "left" | "right" }[];
  canPass: () => boolean;
  teamForSeat: (seat: Seat) => Team;
  partnerSeat: () => Seat | null;

  // --- Actions ---
  setGameState: (state: {
    board: BoardState;
    hands: SerializableHands;
    currentTurn: Seat;
    consecutivePasses: number;
    status: GameStatus;
  }) => void;
  setMySeat: (seat: Seat) => void;
  setScores: (scores: Scores) => void;
  setRound: (round: number) => void;
  setTargetScore: (target: number) => void;
  setPlayers: (players: PlayerInfo[]) => void;
  setRoundResult: (result: RoundResult | null) => void;
  addRoundHistory: (entry: RoundHistoryEntry) => void;
  addMoveLog: (entry: Omit<MoveLogEntry, "id">) => void;
  selectTile: (tile: Tile | null) => void;
  playTile: (tile: Tile, end: "left" | "right") => void;
  passTurn: () => void;
  updatePlayerConnection: (seat: Seat, connected: boolean) => void;
  reset: () => void;
}

const emptyBoard: BoardState = { left: null, right: null, plays: [] };
const emptyHands: SerializableHands = { 0: [], 1: [], 2: [], 3: [] };

export const useGameStore = create<GameStore>((set, get) => ({
  // --- Initial state ---
  board: emptyBoard,
  hands: emptyHands,
  currentTurn: 0 as Seat,
  consecutivePasses: 0,
  status: "dealing",
  mySeat: null,
  scores: { 0: 0, 1: 0 },
  round: 1,
  targetScore: 100,
  players: [],
  roundResult: null,
  roundHistory: [],
  moveLog: [],
  selectedTile: null,

  // --- Derived ---
  isMyTurn: () => {
    const { mySeat, currentTurn, status } = get();
    return mySeat !== null && currentTurn === mySeat && status === "playing";
  },

  myHand: () => {
    const { mySeat, hands } = get();
    if (mySeat === null) return [];
    return hands[mySeat];
  },

  validMoves: () => {
    const { mySeat, hands, board, status, round } = get();
    if (mySeat === null || status !== "playing") return [];
    const mustPlayDouble6 = round === 1 && board.plays.length === 0;
    return getValidMoves(hands[mySeat], board, mustPlayDouble6);
  },

  canPass: () => {
    const store = get();
    return store.isMyTurn() && store.validMoves().length === 0;
  },

  teamForSeat: (seat: Seat): Team => (seat % 2 === 0 ? 0 : 1),

  partnerSeat: () => {
    const { mySeat } = get();
    if (mySeat === null) return null;
    return ((mySeat + 2) % 4) as Seat;
  },

  // --- Actions ---
  setGameState: (state) =>
    set({
      board: state.board,
      hands: state.hands,
      currentTurn: state.currentTurn,
      consecutivePasses: state.consecutivePasses,
      status: state.status,
      selectedTile: null,
    }),

  setMySeat: (seat) => set({ mySeat: seat }),
  setScores: (scores) => set({ scores }),
  setRound: (round) => set({ round }),
  setTargetScore: (target) => set({ targetScore: target }),
  setPlayers: (players) => set({ players }),
  setRoundResult: (result) => set({ roundResult: result }),
  addRoundHistory: (entry) =>
    set((s) => ({ roundHistory: [...s.roundHistory, entry] })),
  addMoveLog: (entry) =>
    set((s) => ({
      moveLog: [...s.moveLog.slice(-49), { ...entry, id: Date.now() + Math.random() }],
    })),
  selectTile: (tile) => set({ selectedTile: tile }),

  playTile: (tile, end) => {
    // Optimistic local update — the server will confirm
    const { mySeat, hands, board } = get();
    if (mySeat === null) return;

    const hand = hands[mySeat];
    const idx = hand.findIndex(
      ([a, b]) =>
        (a === tile[0] && b === tile[1]) || (a === tile[1] && b === tile[0])
    );
    if (idx === -1) return;

    const newHand = [...hand.slice(0, idx), ...hand.slice(idx + 1)];

    let newLeft = board.left;
    let newRight = board.right;

    if (board.left === null || board.right === null) {
      newLeft = tile[0];
      newRight = tile[1];
    } else if (end === "left") {
      newLeft = tile[0] === board.left ? tile[1] : tile[0];
    } else {
      newRight = tile[1] === board.right ? tile[0] : tile[1];
    }

    const newPlay: PlayedTile = { tile, seat: mySeat, end };

    set({
      board: {
        left: newLeft,
        right: newRight,
        plays: [...board.plays, newPlay],
      },
      hands: { ...hands, [mySeat]: newHand },
      currentTurn: ((mySeat + 1) % 4) as Seat,
      consecutivePasses: 0,
      selectedTile: null,
      status: newHand.length === 0 ? "finished" : "playing",
    });
  },

  passTurn: () => {
    const { mySeat, consecutivePasses } = get();
    if (mySeat === null) return;
    const newPasses = consecutivePasses + 1;
    set({
      currentTurn: ((mySeat + 1) % 4) as Seat,
      consecutivePasses: newPasses,
      status: newPasses >= 4 ? "finished" : "playing",
      selectedTile: null,
    });
  },

  updatePlayerConnection: (seat, connected) => {
    const { players } = get();
    set({
      players: players.map((p) =>
        p.seat === seat ? { ...p, connected } : p
      ),
    });
  },

  reset: () =>
    set({
      board: emptyBoard,
      hands: emptyHands,
      currentTurn: 0 as Seat,
      consecutivePasses: 0,
      status: "dealing",
      roundResult: null,
      selectedTile: null,
    }),
}));
