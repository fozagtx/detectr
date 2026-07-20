import { promises as fs } from "fs";
import path from "path";
import type { AnalysisResult, CaseInput } from "./types";

/**
 * Serverless-safe store: memory always, disk when writable.
 * On Vercel, cwd is read-only — use /tmp. Locally use .data.
 */
const globalStore = globalThis as typeof globalThis & {
  __detectrCases?: Map<string, CaseInput>;
  __detectrAnalyses?: Map<string, AnalysisResult>;
};

const cases = globalStore.__detectrCases ?? new Map<string, CaseInput>();
const analyses =
  globalStore.__detectrAnalyses ?? new Map<string, AnalysisResult>();
globalStore.__detectrCases = cases;
globalStore.__detectrAnalyses = analyses;

const DATA_DIR =
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
    ? path.join("/tmp", "detectr-data")
    : path.join(process.cwd(), ".data");

async function ensureDir(): Promise<boolean> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

function casePath(id: string) {
  return path.join(DATA_DIR, `case-${id}.json`);
}

function analysisPath(id: string) {
  return path.join(DATA_DIR, `analysis-${id}.json`);
}

export async function saveCase(c: CaseInput): Promise<void> {
  cases.set(c.id, c);
  if (!(await ensureDir())) return;
  try {
    await fs.writeFile(casePath(c.id), JSON.stringify(c, null, 2), "utf8");
  } catch {
    // memory already has it
  }
}

export async function loadCase(id: string): Promise<CaseInput | null> {
  const cached = cases.get(id);
  if (cached) return cached;
  try {
    const raw = await fs.readFile(casePath(id), "utf8");
    const parsed = JSON.parse(raw) as CaseInput;
    cases.set(id, parsed);
    return parsed;
  } catch {
    return null;
  }
}

export async function saveAnalysis(a: AnalysisResult): Promise<void> {
  analyses.set(a.caseId, a);
  if (!(await ensureDir())) return;
  try {
    await fs.writeFile(
      analysisPath(a.caseId),
      JSON.stringify(a, null, 2),
      "utf8",
    );
  } catch {
    // memory already has it
  }
}

export async function loadAnalysis(
  caseId: string,
): Promise<AnalysisResult | null> {
  const cached = analyses.get(caseId);
  if (cached) return cached;
  try {
    const raw = await fs.readFile(analysisPath(caseId), "utf8");
    const parsed = JSON.parse(raw) as AnalysisResult;
    analyses.set(caseId, parsed);
    return parsed;
  } catch {
    return null;
  }
}
