"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/app/components/AppShell";
import { ChatHistory } from "@/app/components/copilot/ChatHistory";
import { Section } from "@/app/lib/ui";

export default function ChatsPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleClear = () => {
        setSearchQuery("");
        setDebouncedQuery("");
    };

    const isSearchActive = searchQuery.trim().length > 0;

    return (
        <AppShell
            title="Chat History"
            description="View and resume your past conversations with Copilot."
        >
            <Section title="Search Conversations">
                <div className="space-y-4">
                    {/* Search Controls */}
                    <div className="flex gap-3">
                        {/* Search Input */}
                        <div className="flex-1">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search conversations..."
                                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-[#55cfd0] focus:outline-none focus:ring-2 focus:ring-[#55cfd0]/20"
                            />
                        </div>

                        {/* Clear Button */}
                        {isSearchActive && (
                            <button
                                onClick={handleClear}
                                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Results */}
                    <div className="rounded-lg border border-slate-200 bg-white">
                        <ChatHistory
                            onSelect={(chatId) => router.push(`/chats/${chatId}`)}
                            searchQuery={debouncedQuery}
                        />
                    </div>
                </div>
            </Section>
        </AppShell>
    );
}
