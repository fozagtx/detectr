import { promises as fs } from "fs";
import path from "path";
import type { AnalysisResult, CaseInput } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function casePath(id: string) {
  return path.join(DATA_DIR, `case-${id}.json`);
}

function analysisPath(id: string) {
  return path.join(DATA_DIR, `analysis-${id}.json`);
}

export async function saveCase(c: CaseInput): Promise<void> {
  await ensureDir();
  await fs.writeFile(casePath(c.id), JSON.stringify(c, null, 2), "utf8");
}

export async function loadCase(id: string): Promise<CaseInput | null> {
  try {
    const raw = await fs.readFile(casePath(id), "utf8");
    return JSON.parse(raw) as CaseInput;
  } catch {
    return null;
  }
}

export async function saveAnalysis(a: AnalysisResult): Promise<void> {
  await ensureDir();
  await fs.writeFile(analysisPath(a.caseId), JSON.stringify(a, null, 2), "utf8");
}

export async function loadAnalysis(caseId: string): Promise<AnalysisResult | null> {
  try {
    const raw = await fs.readFile(analysisPath(caseId), "utf8");
    return JSON.parse(raw) as AnalysisResult;
  } catch {
    return null;
  }
}
