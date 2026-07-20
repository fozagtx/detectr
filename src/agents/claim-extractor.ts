import { langchainJson } from "@/lib/langchain";
import type { CaseInput, Claim, ClaimTag } from "@/lib/types";

interface ExtractorResponse {
  claims: Array<{
    witnessId: string;
    witnessName: string;
    text: string;
    tags: ClaimTag[];
    metadata?: Claim["metadata"];
  }>;
}

export async function extractClaims(caseInput: CaseInput): Promise<{
  claims: Claim[];
}> {
  const { data } = await langchainJson<ExtractorResponse>({
    system: `You are ClaimExtractor, a LangChain forensic NLP agent in the Detectr Agent Society.
Extract atomic observable claims from witness statements.
Return JSON: { "claims": [{ "witnessId", "witnessName", "text", "tags": string[], "metadata": { "distance?", "lighting?", "motion?", "time?" } }] }
Tags must be from: audio, motion, clothing, facial, direction, tattoo, distance, lighting, other.
Be precise; one observable fact per claim. Extract as many distinct claims as the statements support.`,
    user: JSON.stringify({
      caseName: caseInput.caseName,
      location: caseInput.location,
      dateTime: caseInput.dateTime,
      description: caseInput.description,
      witnesses: caseInput.witnesses,
    }),
  });

  if (!data.claims?.length) {
    throw new Error("ClaimExtractor: Qwen returned zero claims.");
  }

  const claims: Claim[] = data.claims.map((c, i) => ({
    id: `c${i + 1}`,
    witnessId: c.witnessId,
    witnessName: c.witnessName,
    text: c.text,
    tags: c.tags?.length ? c.tags : (["other"] as ClaimTag[]),
    metadata: c.metadata ?? {},
  }));

  return { claims };
}
