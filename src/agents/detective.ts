import { langchainJson, langchainText } from "@/lib/langchain";
import type {
  AnalysisResult,
  CaseInput,
  Claim,
  CrossRefItem,
  DetectiveReport,
  PhysicsResult,
} from "@/lib/types";

interface ReportResponse {
  summary: string;
  keyFindings: string[];
  narrative: string;
  claimBreakdown?: Record<string, number>;
}

function buildBreakdown(claims: Claim[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  for (const c of claims) {
    for (const tag of c.tags) {
      breakdown[tag] = (breakdown[tag] ?? 0) + 1;
    }
  }
  return breakdown;
}

export async function writeReport(
  caseInput: CaseInput,
  claims: Claim[],
  physics: PhysicsResult[],
  crossRef: CrossRefItem[],
): Promise<{ report: DetectiveReport }> {
  const flags = physics.filter((p) => p.verdict === "UNLIKELY").length;
  const { data } = await langchainJson<ReportResponse>({
    system: `You are Detective, the LangChain lead synthesis agent in Detectr Agent Society.
Write a clear forensic summary for investigators and jury visualization context.
Return JSON: { "summary", "keyFindings": string[], "narrative", "claimBreakdown": { "tag": number } }
summary must mention witness count, claim count, and physics flags.`,
    user: JSON.stringify({
      case: caseInput,
      claims,
      physics,
      crossRef,
      physicsFlags: flags,
      totalWitnesses: caseInput.witnesses.length,
      totalClaims: claims.length,
    }),
  });

  if (!data.summary || !data.narrative || !data.keyFindings?.length) {
    throw new Error("Detective: Qwen returned an incomplete report.");
  }

  return {
    report: {
      summary: data.summary,
      totalWitnesses: caseInput.witnesses.length,
      totalClaims: claims.length,
      claimBreakdown: data.claimBreakdown ?? buildBreakdown(claims),
      physicsFlags: flags,
      keyFindings: data.keyFindings,
      narrative: data.narrative,
    },
  };
}

export async function chatWithDetective(params: {
  caseInput: CaseInput;
  analysis: AnalysisResult;
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<string> {
  const system = `You are Detective, a LangChain AI forensic analyst in Detectr.
You have reviewed the case file and agent society outputs. Answer questions about claims, physics scores, conflicts, and scene reconstructions.
Be precise, cite witness names and verdicts. Do not invent evidence not in the case file.

CASE FILE:
${JSON.stringify(
  {
    case: {
      name: params.caseInput.caseName,
      location: params.caseInput.location,
      dateTime: params.caseInput.dateTime,
    },
    report: params.analysis.report,
    debates: params.analysis.debates,
    crossRef: params.analysis.crossRef,
    unlikely: params.analysis.physics.filter((p) => p.verdict === "UNLIKELY"),
    claimCount: params.analysis.claims.length,
  },
  null,
  2,
)}`;

  const historyText = params.history
    .slice(-8)
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");

  return langchainText({
    system,
    user: `${historyText}\nUSER: ${params.message}`,
    temperature: 0.35,
  });
}
