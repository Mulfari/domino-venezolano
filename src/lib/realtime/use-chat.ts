"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { playChatReceived } from "@/lib/sounds/sound-engine";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface ChatMessage {
  id: string;
  player_id: string;
  display_name: string;
  message: string;
  created_at: string;
}

interface UseChatOptions {
  roomCode: string;
  roomId: string | null;
  gameId: string | null;
  userId: string;
  displayName: string;
}

export function useChat({ roomCode, roomId, gameId, userId, displayName }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Load message history from DB on mount
  useEffect(() => {
    if (!gameId) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    async function loadHistory() {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("game_id", gameId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (!error && data) {
        setMessages(data as ChatMessage[]);
      }
      setLoading(false);
    }

    loadHistory();
  }, [gameId]);

  // Subscribe to broadcast chat events
  useEffect(() => {
    const supabase = createClient();
    const channelName = `chat:${roomCode}`;

    const channel = supabase.channel(channelName);

    channel.on("broadcast", { event: "chat_message" }, ({ payload }) => {
      const msg = payload as ChatMessage;
      // Ignore our own messages (we already added them locally in sendMessage)
      if (msg.player_id === userId) return;
      playChatReceived();
      setMessages((prev) => [...prev, msg]);
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomCode, userId]);

  const lastSentRef = useRef(0);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || !gameId) return;

      const ts = Date.now();
      if (ts - lastSentRef.current < 1000) return;
      lastSentRef.current = ts;

      const supabase = createClient();
      const now = new Date().toISOString();
      const id = crypto.randomUUID();

      const chatMsg: ChatMessage = {
        id,
        player_id: userId,
        display_name: displayName,
        message: message.trim(),
        created_at: now,
      };

      // Broadcast to other players immediately
      channelRef.current?.send({
        type: "broadcast",
        event: "chat_message",
        payload: chatMsg,
      });

      // Add to local state
      setMessages((prev) => [...prev, chatMsg]);

      // Persist to DB (fire and forget)
      if (roomId) {
        await supabase.from("chat_messages").insert({
          id,
          room_id: roomId,
          game_id: gameId,
          player_id: userId,
          message: message.trim(),
        });
      }
    },
    [gameId, roomId, userId, displayName]
  );

  return { messages, sendMessage, loading };
}
