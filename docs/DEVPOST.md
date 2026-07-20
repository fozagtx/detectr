# Detectr — Devpost story (paste into submission)

**Project:** Detectr  
**Hackathon:** Global AI Hackathon with Qwen Cloud  
**Track:** Track 3 — Agent Society  
**Repo:** https://github.com/fozagtx/detectr  
**Live:** https://getdetectr.vercel.app  

---

## Inspiration

Witnesses to the same night rarely tell the same story. Investigators, juries, and even AI chatbots usually get a single flattened narrative — and miss the quiet physics that make a claim impossible (a facial scar “seen” from fifty feet in dim light, a limp that doesn’t match the distance and time).

We were inspired by forensic workflow tools and multi-agent debate: what if specialized agents argued over testimony the way a physics expert and a detective would, then showed the scene so everyone can see what holds up?

That became **Detectr** — an Agent Society on Qwen Cloud for witness testimony.

---

## What it does

Detectr turns a case file and multiple witness statements into a structured forensic review:

1. **Claim extraction** — breaks each statement into atomic claims with sensory tags  
2. **Physics validation** — scores claims `POSSIBLE` / `UNCERTAIN` / `UNLIKELY` against vision and acoustics limits  
3. **Cross-reference** — finds agreements, contradictions, and unique details across witnesses  
4. **Agent debate** — Physics vs Detective when science conflicts with multi-witness consensus  
5. **Scene reconstruction** — optional Wan / HappyHorse clips of key beats  
6. **Detective report + Ask** — narrative findings and grounded Q&A on the finished case  
7. **Baseline comparison** — multi-agent society vs a single monolithic Qwen pass (Track 3 measurable delta)

Try it: open the live app → **Review sample** (Oak Street Incident). Pause / Stop keep you in the case shell; rate limits protect the API from abuse.

---

## How we built it

- **Frontend:** Next.js App Router, TypeScript, HeroUI Pro patterns, Brutalism theme, original logo + hero art  
- **Orchestration:** LangGraph `StateGraph` Agent Society (`src/agents/orchestrator.ts`)  
- **LLM:** LangChain `ChatOpenAI` → Qwen Cloud (DashScope / Token Plan OpenAI-compatible API)  
- **Video:** DashScope async Wan / HappyHorse T2V (`src/agents/visualizer.ts`)  
- **Storage:** serverless-safe case store + optional Alibaba Cloud OSS for MP4s (`src/lib/alibaba.ts`)  
- **Ops:** per-IP rate limits, abortable analyze (Pause / Stop all), public MIT repo  

Proof of Alibaba Cloud usage for judges:  
https://github.com/fozagtx/detectr/blob/main/src/lib/alibaba.ts  

Architecture:  
https://github.com/fozagtx/detectr/blob/main/docs/architecture.svg  

---

## Challenges we ran into

- **No mocks allowed** — every step must be live Qwen; timeouts and quota failures show up immediately in the demo path  
- **Vercel + long agent graphs** — full runs with thinking + video hit platform limits; we disabled thinking by default, made videos optional, and tightened the sample path  
- **Serverless filesystem** — writing to `.data` failed on Vercel; moved to memory + `/tmp` and pass case context into detective chat  
- **Billing / plan wiring** — free-tier keys, Token Plan keys (`sk-sp-…`), and base URLs are not interchangeable; wrong combo looks like “quota exhausted” or `AccessDenied.Unpurchased` even when you subscribed  
- **UX honesty** — dual sidebars, pause dumping users back to landing, and old `detectr-five` URLs 404ing on browser back — all had to be fixed under live demo pressure  

---

## Accomplishments that we're proud of

- A real **LangGraph Agent Society** with specialist roles, debate, and a single-agent baseline — not a single mega-prompt  
- **Physics-aware** claim scoring that surfaces weak testimony instead of rubber-stamping stories  
- End-to-end product: landing → case shell → checks → report → grounded Ask, with Pause / Stop and rate limits  
- Open-source MIT repo with architecture diagram, Alibaba proof file, and judge-ready docs  

---

## What we learned

- Multi-agent pipelines win when roles are sharp and state is shared — Extractor / Physics / CrossRef / Detective each do one job  
- Cloud “plans” are product surfaces: **Token Plan endpoint + seat assignment** is different from DashScope free/pay-as-you-go; keys and base URLs must match  
- Demo reliability beats feature sprawl: optional video, no thinking tax, clear errors, and a sticky app shell matter as much as the graph  

---

## What's next for Detectr

- Seat-aware model routing and clearer billing errors when a Token Plan seat can’t access a model  
- Stream agent progress live in the UI (not just a working card)  
- Stronger persistence (DB) for cases across serverless isolates  
- Jury-mode presentation: side-by-side claim timeline + scene clips  
- Optional multimodal inputs (photos / CCTV stills) via Qwen vision into the same society  

---

## Quick links (judges)

| Item | URL |
|------|-----|
| Track | **Track 3: Agent Society** |
| Repo | https://github.com/fozagtx/detectr |
| Live | https://getdetectr.vercel.app |
| Alibaba proof | https://github.com/fozagtx/detectr/blob/main/src/lib/alibaba.ts |
| Architecture | https://github.com/fozagtx/detectr/blob/main/docs/architecture.svg |
| Demo video script | https://github.com/fozagtx/detectr/blob/main/docs/DEMO_VIDEO.md |
