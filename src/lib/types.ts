export type ClaimTag =
  | "audio"
  | "motion"
  | "clothing"
  | "facial"
  | "direction"
  | "tattoo"
  | "distance"
  | "lighting"
  | "other";

export type PhysicsVerdict = "POSSIBLE" | "UNCERTAIN" | "UNLIKELY";

export interface Witness {
  id: string;
  name: string;
  position: string;
  statement: string;
}

export interface CaseInput {
  id: string;
  caseName: string;
  location: string;
  dateTime: string;
  description: string;
  witnesses: Witness[];
  status: "DRAFT" | "ANALYZING" | "COMPLETE";
  createdAt: string;
}

export interface Claim {
  id: string;
  witnessId: string;
  witnessName: string;
  text: string;
  tags: ClaimTag[];
  metadata: {
    distance?: string;
    lighting?: string;
    motion?: string;
    time?: string;
  };
}

export interface PhysicsResult {
  claimId: string;
  verdict: PhysicsVerdict;
  confidence: number;
  reason: string;
  physicsScore: number;
}

export interface CrossRefItem {
  id: string;
  type: "agreement" | "contradiction" | "unique";
  topic: string;
  claimIds: string[];
  witnessNames: string[];
  summary: string;
}

export interface DebateEntry {
  id: string;
  trigger: string;
  physicsPosition: string;
  detectivePosition: string;
  resolution: string;
  timestamp: string;
}

export interface Shot {
  id: string;
  title: string;
  prompt: string;
  durationSec: number;
  relatedClaimIds: string[];
}

export interface SceneVideo {
  id: string;
  shotId: string;
  title: string;
  prompt: string;
  status: "pending" | "running" | "succeeded" | "failed";
  url?: string;
  taskId?: string;
  error?: string;
}

export interface DetectiveReport {
  summary: string;
  totalWitnesses: number;
  totalClaims: number;
  claimBreakdown: Record<string, number>;
  physicsFlags: number;
  keyFindings: string[];
  narrative: string;
}

export interface BaselineMetrics {
  mode: "single" | "multi";
  wallTimeMs: number;
  claimsExtracted: number;
  conflictsFound: number;
  physicsFlags: number;
  agreementsFound: number;
}

export interface AnalysisResult {
  caseId: string;
  claims: Claim[];
  physics: PhysicsResult[];
  crossRef: CrossRefItem[];
  debates: DebateEntry[];
  shots: Shot[];
  videos: SceneVideo[];
  report: DetectiveReport;
  baseline: {
    multi: BaselineMetrics;
    single?: BaselineMetrics;
  };
  agentLog: string[];
  completedAt: string;
}

export type AppStep = "INPUT" | "ANALYSIS" | "VIDEOS" | "REPORT" | "DETECTIVE";
