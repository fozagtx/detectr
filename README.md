# Detectr

**AI Forensic Agent Society** — turn witness testimony into physics-checked claims, cross-referenced findings, Wan scene reconstructions, and an investigator-ready report.

Built for the **[Global AI Hackathon with Qwen Cloud](https://qwencloud-hackathon.devpost.com/)** · **Track 3: Agent Society**

![License: MIT](https://img.shields.io/badge/license-MIT-teal)
![Stack: Next.js + LangChain + LangGraph + Qwen](https://img.shields.io/badge/stack-Next.js%20%7C%20LangChain%20%7C%20LangGraph%20%7C%20Qwen-0b0f12)

---

## Why Detectr

Investigators, witnesses, and juries often hear conflicting stories about the same night. Detectr runs a **multi-agent society** on Qwen Cloud that:

1. Extracts atomic claims from each statement  
2. Scores them against vision / acoustics limits (**physics validation**)  
3. Cross-references agreements and contradictions  
4. Debates Physics vs Detective when science conflicts with consensus  
5. Storyboards and generates **live** scene videos (Wan / HappyHorse)  
6. Synthesizes a case report and answers grounded detective questions  

**Live only.** There is no mock mode, heuristic fallback, or simulated video path. Every analysis step calls Qwen via LangChain; every clip calls DashScope video APIs.

---

## Demo flow

```
INPUT → ANALYSIS → VIDEOS → REPORT → DETECTIVE
```

| Step | What you see |
|------|----------------|
| **INPUT** | Case file + witnesses, or one-click **Load Demo** (Oak Street Incident) |
| **ANALYSIS** | Claim chips, per-witness physics table, Agent Debate, cross-ref clusters, LangGraph agent log |
| **VIDEOS** | Live Wan/HappyHorse reconstructions for SceneDirector shots |
| **REPORT** | Narrative findings + **multi-agent vs single-agent baseline** metrics |
| **DETECTIVE** | Chat grounded in the completed case file |

---

## Agent Society (LangGraph)

Orchestrator graph (`src/agents/orchestrator.ts`):

```text
extractClaims
  → validatePhysics
  → crossReference
  → negotiateDebate
  → directScenes
  → visualizeScenes
  → writeReport
  → compareBaseline
```

| Agent | Responsibility |
|-------|----------------|
| **ClaimExtractor** | Atomic claims + tags (`audio`, `motion`, `clothing`, `facial`, …) |
| **PhysicsValidator** | `POSSIBLE` / `UNCERTAIN` / `UNLIKELY` + confidence + scientific reason |
| **CrossReference** | Agreements, contradictions, unique details |
| **Debate** | Physics ↔ Detective negotiation when `UNLIKELY` meets multi-witness tension |
| **SceneDirector** | Storyboard prompts for key timeline beats |
| **Visualizer** | Wan / HappyHorse T2V → optional Alibaba OSS upload |
| **Detective** | Final report + interactive Q&A |
| **Baseline** | Single monolithic Qwen pass for Track 3 measurable comparison |

LLM client: [`src/lib/langchain.ts`](src/lib/langchain.ts) (`ChatOpenAI` → DashScope OpenAI-compatible API).

---

## Architecture

![Detectr architecture](docs/architecture.svg)

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind |
| Agents | LangChain.js + LangGraph StateGraph |
| Models | Qwen (`qwen3.7-plus`) + Wan / HappyHorse via DashScope |
| Storage | Local JSON case store (`.data/`) + Alibaba Cloud OSS for MP4s |
| Deploy | Docker → Alibaba Cloud ECS / ACK / Function Compute |

**Alibaba Cloud proof (Devpost):** [`src/lib/alibaba.ts`](src/lib/alibaba.ts)  
Runtime check: `GET /api/demo?proof=alibaba`

---

## Quick start

### 1. Prerequisites

- Node.js 20+
- A [Qwen Cloud / DashScope](https://www.qwencloud.com/) API key (`DASHSCOPE_API_KEY`)

### 2. Install

```bash
git clone https://github.com/fozagtx/detectr.git
cd detectr
cp .env.example .env.local
# Edit .env.local — set DASHSCOPE_API_KEY (required)
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → **Load Demo** → **Analyze Demo**.

### 3. Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `DASHSCOPE_API_KEY` | **Yes** | Qwen Cloud / DashScope key — app will not run without it |
| `QWEN_MODEL` | No | Default `qwen3.7-plus` |
| `WAN_MODEL` | No | Default `happyhorse-1.1-t2v` |
| `QWEN_BASE_URL` | No | Default DashScope intl compatible-mode URL |
| `ALIBABA_OSS_*` | No | Upload generated videos to OSS (see `.env.example`) |

---

## API routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/analyze` | `POST` | Run full LangGraph Agent Society pipeline |
| `/api/detective` | `POST` | Grounded detective chat for a completed case |
| `/api/demo` | `GET` | Oak Street demo case (`?proof=alibaba` for cloud proof JSON) |

Example:

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H 'Content-Type: application/json' \
  -d '{"useDemo":true,"runBaseline":true,"generateVideos":true}'
```

> Video generation is async and can take several minutes per shot. Uncheck **Generate Wan scene videos** in the UI for analysis-only runs (still live Qwen — no mocks).

---

## Docker (Alibaba Cloud)

```bash
docker build -t detectr .
docker run -p 3000:3000 --env-file .env.local detectr
```

Push to Alibaba Container Registry and run on ECS/ACK, or use Function Compute custom runtime. Backend must reach DashScope endpoints.

---

## Hackathon submission checklist

- [x] Public open-source repo + **MIT** [`LICENSE`](LICENSE)
- [x] Uses Qwen models on Qwen Cloud / DashScope
- [x] Track identified: **Track 3 — Agent Society**
- [x] Alibaba Cloud proof file: [`src/lib/alibaba.ts`](src/lib/alibaba.ts)
- [x] Architecture diagram: [`docs/architecture.svg`](docs/architecture.svg)
- [ ] ~3 min demo video — see [`docs/DEMO_VIDEO.md`](docs/DEMO_VIDEO.md)
- [ ] Deployed Alibaba Cloud URL for judges
- [ ] Paste description from [`docs/SUBMISSION.md`](docs/SUBMISSION.md) into Devpost

---

## Project layout

```text
src/
  agents/           # LangGraph nodes + specialist agents
  app/              # Next.js UI + API routes
  lib/
    langchain.ts    # ChatOpenAI → DashScope
    alibaba.ts      # OSS + DashScope proof
    demo-case.ts    # Oak Street Incident seed (input only)
docs/
  architecture.svg
  DEMO_VIDEO.md
  SUBMISSION.md
```

---

## License

[MIT](LICENSE) © Detectr contributors
