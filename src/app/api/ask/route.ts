import { NextRequest } from "next/server";
import { PROFILE_SYSTEM } from "@/data/profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Msg = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return Response.json({ error: "Server missing ANTHROPIC_API_KEY" }, { status: 500 });

  let messages: Msg[] = [];
  try {
    const body = await req.json();
    messages = Array.isArray(body?.messages) ? body.messages : [];
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }
  // Keep payload bounded.
  messages = messages.slice(-12).map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) }));

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
        max_tokens: 1000,
        system: PROFILE_SYSTEM,
        messages,
      }),
    });
    const data = await r.json();
    if (!r.ok) return Response.json({ error: data?.error?.message || "Upstream error" }, { status: 502 });
    const text = (data.content || [])
      .filter((b: { type: string }) => b.type === "text")
      .map((b: { text: string }) => b.text)
      .join("\n")
      .trim();
    return Response.json({ text: text || "No response." });
  } catch {
    return Response.json({ error: "Request failed" }, { status: 500 });
  }
}
