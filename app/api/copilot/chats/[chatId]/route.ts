import { NextRequest, NextResponse } from "next/server";
import { trimTrailingSlash } from "@/app/lib/api";

const COPILOT_BASE_URL = trimTrailingSlash(
    process.env.OPS_ORCH_COPILOT_BASE_URL ||
    process.env.OPSORCH_COPILOT_BASE_URL ||
    process.env.COPILOT_BASE_URL ||
    process.env.COPILOT_API_BASE_URL ||
    process.env.NEXT_PUBLIC_OPS_ORCH_COPILOT_BASE_URL ||
    "http://localhost:6060",
);

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ chatId: string }> }
) {
    const { chatId } = await params;

    if (!chatId) {
        return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
    }

    try {
        const res = await fetch(`${COPILOT_BASE_URL}/chats/${chatId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
        });

        if (!res.ok) {
            const text = await res.text();
            return NextResponse.json({ error: text || res.statusText }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data, { status: 200 });
    } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch chat details";
        return NextResponse.json({ error: message }, { status: 502 });
    }
}
