"use client";

import { useEffect, useState } from "react";
import { ChatConversation, ChatSearchResult } from "@/app/lib/types";
import { useAsyncState } from "@/app/lib/hooks";

type ChatHistoryProps = {
    onSelect: (chatId: string) => void;
    activeChatId?: string;
    searchQuery?: string;
};

export function ChatHistory({ onSelect, activeChatId, searchQuery }: ChatHistoryProps) {
    const [chats, setChats] = useState<(ChatConversation | ChatSearchResult)[]>([]);
    const [resultCount, setResultCount] = useState<number>(0);
    const state = useAsyncState();
    const isSearchMode = !!searchQuery && searchQuery.trim().length > 0;

    useEffect(() => {
        const fetchChats = async () => {
            state.start();
            try {
                let res;
                if (isSearchMode) {
                    // Build search query params
                    const params = new URLSearchParams();
                    params.set('query', searchQuery.trim());
                    res = await fetch(`/api/copilot/chats/search?${params.toString()}`);
                } else {
                    res = await fetch("/api/copilot/chats");
                }

                if (!res.ok) {
                    throw new Error(res.statusText);
                }
                const data = await res.json();

                if (isSearchMode) {
                    setChats(data.results || []);
                    setResultCount(data.totalResults || 0);
                } else {
                    setChats(data.conversations || []);
                    setResultCount(data.conversations?.length || 0);
                }
                state.succeed();
            } catch (err) {
                state.fail(err);
            }
        };

        fetchChats();
    }, [searchQuery]);

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
                Failed to load {isSearchMode ? 'search results' : 'history'}: {state.error}
            </div>
        );
    }

    if (chats.length === 0) {
        return (
            <div className="p-8 text-center text-sm text-slate-500">
                {isSearchMode
                    ? `No conversations found matching "${searchQuery}"`
                    : "No recent conversations found."}
            </div>
        );
    }

    return (
        <>
            {isSearchMode && (
                <div className="px-4 py-2 text-sm text-slate-600">
                    Found <span className="font-medium">{resultCount}</span> result{resultCount !== 1 ? 's' : ''}
                </div>
            )}
            <div className="grid gap-2 p-2">
                {chats.map((chat) => {
                    const isActive = chat.chatId === activeChatId;
                    const date = new Date(chat.lastAccessedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                    });

                    const searchResult = isSearchMode ? chat as ChatSearchResult : null;

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
                            {searchResult?.matchedEntities && searchResult.matchedEntities.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                    {searchResult.matchedEntities.map((entity, idx) => (
                                        <span
                                            key={idx}
                                            className="rounded bg-[#55cfd0]/10 px-1.5 py-0.5 text-[10px] text-[#55cfd0]"
                                        >
                                            {entity.type}: {entity.value}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </>
    );
}
