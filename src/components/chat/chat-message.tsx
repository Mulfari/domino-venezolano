"use client";

interface ChatMessageProps {
  displayName: string;
  message: string;
  createdAt: string;
  isOwn: boolean;
}

export function ChatMessage({
  displayName,
  message,
  createdAt,
  isOwn,
}: ChatMessageProps) {
  const time = new Date(createdAt).toLocaleTimeString("es-VE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className={`flex gap-2 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
          isOwn
            ? "bg-[#c9a84c] text-[#2a1a0a]"
            : "bg-[#1e5c3a] text-[#a8c4a0]"
        }`}
      >
        {initial}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] min-w-0 ${isOwn ? "text-right" : "text-left"}`}>
        {!isOwn && (
          <p className="text-[10px] text-[#a8c4a0]/60 mb-0.5 truncate">
            {displayName}
          </p>
        )}
        <div
          className={`inline-block px-2.5 py-1.5 rounded-lg text-sm leading-snug break-words ${
            isOwn
              ? "bg-[#1e5c3a]/60 text-[#f5f0e8] rounded-br-sm"
              : "bg-[#3a2210]/60 text-[#e8dcc8] rounded-bl-sm"
          }`}
        >
          {message}
        </div>
        <p className="text-[10px] text-[#a8c4a0]/40 mt-0.5">{time}</p>
      </div>
    </div>
  );
}
