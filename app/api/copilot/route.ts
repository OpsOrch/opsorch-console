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

function propagateChatId(payload: unknown, fallback?: string) {
  if (!payload || typeof payload !== "object" || payload === null) return;
  const target = payload as { chatId?: unknown; answer?: unknown };
  const chatCandidate = typeof target.chatId === "string" ? target.chatId : undefined;
  const resolved = chatCandidate || fallback;
  if (resolved && !chatCandidate) {
    target.chatId = resolved;
  }
  if (target.answer && typeof target.answer === "object") {
    propagateChatId(target.answer, resolved);
  }
}

export async function POST(req: NextRequest) {
  let body: { message?: string; chatId?: string };
  try {
    body = (await req.json()) as { message?: string; chatId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.message || typeof body.message !== "string") {
    return NextResponse.json({ error: "`message` is required" }, { status: 400 });
  }

  const payload: Record<string, string> = { message: body.message };
  const sessionId = body.chatId;
  if (sessionId) {
    payload.chatId = sessionId;
  }

  try {
    const res = await fetch(`${COPILOT_BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const text = await res.text();
    const contentType = res.headers.get("content-type") || "application/json";

    if (!res.ok) {
      return NextResponse.json({ error: text || res.statusText }, { status: res.status });
    }

    if (contentType.includes("application/json")) {
      try {
        const data = text ? JSON.parse(text) : {};
        propagateChatId(data, sessionId);
        return NextResponse.json(data, { status: res.status });
      } catch {
        return NextResponse.json({ error: "Invalid JSON from copilot" }, { status: 502 });
      }
    }

    return new NextResponse(text, {
      status: res.status,
      headers: { "Content-Type": contentType },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Copilot request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
