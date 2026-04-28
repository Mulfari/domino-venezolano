"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@/lib/realtime/use-chat";
import { ChatMessage } from "./chat-message";

interface ChatPanelProps {
  roomCode: string;
  roomId: string | null;
  gameId: string | null;
  userId: string;
  displayName: string;
}

export function ChatPanel({
  roomCode,
  roomId,
  gameId,
  userId,
  displayName,
}: ChatPanelProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [unread, setUnread] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  const { messages, sendMessage, loading } = useChat({
    roomCode,
    roomId,
    gameId,
    userId,
    displayName,
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Track unread messages when panel is closed
  useEffect(() => {
    if (!open && messages.length > prevCountRef.current) {
      setUnread((u) => u + (messages.length - prevCountRef.current));
    }
    prevCountRef.current = messages.length;
  }, [messages.length, open]);

  function handleOpen() {
    setOpen(true);
    setUnread(0);
  }

  function handleSend() {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={open ? () => setOpen(false) : handleOpen}
        className="fixed bottom-4 right-4 z-50 w-11 h-11 rounded-full bg-[#3a2210] hover:bg-[#4a2c0f] text-[#c9a84c] flex items-center justify-center shadow-lg transition-colors border border-[#c9a84c]/30"
        aria-label={open ? "Cerrar chat" : "Abrir chat"}
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-4 0H9v2h2V9z" clipRule="evenodd" />
          </svg>
        )}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Slide-out panel */}
      <div
        className={`fixed top-0 right-0 z-40 h-full w-72 sm:w-80 max-w-[90vw] bg-[#163d28] border-l border-[#c9a84c]/20 shadow-2xl flex flex-col transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#c9a84c]/20 shrink-0">
          <h2 className="text-sm font-semibold text-[#f5f0e8]">Chat</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-[#a8c4a0]/60 hover:text-[#f5f0e8] transition-colors"
            aria-label="Cerrar chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
          {loading && (
            <p className="text-xs text-[#a8c4a0]/60 text-center animate-pulse">
              Cargando mensajes...
            </p>
          )}
          {!loading && messages.length === 0 && (
            <p className="text-xs text-[#a8c4a0]/40 text-center mt-8">
              No hay mensajes aún. ¡Saluda!
            </p>
          )}
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              displayName={msg.display_name}
              message={msg.message}
              createdAt={msg.created_at}
              isOwn={msg.player_id === userId}
            />
          ))}
        </div>

        {/* Quick reactions */}
        <div className="shrink-0 px-3 pt-2 flex flex-wrap gap-1.5">
          {["¡Dominó!", "¡Tranca!", "Buena jugada", "😂", "👏", "😤"].map((r) => (
            <button
              key={r}
              onClick={() => sendMessage(r)}
              className="rounded-full bg-[#1e5c3a]/40 hover:bg-[#1e5c3a]/60 border border-[#c9a84c]/15 px-2.5 py-1 text-xs text-[#e8dcc8] transition-colors"
            >
              {r}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="shrink-0 px-3 py-3 border-t border-[#c9a84c]/20">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje..."
              maxLength={280}
              className="flex-1 min-w-0 bg-[#1e5c3a]/30 text-sm text-[#f5f0e8] placeholder-[#a8c4a0]/40 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-[#c9a84c]/50"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="shrink-0 px-3 py-2 bg-[#c9a84c] hover:bg-[#dfc06a] disabled:opacity-40 disabled:hover:bg-[#c9a84c] text-[#2a1a0a] text-sm rounded-lg transition-colors"
              aria-label="Enviar mensaje"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
