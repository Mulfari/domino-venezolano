"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createRoom() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const displayName =
    user.user_metadata?.display_name || user.email?.split("@")[0] || "Jugador";

  // Generate a unique code (retry if collision)
  let code = generateRoomCode();
  let attempts = 0;
  while (attempts < 5) {
    const { data: existing } = await getSupabaseAdmin()
      .from("rooms")
      .select("id")
      .eq("code", code)
      .eq("status", "waiting")
      .single();

    if (!existing) break;
    code = generateRoomCode();
    attempts++;
  }

  const seatsData = [
    { user_id: user.id, display_name: displayName },
    null,
    null,
    null,
  ];

  const { data: room, error } = await getSupabaseAdmin()
    .from("rooms")
    .insert({
      code,
      host_id: user.id,
      status: "waiting",
      seats: seatsData,
    })
    .select("id, code")
    .single();

  if (error) throw new Error("No se pudo crear la sala: " + error.message);

  // Also insert into room_players for RLS compatibility
  await getSupabaseAdmin().from("room_players").upsert({
    room_id: room.id,
    player_id: user.id,
    seat: 0,
  }, { onConflict: "room_id,player_id" });

  redirect(`/sala/${room.code}`);
}

export async function joinRoom(code: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const displayName =
    user.user_metadata?.display_name || user.email?.split("@")[0] || "Jugador";

  const upperCode = code.toUpperCase().trim();

  const { data: room, error: findError } = await getSupabaseAdmin()
    .from("rooms")
    .select("*")
    .eq("code", upperCode)
    .eq("status", "waiting")
    .single();

  if (findError || !room) {
    return { error: "Sala no encontrada o ya comenzó la partida." };
  }

  // Check if user is already in the room
  const seats = (room.seats ?? [null, null, null, null]) as (
    | { user_id: string; display_name: string }
    | null
  )[];
  const alreadyIn = seats.some((s) => s?.user_id === user.id);
  if (alreadyIn) {
    redirect(`/sala/${upperCode}`);
  }

  // Find next available seat
  const seatIndex = seats.findIndex((s) => s === null);
  if (seatIndex === -1) {
    return { error: "La sala está llena." };
  }

  const newSeats = [...seats];
  newSeats[seatIndex] = { user_id: user.id, display_name: displayName };

  const { error: updateError } = await getSupabaseAdmin()
    .from("rooms")
    .update({ seats: newSeats })
    .eq("id", room.id);

  if (updateError) {
    return { error: "No se pudo unir a la sala." };
  }

  // Also insert into room_players for RLS compatibility
  await getSupabaseAdmin().from("room_players").insert({
    room_id: room.id,
    player_id: user.id,
    seat: seatIndex,
  });

  redirect(`/sala/${upperCode}`);
}

export async function startGame(roomId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: room } = await getSupabaseAdmin()
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (!room) return { error: "Sala no encontrada." };
  if (room.host_id !== user.id) return { error: "Solo el host puede iniciar." };

  const seats = (room.seats ?? [null, null, null, null]) as (
    | { user_id: string; display_name: string }
    | null
  )[];
  const filledSeats = seats.filter((s) => s !== null);
  if (filledSeats.length < 4) {
    return { error: "Se necesitan 4 jugadores para iniciar." };
  }

  // Generate and shuffle all 28 domino tiles
  const tiles: [number, number][] = [];
  for (let i = 0; i <= 6; i++) {
    for (let j = i; j <= 6; j++) {
      tiles.push([i, j]);
    }
  }
  // Fisher-Yates shuffle
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }

  // Deal 7 tiles to each player
  const hands: [number, number][][] = [
    tiles.slice(0, 7),
    tiles.slice(7, 14),
    tiles.slice(14, 21),
    tiles.slice(21, 28),
  ];

  // Find who has the highest double to start
  let startingSeat = 0;
  let highestDouble = -1;
  for (let s = 0; s < 4; s++) {
    for (const tile of hands[s]) {
      if (tile[0] === tile[1] && tile[0] > highestDouble) {
        highestDouble = tile[0];
        startingSeat = s;
      }
    }
  }

  // Get previous match scores if continuing
  let previousScores = [0, 0];
  if (room.current_game_id) {
    const { data: prevGame } = await getSupabaseAdmin()
      .from("games")
      .select("scores")
      .eq("id", room.current_game_id)
      .single();

    if (prevGame?.scores) {
      previousScores = prevGame.scores as number[];
    }
  }

  // Determine round number
  let roundNumber = 1;
  if (room.current_game_id) {
    const { data: prevGame } = await getSupabaseAdmin()
      .from("games")
      .select("round_number")
      .eq("id", room.current_game_id)
      .single();

    if (prevGame?.round_number) {
      roundNumber = (prevGame.round_number as number) + 1;
    }
  }

  const boardState = { left: null, right: null, plays: [] };

  const { data: game, error: gameError } = await getSupabaseAdmin()
    .from("games")
    .insert({
      room_id: room.id,
      round_number: roundNumber,
      hands: hands,
      board: boardState,
      board_left: null,
      board_right: null,
      tiles_played: [],
      current_turn: startingSeat,
      consecutive_passes: 0,
      status: "playing",
      scores: previousScores,
    })
    .select("id")
    .single();

  if (gameError) return { error: "No se pudo crear la partida: " + gameError.message };

  // Write hands to game_hands table for RLS-based access
  const handInserts = seats.map((seat, i) => ({
    game_id: game.id,
    player_id: seat!.user_id,
    seat: i,
    tiles: hands[i],
  }));

  await getSupabaseAdmin().from("game_hands").insert(handInserts);

  // Update room status and current game
  await getSupabaseAdmin()
    .from("rooms")
    .update({
      status: "playing",
      current_game_id: game.id,
      started_at: new Date().toISOString(),
    })
    .eq("id", room.id);

  // Broadcast round_started to all players in the room
  const channel = getSupabaseAdmin().channel(`room:${room.code}`);
  await channel.send({
    type: "broadcast",
    event: "game_event",
    payload: {
      type: "round_started",
      game_id: game.id,
      current_turn: startingSeat,
    },
  });
  await getSupabaseAdmin().removeChannel(channel);

  return { gameId: game.id };
}
