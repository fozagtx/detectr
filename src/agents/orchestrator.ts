/**
 * Detectr Agent Society — LangGraph orchestration.
 *
 * Pipeline: extract → physics → crossRef → debate → director → visualizer → detective → baseline
 * Each node is a specialized agent; state flows through Annotation channels.
 */

import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { extractClaims } from "./claim-extractor";
import { validatePhysics } from "./physics-validator";
import { crossReference } from "./cross-reference";
import { directScenes } from "./scene-director";
import { visualizeScenes } from "./visualizer";
import { writeReport } from "./detective";
import { runSingleAgentBaseline } from "./baseline";
import type {
  AnalysisResult,
  BaselineMetrics,
  CaseInput,
  Claim,
  CrossRefItem,
  DebateEntry,
  DetectiveReport,
  PhysicsResult,
  SceneVideo,
  Shot,
} from "@/lib/types";

export const DetectrState = Annotation.Root({
  caseInput: Annotation<CaseInput>,
  generateVideos: Annotation<boolean>,
  runBaseline: Annotation<boolean>,
  claims: Annotation<Claim[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  physics: Annotation<PhysicsResult[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  crossRef: Annotation<CrossRefItem[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  debates: Annotation<DebateEntry[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  shots: Annotation<Shot[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  videos: Annotation<SceneVideo[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  report: Annotation<DetectiveReport | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  baselineMulti: Annotation<BaselineMetrics | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  baselineSingle: Annotation<BaselineMetrics | null>({
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  startedAt: Annotation<number>,
  agentLog: Annotation<string[]>({
    reducer: (prev, next) => prev.concat(next),
    default: () => [],
  }),
});

export type DetectrGraphState = typeof DetectrState.State;

function negotiateDebates(
  physics: PhysicsResult[],
  claimTextById: Map<string, string>,
  agreementClaimIds: Set<string>,
  agreementWitnessCounts: Map<string, number>,
): DebateEntry[] {
  const debates: DebateEntry[] = [];
  const unlikely = physics.filter((p) => p.verdict === "UNLIKELY");

  for (const p of unlikely) {
    const witnessCount = agreementWitnessCounts.get(p.claimId) ?? 0;
    const inAgreementCluster = agreementClaimIds.has(p.claimId);

    if (inAgreementCluster || witnessCount >= 2) {
      debates.push({
        id: `debate-${p.claimId}`,
        trigger: claimTextById.get(p.claimId) ?? p.claimId,
        physicsPosition: `PhysicsValidator: ${p.verdict} (${p.confidence}% conf). ${p.reason}`,
        detectivePosition:
          "Detective: Multiple witnesses appear aligned on related observations; however sensory physics may still override social consensus for fine-detail claims.",
        resolution:
          "Orchestrator resolution: Retain UNLIKELY physics flag. Prefer corroborated gross events (direction, clothing, audio) over contested fine detail. Note disagreement in report for jury context.",
        timestamp: new Date().toISOString(),
      });
    } else {
      debates.push({
        id: `debate-${p.claimId}`,
        trigger: claimTextById.get(p.claimId) ?? p.claimId,
        physicsPosition: `PhysicsValidator: ${p.verdict} (${p.confidence}% conf). ${p.reason}`,
        detectivePosition:
          "Detective: Claim lacks multi-witness support; treat as low-weight pending corroboration.",
        resolution:
          "Orchestrator resolution: Flag as physically unlikely and uncorroborated. Exclude from primary scene reconstruction narrative.",
        timestamp: new Date().toISOString(),
      });
    }
  }

  return debates;
}

async function extractNode(
  state: DetectrGraphState,
): Promise<Partial<DetectrGraphState>> {
  const { claims } = await extractClaims(state.caseInput);
  return {
    claims,
    agentLog: [
      "LangGraph → ClaimExtractor: live Qwen extraction.",
      `ClaimExtractor: ${claims.length} claims (LangChain/Qwen live).`,
    ],
  };
}

async function physicsNode(
  state: DetectrGraphState,
): Promise<Partial<DetectrGraphState>> {
  const { results } = await validatePhysics(state.caseInput, state.claims);
  return {
    physics: results,
    agentLog: [
      "LangGraph → PhysicsValidator: live Qwen physics scoring.",
      `PhysicsValidator: ${results.filter((p) => p.verdict === "UNLIKELY").length} unlikely flags (LangChain/Qwen live).`,
    ],
  };
}

async function crossRefNode(
  state: DetectrGraphState,
): Promise<Partial<DetectrGraphState>> {
  const { items } = await crossReference(state.claims);
  return {
    crossRef: items,
    agentLog: [
      "LangGraph → CrossReference: live Qwen reconciliation.",
      `CrossReference: ${items.length} relation clusters (LangChain/Qwen live).`,
    ],
  };
}

async function debateNode(
  state: DetectrGraphState,
): Promise<Partial<DetectrGraphState>> {
  const claimTextById = new Map(state.claims.map((c) => [c.id, c.text]));
  const agreementClaimIds = new Set(
    state.crossRef
      .filter((x) => x.type === "agreement")
      .flatMap((x) => x.claimIds),
  );
  const agreementWitnessCounts = new Map<string, number>();
  for (const item of state.crossRef) {
    for (const id of item.claimIds) {
      agreementWitnessCounts.set(id, item.witnessNames.length);
    }
  }

  const debates = negotiateDebates(
    state.physics,
    claimTextById,
    agreementClaimIds,
    agreementWitnessCounts,
  );

  return {
    debates,
    agentLog: [
      "LangGraph → Debate: PhysicsValidator ↔ Detective negotiation.",
      `Orchestrator: ${debates.length} debate resolutions recorded.`,
    ],
  };
}

async function directorNode(
  state: DetectrGraphState,
): Promise<Partial<DetectrGraphState>> {
  const { shots } = await directScenes(
    state.caseInput,
    state.claims,
    state.physics,
    state.crossRef,
  );
  return {
    shots,
    agentLog: [
      "LangGraph → SceneDirector: live Qwen storyboard.",
      `SceneDirector: ${shots.length} shots (LangChain/Qwen live).`,
    ],
  };
}

async function visualizerNode(
  state: DetectrGraphState,
): Promise<Partial<DetectrGraphState>> {
  if (!state.generateVideos) {
    return {
      videos: [],
      agentLog: [
        "LangGraph → Visualizer: skipped (generateVideos=false). No placeholders created.",
      ],
    };
  }

  const videos = await visualizeScenes(state.shots);
  return {
    videos,
    agentLog: [
      "LangGraph → Visualizer: live Wan/HappyHorse generation.",
      `Visualizer: ${videos.length} live videos generated.`,
    ],
  };
}

async function detectiveNode(
  state: DetectrGraphState,
): Promise<Partial<DetectrGraphState>> {
  const { report } = await writeReport(
    state.caseInput,
    state.claims,
    state.physics,
    state.crossRef,
  );

  const multi: BaselineMetrics = {
    mode: "multi",
    wallTimeMs: Date.now() - state.startedAt,
    claimsExtracted: state.claims.length,
    conflictsFound: state.crossRef.filter((x) => x.type === "contradiction")
      .length,
    physicsFlags: state.physics.filter((p) => p.verdict === "UNLIKELY").length,
    agreementsFound: state.crossRef.filter((x) => x.type === "agreement")
      .length,
  };

  return {
    report,
    baselineMulti: multi,
    agentLog: [
      "LangGraph → Detective: live Qwen report synthesis.",
      "Detective: report ready (LangChain/Qwen live).",
    ],
  };
}

async function baselineNode(
  state: DetectrGraphState,
): Promise<Partial<DetectrGraphState>> {
  if (!state.runBaseline) {
    return {
      agentLog: ["LangGraph → Baseline: skipped."],
    };
  }

  const single = await runSingleAgentBaseline(state.caseInput);
  const multi = state.baselineMulti;
  return {
    baselineSingle: single,
    agentLog: [
      "LangGraph → Baseline: single-agent vs Agent Society comparison.",
      `Baseline: single-agent claimed ${single.claimsExtracted} claims / ${single.conflictsFound} conflicts vs multi-agent ${multi?.claimsExtracted ?? 0} / ${multi?.conflictsFound ?? 0}.`,
    ],
  };
}

/** Compiled LangGraph for the Detectr Agent Society. */
export function buildDetectrGraph() {
  return new StateGraph(DetectrState)
    .addNode("extractClaims", extractNode)
    .addNode("validatePhysics", physicsNode)
    .addNode("crossReference", crossRefNode)
    .addNode("negotiateDebate", debateNode)
    .addNode("directScenes", directorNode)
    .addNode("visualizeScenes", visualizerNode)
    .addNode("writeReport", detectiveNode)
    .addNode("compareBaseline", baselineNode)
    .addEdge(START, "extractClaims")
    .addEdge("extractClaims", "validatePhysics")
    .addEdge("validatePhysics", "crossReference")
    .addEdge("crossReference", "negotiateDebate")
    .addEdge("negotiateDebate", "directScenes")
    .addEdge("directScenes", "visualizeScenes")
    .addEdge("visualizeScenes", "writeReport")
    .addEdge("writeReport", "compareBaseline")
    .addEdge("compareBaseline", END)
    .compile();
}

/**
 * Orchestrator entry — runs the LangGraph Agent Society pipeline.
 */
export async function runOrchestrator(
  caseInput: CaseInput,
  options: { runBaseline?: boolean; generateVideos?: boolean } = {},
): Promise<AnalysisResult> {
  const { runBaseline = true, generateVideos = true } = options;
  const graph = buildDetectrGraph();
  const startedAt = Date.now();

  const finalState = await graph.invoke({
    caseInput,
    generateVideos,
    runBaseline,
    startedAt,
    agentLog: [
      "LangGraph Orchestrator: case received — compiling Agent Society graph.",
    ],
  });

  if (!finalState.report || !finalState.baselineMulti) {
    throw new Error("LangGraph pipeline did not produce a complete analysis.");
  }

  return {
    caseId: caseInput.id,
    claims: finalState.claims,
    physics: finalState.physics,
    crossRef: finalState.crossRef,
    debates: finalState.debates,
    shots: finalState.shots,
    videos: finalState.videos,
    report: finalState.report,
    baseline: {
      multi: finalState.baselineMulti,
      single: finalState.baselineSingle ?? undefined,
    },
    agentLog: finalState.agentLog,
    completedAt: new Date().toISOString(),
  };
}
