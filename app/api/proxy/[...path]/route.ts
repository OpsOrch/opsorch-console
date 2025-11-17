import { NextResponse, type NextRequest } from "next/server";

const API_BASE_URL =
  process.env.OPS_ORCH_API_BASE_URL ||
  process.env.OPSORCH_API_BASE_URL ||
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_OPS_ORCH_API_BASE_URL ||
  "http://localhost:8080";

const API_TOKEN =
  process.env.OPS_ORCH_API_TOKEN ||
  process.env.OPSORCH_API_TOKEN ||
  process.env.API_TOKEN ||
  'demo';

async function forward(
  request: NextRequest,
  { params }: { params: { path?: string[] } | Promise<{ path?: string[] }> }
) {
  if (!API_BASE_URL) {
    return NextResponse.json({ error: "API base URL not configured" }, { status: 500 });
  }

  const resolvedParams = await params;
  const path = resolvedParams.path?.join("/") ?? "";
  const incomingUrl = new URL(request.url);
  const forwardUrl = new URL(path, API_BASE_URL);
  forwardUrl.search = incomingUrl.search; // preserve query params

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("accept-encoding");
  headers.delete("authorization");

  if (API_TOKEN) {
    headers.set("authorization", `Bearer ${API_TOKEN}`);
  }

  const method = request.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();

  try {
    const res = await fetch(forwardUrl.toString(), {
      method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
    });

    const resHeaders = new Headers(res.headers);
    resHeaders.delete("content-encoding");
    resHeaders.delete("transfer-encoding");

    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: resHeaders,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE, forward as HEAD, forward as OPTIONS };
