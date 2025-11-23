"use client";

import { useEffect, useState } from "react";
import { ChatConversation, ChatSearchResult } from "@/app/lib/types";
import { useAsyncState } from "@/app/lib/hooks";
import { Pagination } from "@/app/components/Pagination";

type ChatHistoryProps = {
    onSelect: (chatId: string) => void;
    activeChatId?: string;
    searchQuery?: string;
};

const PAGE_SIZE = 10;

export function ChatHistory({ onSelect, activeChatId, searchQuery }: ChatHistoryProps) {
    const [chats, setChats] = useState<(ChatConversation | ChatSearchResult)[]>([]);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [currentPage, setCurrentPage] = useState<number>(0);
    const state = useAsyncState();
    const isSearchMode = !!searchQuery && searchQuery.trim().length > 0;

    useEffect(() => {
        // Reset to first page when search query changes
        setCurrentPage(0);
    }, [searchQuery]);

    useEffect(() => {
        const fetchChats = async () => {
            state.start();
            try {
                let res;
                const offset = currentPage * PAGE_SIZE;
                
                if (isSearchMode) {
                    // Build search query params
                    const params = new URLSearchParams();
                    params.set('query', searchQuery.trim());
                    params.set('limit', PAGE_SIZE.toString());
                    res = await fetch(`/api/copilot/chats/search?${params.toString()}`);
                } else {
                    // Build pagination params
                    const params = new URLSearchParams();
                    params.set('limit', PAGE_SIZE.toString());
                    params.set('offset', offset.toString());
                    res = await fetch(`/api/copilot/chats?${params.toString()}`);
                }

                if (!res.ok) {
                    throw new Error(res.statusText);
                }
                const data = await res.json();

                if (isSearchMode) {
                    setChats(data.results || []);
                    setTotalCount(data.totalResults || 0);
                } else {
                    setChats(data.conversations || []);
                    setTotalCount(data.pagination?.total || 0);
                }
                console.log('[ChatHistory] Loaded:', { 
                    isSearchMode, 
                    chatsCount: data.conversations?.length || data.results?.length, 
                    totalCount: data.pagination?.total || data.totalResults,
                    pagination: data.pagination 
                });
                state.succeed();
            } catch (err) {
                state.fail(err);
            }
        };

        fetchChats();
    }, [searchQuery, currentPage]);

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
                    Found <span className="font-medium">{totalCount}</span> result{totalCount !== 1 ? 's' : ''}
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
                    const regularChat = !isSearchMode ? chat as ChatConversation : null;
                    const snippet = searchResult?.matchingTurns?.[0]?.snippet;
                    const preview = regularChat?.preview;

                    return (
                        <button
                            key={chat.chatId}
                            type="button"
                            onClick={() => onSelect(chat.chatId)}
                            className={`flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all hover:shadow-md ${isActive
                                ? "border-[#55cfd0] bg-[#f4fcfc]"
                                : "border-slate-200 bg-white hover:border-slate-300"
                                }`}
                        >
                            <div className="flex w-full items-center justify-between gap-2">
                                <span className="truncate text-sm font-medium text-slate-900">
                                    {chat.name || chat.chatId}
                                </span>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">{date}</span>
                            </div>
                            
                            {/* Show snippet for search results or preview for regular chats */}
                            {(snippet || preview) && (
                                <p className="text-xs text-slate-600 line-clamp-2">
                                    {snippet || preview}
                                </p>
                            )}
                            
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                <span>
                                    {chat.turnCount} {chat.turnCount === 1 ? "turn" : "turns"}
                                </span>
                                {searchResult?.matchCount && (
                                    <span className="text-[#55cfd0]">
                                        {searchResult.matchCount} {searchResult.matchCount === 1 ? "match" : "matches"}
                                    </span>
                                )}
                            </div>
                            
                            {searchResult?.matchedEntities && searchResult.matchedEntities.length > 0 && (
                                <div className="flex flex-wrap gap-1">
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
            
            {/* Pagination */}
            {totalCount > PAGE_SIZE && (
                <div className="border-t border-slate-200">
                    <Pagination
                        currentPage={currentPage}
                        totalItems={totalCount}
                        pageSize={PAGE_SIZE}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}
        </>
    );
}
