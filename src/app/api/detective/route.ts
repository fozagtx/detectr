import { NextResponse } from "next/server";
import { chatWithDetective } from "@/agents/detective";
import {
  RATE,
  clientIp,
  rateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { loadAnalysis, loadCase } from "@/lib/store";
import type { AnalysisResult, CaseInput } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const limited = rateLimit(
      `detective:${clientIp(req)}`,
      RATE.detective.limit,
      RATE.detective.windowMs,
    );
    if (!limited.ok) return rateLimitResponse(limited);

    const body = (await req.json()) as {
      caseId: string;
      message: string;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
      /** Client payload — required on serverless when disk/memory miss */
      case?: CaseInput;
      analysis?: AnalysisResult;
    };

    if (!body.caseId || !body.message) {
      return NextResponse.json(
        { error: "caseId and message are required" },
        { status: 400 },
      );
    }

    const caseInput =
      body.case ?? (await loadCase(body.caseId));
    const analysis =
      body.analysis ?? (await loadAnalysis(body.caseId));
    if (!caseInput || !analysis) {
      return NextResponse.json(
        { error: "Case analysis not found. Run analysis first." },
        { status: 404 },
      );
    }

    const reply = await chatWithDetective({
      caseInput,
      analysis,
      message: body.message,
      history: body.history ?? [],
    });

    return NextResponse.json({ reply });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Detective chat failed" },
      { status: 500 },
    );
  }
}
