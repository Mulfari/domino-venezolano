"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
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
  gameId: string | null;
  userId: string;
  displayName: string;
}

export function useChat({ roomCode, gameId, userId, displayName }: UseChatOptions) {
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
      setMessages((prev) => [...prev, msg]);
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomCode, userId]);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || !gameId) return;

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
      await supabase.from("chat_messages").insert({
        id,
        game_id: gameId,
        player_id: userId,
        display_name: displayName,
        message: message.trim(),
      });
    },
    [gameId, userId, displayName]
  );

  return { messages, sendMessage, loading };
}
