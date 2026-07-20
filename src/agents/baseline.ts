import { langchainJson } from "@/lib/langchain";
import type { BaselineMetrics, CaseInput } from "@/lib/types";

interface SinglePassResponse {
  claimsExtracted: number;
  conflictsFound: number;
  physicsFlags: number;
  agreementsFound: number;
}

/**
 * Single-agent baseline: one live Qwen call for Track 3 comparison.
 */
export async function runSingleAgentBaseline(
  caseInput: CaseInput,
): Promise<BaselineMetrics> {
  const start = Date.now();

  const { data } = await langchainJson<SinglePassResponse>({
    system: `You are a single monolithic forensic AI (LangChain baseline, no Agent Society). In ONE pass, analyze this case and report how many claims, conflicts, physics flags, and agreements you extract.
Return JSON: { "claimsExtracted": number, "conflictsFound": number, "physicsFlags": number, "agreementsFound": number }
Perform a real single-pass analysis — do not invent weak numbers; count what you actually find in one pass.`,
    user: JSON.stringify({
      caseName: caseInput.caseName,
      witnesses: caseInput.witnesses.map((w) => ({
        name: w.name,
        statement: w.statement,
      })),
    }),
  });

  if (
    typeof data.claimsExtracted !== "number" ||
    typeof data.conflictsFound !== "number" ||
    typeof data.physicsFlags !== "number" ||
    typeof data.agreementsFound !== "number"
  ) {
    throw new Error("Baseline: Qwen returned incomplete metrics.");
  }

  return {
    mode: "single",
    wallTimeMs: Date.now() - start,
    claimsExtracted: data.claimsExtracted,
    conflictsFound: data.conflictsFound,
    physicsFlags: data.physicsFlags,
    agreementsFound: data.agreementsFound,
  };
}
