import { langchainJson } from "@/lib/langchain";
import type { CaseInput, Claim, CrossRefItem, PhysicsResult, Shot } from "@/lib/types";

interface DirectorResponse {
  shots: Array<{
    title: string;
    prompt: string;
    durationSec: number;
    relatedClaimIds: string[];
  }>;
}

export async function directScenes(
  caseInput: CaseInput,
  claims: Claim[],
  physics: PhysicsResult[],
  crossRef: CrossRefItem[],
): Promise<{ shots: Shot[] }> {
  const { data } = await langchainJson<DirectorResponse>({
    system: `You are SceneDirector, a LangChain agent in Detectr Agent Society.
Create 3–4 short storyboard shots for jury/witness visualization from the case.
Return JSON: { "shots": [{ "title", "prompt", "durationSec": 5, "relatedClaimIds": string[] }] }
Prompts must be suitable for Wan/HappyHorse text-to-video: cinematic, no gore, night urban reconstruction.`,
    user: JSON.stringify({
      case: {
        name: caseInput.caseName,
        location: caseInput.location,
        dateTime: caseInput.dateTime,
      },
      claims: claims.slice(0, 20),
      unlikely: physics.filter((p) => p.verdict === "UNLIKELY"),
      agreements: crossRef.filter((c) => c.type === "agreement"),
    }),
  });

  if (!data.shots?.length) {
    throw new Error("SceneDirector: Qwen returned zero storyboard shots.");
  }

  const shots: Shot[] = data.shots.map((s, i) => ({
    id: `shot${i + 1}`,
    title: s.title,
    prompt: s.prompt,
    durationSec: s.durationSec || 5,
    relatedClaimIds: s.relatedClaimIds ?? [],
  }));

  return { shots };
}
