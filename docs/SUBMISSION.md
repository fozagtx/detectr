# Devpost submission notes

**Track:** Track 3 — Agent Society

**Project title:** Detectr — Witness Testimony Agent Society

**Tagline:** Multi-agent forensic analysis that validates witness claims with physics and reconstructs scenes for jury visualization.

**Alibaba Cloud proof (link this file on Devpost):**  
https://github.com/fozagtx/detectr/blob/main/src/lib/alibaba.ts

**Architecture diagram:**  
https://github.com/fozagtx/detectr/blob/main/docs/architecture.svg

**Open source license:** MIT (LICENSE at repo root)

## Description (paste)

Detectr is a multi-agent forensic application built on Qwen Cloud for the Global AI Hackathon (Track 3: Agent Society). Investigators enter case details and witness statements (or load the Oak Street Incident demo). An Orchestrator decomposes the case across specialized agents:

- ClaimExtractor pulls atomic claims with sensory metadata
- PhysicsValidator scores each claim against vision/acoustics limits
- CrossReference finds agreements and contradictions
- Orchestrator runs Physics ↔ Detective debates when science conflicts with consensus
- SceneDirector + Visualizer produce Wan/HappyHorse scene reconstructions (OSS storage)
- Detective synthesizes the report and answers grounded questions

We measure Agent Society gains vs a single-agent Qwen baseline (claims, conflicts, physics flags) on the Report page.

## Built with

Next.js, TypeScript, Tailwind CSS, LangChain.js, LangGraph, Qwen Cloud (DashScope), Wan/HappyHorse, Alibaba Cloud OSS, Docker
