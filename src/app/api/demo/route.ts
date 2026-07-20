import { NextResponse } from "next/server";
import { createOakStreetDemo } from "@/lib/demo-case";
import { alibabaCloudProofSummary } from "@/lib/alibaba";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("proof") === "alibaba") {
    return NextResponse.json(alibabaCloudProofSummary());
  }
  return NextResponse.json({ demo: createOakStreetDemo() });
}
