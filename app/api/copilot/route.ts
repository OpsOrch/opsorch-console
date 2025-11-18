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

export async function POST(req: NextRequest) {
  let body: { message?: string; conversationId?: string };
  try {
    body = (await req.json()) as { message?: string; conversationId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.message || typeof body.message !== "string") {
    return NextResponse.json({ error: "`message` is required" }, { status: 400 });
  }

  const payload: Record<string, string> = { message: body.message };
  if (body.conversationId) {
    payload.conversationId = body.conversationId;
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
