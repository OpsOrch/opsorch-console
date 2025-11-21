"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/app/components/AppShell";
import { CopilotPanel } from "@/app/components/CopilotPanel";
import { useMemo } from "react";

export default function ChatDetailPage() {
    const params = useParams<{ id?: string }>();
    const chatId = useMemo(() => {
        const raw = params?.id;
        return Array.isArray(raw) ? raw[0] : raw;
    }, [params]);

    return (
        <AppShell
            title="Chat Detail"
            description={`Viewing conversation ${chatId || ""}`}
        >
            <div className="grid grid-cols-1 gap-6">
                {chatId ? <CopilotPanel initialChatId={chatId} /> : <p>Invalid chat ID</p>}
            </div>
        </AppShell>
    );
}
