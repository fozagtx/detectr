import { langchainJson } from "@/lib/langchain";
import type { CaseInput, Claim, PhysicsResult } from "@/lib/types";

interface PhysicsResponse {
  results: Array<{
    claimId: string;
    verdict: PhysicsResult["verdict"];
    confidence: number;
    reason: string;
    physicsScore: number;
  }>;
}

export async function validatePhysics(
  caseInput: CaseInput,
  claims: Claim[],
): Promise<{ results: PhysicsResult[] }> {
  const { data } = await langchainJson<PhysicsResponse>({
    system: `You are PhysicsValidator, a LangChain vision-science and acoustics forensic agent in Detectr.
For each claim, assess physical plausibility given distance, lighting (lux), motion, and human sensory limits.
Return JSON: { "results": [{ "claimId", "verdict": "POSSIBLE"|"UNCERTAIN"|"UNLIKELY", "confidence": 0-100, "reason", "physicsScore": 0-100 }] }
You MUST return one result per claimId provided. Be scientifically grounded.
Facial details at >30ft in ~5 lux with motion should score low.`,
    user: JSON.stringify({
      scene: {
        location: caseInput.location,
        dateTime: caseInput.dateTime,
        description: caseInput.description,
      },
      claims,
    }),
  });

  if (!data.results?.length) {
    throw new Error("PhysicsValidator: Qwen returned zero physics results.");
  }

  return { results: data.results };
}
