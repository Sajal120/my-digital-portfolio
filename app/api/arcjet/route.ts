import arcjet, { detectBot, shield, tokenBucket } from "@arcjet/next";
import { isSpoofedBot } from "@arcjet/inspect";
import { NextResponse } from "next/server";

const aj = arcjet({
  key: process.env.ARCJET_KEY!,
  rules: [
    shield({ mode: "LIVE" }), // Common attack protection
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE"], // Allow only search engine bots
    }),
    tokenBucket({
      mode: "LIVE",
      refillRate: 5,
      interval: 10,
      capacity: 10,
    }),
  ],
});

export async function GET(req: Request) {
  const decision = await aj.protect(req, { requested: 5 });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit())
      return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    if (decision.reason.isBot())
      return NextResponse.json({ error: "No bots allowed" }, { status: 403 });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (decision.ip.isHosting() || decision.results.some(isSpoofedBot)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ message: "Hello world" });
}
