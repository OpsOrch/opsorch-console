"use client";

import { useEffect, useState } from "react";
import { ChatConversation } from "@/app/lib/types";
import { useAsyncState } from "@/app/lib/hooks";

type ChatHistoryProps = {
    onSelect: (chatId: string) => void;
    activeChatId?: string;
};

export function ChatHistory({ onSelect, activeChatId }: ChatHistoryProps) {
    const [chats, setChats] = useState<ChatConversation[]>([]);
    const state = useAsyncState();

    useEffect(() => {
        const fetchChats = async () => {
            state.start();
            try {
                const res = await fetch("/api/copilot/chats");
                if (!res.ok) {
                    throw new Error(res.statusText);
                }
                const data = await res.json();
                setChats(data.conversations || []);
                state.succeed();
            } catch (err) {
                state.fail(err);
            }
        };

        fetchChats();
    }, []);

    if (state.loading) {
        return (
            <div className="flex flex-col gap-2 p-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
                ))}
            </div>
        );
    }

    if (state.error) {
        return (
            <div className="p-4 text-center text-sm text-rose-500">
                Failed to load history: {state.error}
            </div>
        );
    }

    if (chats.length === 0) {
        return (
            <div className="p-8 text-center text-sm text-slate-500">
                No recent conversations found.
            </div>
        );
    }

    return (
        <div className="grid gap-2 p-2">
            {chats.map((chat) => {
                const isActive = chat.chatId === activeChatId;
                const date = new Date(chat.lastAccessedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                });

                return (
                    <button
                        key={chat.chatId}
                        type="button"
                        onClick={() => onSelect(chat.chatId)}
                        className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all hover:shadow-md ${isActive
                            ? "border-[#55cfd0] bg-[#f4fcfc]"
                            : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                    >
                        <div className="flex w-full items-center justify-between gap-2">
                            <span className="truncate text-xs font-medium text-slate-500">
                                {chat.name || chat.chatId}
                            </span>
                            <span className="text-[10px] text-slate-400">{date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-700">
                                {chat.turnCount} {chat.turnCount === 1 ? "turn" : "turns"}
                            </span>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
