import { langchainJson } from "@/lib/langchain";
import type { Claim, CrossRefItem } from "@/lib/types";

interface CrossResponse {
  items: CrossRefItem[];
}

export async function crossReference(claims: Claim[]): Promise<{
  items: CrossRefItem[];
}> {
  const { data } = await langchainJson<CrossResponse>({
    system: `You are CrossReference, a LangChain multi-witness reconciliation agent in Detectr.
Compare claims across witnesses. Return JSON: { "items": [{ "id", "type": "agreement"|"contradiction"|"unique", "topic", "claimIds", "witnessNames", "summary" }] }
Focus on direction, clothing, audio events, gait, facial marks, tattoos.
Include at least one item when multiple witnesses discuss the same topic.`,
    user: JSON.stringify({ claims }),
  });

  if (!data.items?.length) {
    throw new Error("CrossReference: Qwen returned zero cross-reference items.");
  }

  return { items: data.items };
}
