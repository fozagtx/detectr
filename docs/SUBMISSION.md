# Devpost — copy/paste fields

Use this with the live README section **Hackathon submission (judges)**.

## Track

**Track 3: Agent Society**

## Project title

Detectr — AI Forensic Agent Society

## Tagline

Multi-agent forensic analysis that physics-checks witness claims and reconstructs the scene with Qwen Cloud.

## Repository (public, MIT)

https://github.com/fozagtx/detectr

License file (detectable in GitHub About):  
https://github.com/fozagtx/detectr/blob/main/LICENSE

## Live demo

https://getdetectr.vercel.app

## Proof of Alibaba Cloud (link a code file)

https://github.com/fozagtx/detectr/blob/main/src/lib/alibaba.ts

Supporting proof (DashScope LangChain client):  
https://github.com/fozagtx/detectr/blob/main/src/lib/langchain.ts

Supporting proof (Wan video → DashScope):  
https://github.com/fozagtx/detectr/blob/main/src/agents/visualizer.ts

Runtime JSON proof:  
https://getdetectr.vercel.app/api/demo?proof=alibaba

## Architecture diagram

https://github.com/fozagtx/detectr/blob/main/docs/architecture.svg

## Demo video

**TODO — upload ~3 min public video**, then paste URL here:

- Script: [`DEMO_VIDEO.md`](./DEMO_VIDEO.md)
- Platforms: YouTube / Vimeo / Facebook Video (public)
- Placeholder: `_paste YouTube/Vimeo URL after upload_`

## Built with

Next.js, TypeScript, Tailwind, HeroUI, LangChain.js, LangGraph, Qwen Cloud (DashScope), Wan/HappyHorse, Alibaba Cloud OSS, Vercel

---

## Description (paste into Devpost)

Detectr is an AI forensic Agent Society built for the Global AI Hackathon with Qwen Cloud (**Track 3: Agent Society**).

When investigators collect conflicting witness statements about the same night, Detectr turns those statements into a structured case file. A LangGraph orchestrator runs specialized agents on **Alibaba Cloud DashScope / Qwen Cloud**:

1. **ClaimExtractor** — pulls atomic claims with sensory tags (audio, motion, facial, clothing, …)
2. **PhysicsValidator** — scores each claim `POSSIBLE` / `UNCERTAIN` / `UNLIKELY` against vision and acoustics limits
3. **CrossReference** — finds agreements, contradictions, and unique details across witnesses
4. **Debate** — Physics vs Detective negotiation when science conflicts with multi-witness consensus
5. **SceneDirector + Visualizer** — storyboards key beats and generates live Wan/HappyHorse scene clips (optional Alibaba OSS storage)
6. **Detective** — writes the case report and answers grounded questions about the file
7. **Baseline** — compares the Agent Society against a single monolithic Qwen pass (Track 3 measurable delta)

**How to try it:** open https://getdetectr.vercel.app → **Review sample** (Oak Street Incident). Analysis uses live Qwen only — no mock agents. Turn on scene videos when you want Wan reconstructions (costs more API quota and takes longer).

**Open source:** MIT license at https://github.com/fozagtx/detectr
