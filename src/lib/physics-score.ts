import type { Claim, PhysicsResult } from "./types";

export function witnessPhysicsScore(
  witnessId: string,
  claims: Claim[],
  physics: PhysicsResult[],
): number {
  const ids = new Set(claims.filter((c) => c.witnessId === witnessId).map((c) => c.id));
  const scores = physics.filter((p) => ids.has(p.claimId)).map((p) => p.physicsScore);
  if (!scores.length) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}
