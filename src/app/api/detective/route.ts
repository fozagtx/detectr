import { NextResponse } from "next/server";
import { chatWithDetective } from "@/agents/detective";
import { loadAnalysis, loadCase } from "@/lib/store";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      caseId: string;
      message: string;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!body.caseId || !body.message) {
      return NextResponse.json(
        { error: "caseId and message are required" },
        { status: 400 },
      );
    }

    const caseInput = await loadCase(body.caseId);
    const analysis = await loadAnalysis(body.caseId);
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
