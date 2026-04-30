"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useChat } from "@/hooks/use-chat";
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
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevCountRef = useRef(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { messages, sendMessage, loading } = useChat({
    roomCode,
    roomId,
    gameId,
    userId,
    displayName,
  });

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, open]);

  useEffect(() => {
    if (!open && messages.length > prevCountRef.current) {
      const newCount = messages.length - prevCountRef.current;
      setUnread((u) => u + newCount);

      const last = messages[messages.length - 1];
      if (last && last.player_id !== userId) {
        const preview = `${last.display_name}: ${last.message}`;
        setToastMsg(preview.length > 42 ? preview.slice(0, 42) + "…" : preview);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToastMsg(null), 3500);
      }
    }
    prevCountRef.current = messages.length;
  }, [messages.length, open, messages, userId]);

  function handleOpen() {
    setOpen(true);
    setUnread(0);
    setToastMsg(null);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setTimeout(() => inputRef.current?.focus(), 150);
  }

  function handleClose() {
    setOpen(false);
  }

  function handleSend() {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Escape") {
      handleClose();
    }
  }

  const hasUnread = !open && unread > 0;

  return (
    <>
      {/* Toast preview — appears above the button */}
      <AnimatePresence>
        {toastMsg && !open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-20 right-4 z-40 max-w-[220px] rounded-xl px-3 py-2 text-xs text-[#e8dcc8] pointer-events-none"
            style={{
              background: "rgba(8, 22, 14, 0.82)",
              backdropFilter: "blur(20px) saturate(1.8)",
              WebkitBackdropFilter: "blur(20px) saturate(1.8)",
              border: "1px solid rgba(201,168,76,0.30)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.55)",
            }}
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating toggle button */}
      <motion.button
        onClick={open ? handleClose : handleOpen}
        animate={
          hasUnread
            ? { scale: [1, 1.1, 1], boxShadow: ["0 0 0px rgba(201,168,76,0)", "0 0 18px rgba(201,168,76,0.5)", "0 0 0px rgba(201,168,76,0)"] }
            : {}
        }
        transition={
          hasUnread
            ? { repeat: Infinity, duration: 2.4, ease: "easeInOut" }
            : { duration: 0.15 }
        }
        className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-colors border"
        style={{
          background: open
            ? "rgba(201,168,76,0.18)"
            : hasUnread
            ? "rgba(201,168,76,0.16)"
            : "rgba(10, 30, 18, 0.88)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderColor: open || hasUnread ? "rgba(201,168,76,0.70)" : "rgba(201,168,76,0.25)",
          color: "#c9a84c",
          boxShadow: hasUnread
            ? "0 0 20px rgba(201,168,76,0.40), 0 4px 20px rgba(0,0,0,0.55)"
            : open
            ? "0 0 14px rgba(201,168,76,0.22), 0 4px 16px rgba(0,0,0,0.45)"
            : "0 4px 16px rgba(0,0,0,0.50)",
        }}
        aria-label={open ? "Cerrar chat" : "Abrir chat"}
        aria-expanded={open}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.svg
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </motion.svg>
          ) : (
            <motion.svg
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-4 0H9v2h2V9z"
                clipRule="evenodd"
              />
            </motion.svg>
          )}
        </AnimatePresence>

        {/* Unread badge */}
        <AnimatePresence>
          {hasUnread && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 25 }}
              className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center"
              aria-label={`${unread} mensajes sin leer`}
            >
              <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-40" />
              <span className="relative leading-none">{unread > 9 ? "9+" : unread}</span>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Floating chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed bottom-20 right-4 z-40 w-64 sm:w-72 max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl overflow-hidden"
            style={{
              maxHeight: "min(360px, calc(100dvh - 200px))",
              /* High transparency — board stays visible through the panel */
              background: "rgba(4, 14, 9, 0.42)",
              backdropFilter: "blur(48px) saturate(2.2) brightness(1.1)",
              WebkitBackdropFilter: "blur(48px) saturate(2.2) brightness(1.1)",
              border: "1px solid rgba(201,168,76,0.20)",
              boxShadow:
                "0 8px 48px rgba(0,0,0,0.50), inset 0 1px 0 rgba(201,168,76,0.10), inset 0 -1px 0 rgba(0,0,0,0.15)",
            }}
            role="dialog"
            aria-label="Chat de la partida"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-3 py-2 shrink-0"
              style={{
                borderBottom: "1px solid rgba(201,168,76,0.10)",
                background: "rgba(201,168,76,0.04)",
              }}
            >
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3.5 h-3.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                  style={{ color: "rgba(201,168,76,0.65)" }}
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zm-4 0H9v2h2V9z"
                    clipRule="evenodd"
                  />
                </svg>
                <h2 className="text-xs font-semibold text-[#f5f0e8]/80 tracking-wide">
                  Chat
                </h2>
                {messages.length > 0 && (
                  <span className="text-[10px] text-[#a8c4a0]/30">
                    {messages.length}
                  </span>
                )}
              </div>
              <button
                onClick={handleClose}
                className="text-[#a8c4a0]/30 hover:text-[#f5f0e8]/70 transition-colors p-0.5 rounded"
                aria-label="Cerrar chat"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-3.5 h-3.5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-3 py-2.5 space-y-2.5 min-h-0"
              style={{ scrollbarWidth: "none" }}
            >
              {loading && (
                <p className="text-xs text-[#a8c4a0]/40 text-center animate-pulse">
                  Cargando mensajes...
                </p>
              )}
              {!loading && messages.length === 0 && (
                <p className="text-xs text-[#a8c4a0]/28 text-center mt-4">
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
            <div
              className="shrink-0 px-2.5 pt-1.5 pb-1 flex flex-wrap gap-1"
              style={{ borderTop: "1px solid rgba(201,168,76,0.07)" }}
            >
              {["¡Dominó!", "¡Tranca!", "Buena", "😂", "👏", "😤"].map((r) => (
                <button
                  key={r}
                  onClick={() => sendMessage(r)}
                  className="rounded-full px-2 py-0.5 text-[11px] text-[#e8dcc8]/65 hover:text-[#f5f0e8] transition-all"
                  style={{
                    background: "rgba(30,92,58,0.18)",
                    border: "1px solid rgba(201,168,76,0.08)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(30,92,58,0.42)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,168,76,0.20)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(30,92,58,0.18)";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,168,76,0.08)";
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="shrink-0 px-2.5 py-2">
              <div className="flex gap-1.5">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe un mensaje..."
                  maxLength={280}
                  aria-label="Mensaje de chat"
                  className="flex-1 min-w-0 text-xs text-[#f5f0e8] placeholder-[#a8c4a0]/28 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-[#c9a84c]/25 transition-all"
                  style={{ background: "rgba(30,92,58,0.22)" }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="shrink-0 px-2.5 py-1.5 bg-[#c9a84c] hover:bg-[#dfc06a] disabled:opacity-20 disabled:hover:bg-[#c9a84c] text-[#2a1a0a] rounded-lg transition-colors"
                  aria-label="Enviar mensaje"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-3.5 h-3.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
