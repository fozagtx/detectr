import { NextResponse } from "next/server";
import { runOrchestrator } from "@/agents/orchestrator";
import { createOakStreetDemo } from "@/lib/demo-case";
import { requireQwenKey } from "@/lib/langchain";
import { saveAnalysis, saveCase } from "@/lib/store";
import type { CaseInput } from "@/lib/types";

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    requireQwenKey();

    const body = (await req.json()) as {
      case?: CaseInput;
      useDemo?: boolean;
      runBaseline?: boolean;
      generateVideos?: boolean;
    };

    const caseInput = body.useDemo ? createOakStreetDemo() : body.case;

    if (!caseInput) {
      return NextResponse.json({ error: "Missing case payload" }, { status: 400 });
    }

    if (!caseInput.witnesses?.length) {
      return NextResponse.json(
        { error: "At least one witness is required" },
        { status: 400 },
      );
    }

    caseInput.status = "ANALYZING";
    await saveCase(caseInput);

    const analysis = await runOrchestrator(caseInput, {
      runBaseline: body.runBaseline ?? true,
      generateVideos: body.generateVideos ?? true,
    });

    caseInput.status = "COMPLETE";
    await saveCase(caseInput);
    await saveAnalysis(analysis);

    return NextResponse.json({ case: caseInput, analysis });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 },
    );
  }
}
