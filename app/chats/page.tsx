"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/app/components/AppShell";
import { ChatHistory } from "@/app/components/copilot/ChatHistory";
import { Section } from "@/app/lib/ui";

export default function ChatsPage() {
    const router = useRouter();

    return (
        <AppShell
            title="Chat History"
            description="View and resume your past conversations with Copilot."
        >
            <Section title="Recent Conversations">
                <ChatHistory
                    onSelect={(chatId) => router.push(`/chats/${chatId}`)}
                />
            </Section>
        </AppShell>
    );
}
