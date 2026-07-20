import { NextResponse } from "next/server";
import { createOakStreetDemo } from "@/lib/demo-case";
import { alibabaCloudProofSummary } from "@/lib/alibaba";
import {
  RATE,
  clientIp,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";

export async function GET(req: Request) {
  const limited = rateLimit(
    `demo:${clientIp(req)}`,
    RATE.demo.limit,
    RATE.demo.windowMs,
  );
  if (!limited.ok) return rateLimitResponse(limited);

  const { searchParams } = new URL(req.url);
  if (searchParams.get("proof") === "alibaba") {
    return NextResponse.json(alibabaCloudProofSummary());
  }
  return NextResponse.json({ demo: createOakStreetDemo() });
}
