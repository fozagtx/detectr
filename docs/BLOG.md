# Four witnesses. One night. Which claims survive the light?

**Detectr** is a forensic Agent Society on Qwen Cloud. It does not flatten testimony into one neat story. It breaks statements into claims, stress-tests them against vision and sound limits, lets specialist agents argue, and only then writes the report.

Live app: [getdetectr.vercel.app](https://getdetectr.vercel.app)  
Repo: [github.com/fozagtx/detectr](https://github.com/fozagtx/detectr)

Built for the Global AI Hackathon with Qwen Cloud, Track 3: Agent Society.

---

## The problem is not “AI summary”

Ask a single chat model to “reconcile these witness statements” and you usually get a smooth paragraph. Smooth is the failure mode.

On a dim street, a witness fifty feet away says they saw a facial scar. Another witness thirty feet away says they saw dark clothing and motion, not a face. A third, from a second-floor window, heard the scream and saw someone run left, but no limp and no scar.

A jury does not need poetry. They need to know which details are physically plausible at the reported distance and lux, where the stories agree, and where they quietly conflict.

That is the job Detectr was built for.

---

## What Detectr actually does

You open a case (or hit **Review sample** for the Oak Street Incident). Four bystanders describe the same disturbance near Oak Street and 5th. Then a LangGraph orchestrator runs a live Agent Society on Alibaba Cloud DashScope:

1. **ClaimExtractor** turns each statement into atomic claims with sensory tags (audio, motion, facial, clothing, distance).
2. **PhysicsValidator** scores each claim `POSSIBLE`, `UNCERTAIN`, or `UNLIKELY` against vision and acoustics limits. A scar “seen” from ~50 ft under dim streetlights tends to land where it should: unlikely.
3. **CrossReference** maps agreements, contradictions, and unique details across witnesses.
4. **Debate** puts Physics against Detective when science conflicts with multi-witness consensus, so the system does not silently paper over tension.
5. **SceneDirector + Visualizer** storyboard key beats and can generate Wan / HappyHorse clips (optional; leave videos off for a fast run).
6. **Detective** writes the case report and answers grounded questions about the finished file.
7. **Baseline** runs a single monolithic Qwen pass on the same case so you can see what the society found that a one-shot prompt missed.

Every analysis step hits live Qwen. There is no mock agent path. If the key is wrong or the plan is wrong, the app fails honestly.

---

## Why agents instead of one mega-prompt

Track 3 is Agent Society for a reason. Roles force structure.

Extractor is greedy for claims. Physics is skeptical about eyesight. CrossRef only cares about overlap. Debate only fires when the conflict is real. Detective has to write from the file, not invent atmosphere.

When we compare the multi-agent graph to a single Qwen pass on the same Oak Street seed, the society usually surfaces more claims and more conflicts. That is not a vanity metric. It is the point of specialization: different jobs, shared state, less smoothing.

Orchestration lives in `src/agents/orchestrator.ts`. The Qwen client is LangChain `ChatOpenAI` pointed at DashScope compatible-mode (`src/lib/langchain.ts`). Cloud proof for judges sits in `src/lib/alibaba.ts`.

---

## What we had to get wrong before it worked

**Billing is a product surface.** Token Plan keys (`sk-sp-…`) and Pay-As-You-Go keys (`sk-ws-…`) are not interchangeable. Wrong base URL plus wrong key looks like “quota exhausted” or `AccessDenied.Unpurchased` even when you paid for something. Detectr’s backend is Pay-As-You-Go DashScope intl.

**Thinking mode eats the demo.** With thinking left on, sample runs hit Vercel’s wall clock. We turn thinking off by default so the society finishes inside a judge click.

**Serverless has no durable disk.** Writing cases under `.data` failed on Vercel. We moved to memory plus `/tmp`, and the detective chat accepts the case payload from the client when the isolate forgot yesterday’s file.

**UX lies are expensive in a live demo.** Dual sidebars, Pause dumping you back to the landing page, old deployment aliases 404ing on browser back. We fixed those because a broken shell kills trust faster than a slow model.

---

## How to try it in two minutes

1. Open [https://getdetectr.vercel.app](https://getdetectr.vercel.app)
2. Click **Review sample**
3. Leave scene videos off unless you want Wan reconstructions (slower, more quota)
4. Read the physics table and the cross-ref conflicts before you read the narrative report
5. Ask the detective something grounded, like which witness could plausibly resolve clothing vs facial detail

If you want the architecture in one picture: [docs/architecture.svg](https://github.com/fozagtx/detectr/blob/main/docs/architecture.svg)

---

## What this is not

Detectr is not a courtroom verdict machine. It does not declare guilt. It does not replace investigators.

It is a structured way to pressure-test testimony with specialist agents on Qwen Cloud, surface what the light and distance allow, and make the disagreements visible before anyone writes the story that “sounds right.”

MIT. Public repo. Live demo. Built in the open for the Qwen Cloud hackathon.

If you break it, open an issue. If you run the sample, start with Maria’s scar claim and ask yourself whether you would have believed it without a physics pass.
