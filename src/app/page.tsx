"use client";

import { useMemo, useState, useTransition } from "react";
import type {
  AnalysisResult,
  AppStep,
  CaseInput,
  Claim,
  PhysicsResult,
  Witness,
} from "@/lib/types";
import { witnessPhysicsScore } from "@/lib/physics-score";

const STEPS: AppStep[] = ["INPUT", "ANALYSIS", "VIDEOS", "REPORT", "DETECTIVE"];

function emptyCase(): CaseInput {
  return {
    id: `DET-${Date.now()}`,
    caseName: "",
    location: "",
    dateTime: "",
    description: "",
    status: "DRAFT",
    createdAt: new Date().toISOString(),
    witnesses: [
      { id: "w1", name: "", position: "", statement: "" },
    ],
  };
}

function verdictColor(v: PhysicsResult["verdict"]) {
  if (v === "POSSIBLE") return "text-teal-300";
  if (v === "UNLIKELY") return "text-amber-400";
  return "text-zinc-400";
}

function TagChip({ tag }: { tag: string }) {
  return (
    <span className="rounded border border-teal-800/60 bg-teal-950/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-teal-300/90">
      {tag}
    </span>
  );
}

export default function Home() {
  const [step, setStep] = useState<AppStep>("INPUT");
  const [caseInput, setCaseInput] = useState<CaseInput>(emptyCase);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [chatInput, setChatInput] = useState("");
  const [chat, setChat] = useState<Array<{ role: "user" | "assistant"; content: string }>>(
    [],
  );
  const [chatBusy, setChatBusy] = useState(false);
  const [generateVideos, setGenerateVideos] = useState(true);

  const formCompletion = useMemo(() => {
    let score = 0;
    if (caseInput.caseName.trim()) score += 20;
    if (caseInput.location.trim()) score += 15;
    if (caseInput.dateTime.trim()) score += 15;
    if (caseInput.description.trim()) score += 20;
    if (caseInput.witnesses.some((w) => w.name && w.statement)) score += 30;
    return score;
  }, [caseInput]);

  function updateWitness(id: string, patch: Partial<Witness>) {
    setCaseInput((c) => ({
      ...c,
      witnesses: c.witnesses.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    }));
  }

  function addWitness() {
    setCaseInput((c) => ({
      ...c,
      witnesses: [
        ...c.witnesses,
        {
          id: `w${c.witnesses.length + 1}`,
          name: "",
          position: "",
          statement: "",
        },
      ],
    }));
  }

  async function loadDemo() {
    const res = await fetch("/api/demo");
    const json = await res.json();
    setCaseInput(json.demo);
    setAnalysis(null);
    setChat([]);
    setError(null);
    setStep("INPUT");
  }

  function runAnalysis(useDemo = false) {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            useDemo,
            case: useDemo ? undefined : caseInput,
            runBaseline: true,
            generateVideos,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Analysis failed");
        setCaseInput(json.case);
        setAnalysis(json.analysis);
        setStep("ANALYSIS");
        setChat([
          {
            role: "assistant",
            content: json.analysis.report.summary,
          },
        ]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Analysis failed");
      }
    });
  }

  async function sendChat() {
    if (!analysis || !chatInput.trim()) return;
    const message = chatInput.trim();
    setChatInput("");
    const nextHistory = [...chat, { role: "user" as const, content: message }];
    setChat(nextHistory);
    setChatBusy(true);
    try {
      const res = await fetch("/api/detective", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId: caseInput.id,
          message,
          history: chat,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Chat failed");
      setChat([...nextHistory, { role: "assistant", content: json.reply }]);
    } catch (e) {
      setChat([
        ...nextHistory,
        {
          role: "assistant",
          content: e instanceof Error ? e.message : "Detective unavailable",
        },
      ]);
    } finally {
      setChatBusy(false);
    }
  }

  function physicsFor(claimId: string) {
    return analysis?.physics.find((p) => p.claimId === claimId);
  }

  function claimsByWitness(witnessId: string): Claim[] {
    return analysis?.claims.filter((c) => c.witnessId === witnessId) ?? [];
  }

  return (
    <div className="min-h-screen bg-[#0b0f12] text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(20,80,80,0.18),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(120,70,20,0.12),_transparent_45%)]" />

      <header className="relative z-10 border-b border-white/5 bg-black/30 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="font-[family-name:var(--font-display)] text-xl tracking-[0.18em] text-teal-200 sm:text-2xl">
              DETECTR
            </p>
            <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">
              AI Forensic Tools · LangGraph Agent Society
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadDemo}
              className="rounded border border-teal-700/50 bg-teal-950/50 px-3 py-1.5 text-xs uppercase tracking-wider text-teal-200 transition hover:border-teal-500 hover:bg-teal-900/40"
            >
              Load Demo
            </button>
            <span className="hidden rounded border border-amber-800/40 bg-amber-950/30 px-2 py-1 text-[10px] uppercase tracking-wider text-amber-300/90 sm:inline">
              {caseInput.status}
            </span>
          </div>
        </div>

        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-3 sm:px-6">
          {STEPS.map((s, i) => {
            const active = step === s;
            const canOpen = s === "INPUT" || Boolean(analysis);
            return (
              <button
                key={s}
                type="button"
                disabled={!canOpen}
                onClick={() => {
                  if (canOpen) setStep(s);
                }}
                className={`flex items-center gap-2 rounded px-3 py-2 text-[11px] uppercase tracking-[0.2em] transition ${
                  active
                    ? "bg-teal-900/50 text-teal-100"
                    : "text-zinc-500 hover:text-zinc-300"
                } ${!canOpen ? "opacity-40" : ""}`}
              >
                <span className="text-zinc-600">{i + 1}</span>
                {s}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {error && (
          <div className="mb-6 rounded border border-amber-700/50 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
            {error}
          </div>
        )}

        {step === "INPUT" && (
          <section className="space-y-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-[family-name:var(--font-display)] text-3xl text-zinc-50 sm:text-4xl">
                  New Investigation
                </h1>
                <p className="mt-1 font-mono text-xs text-zinc-500">{caseInput.id}</p>
              </div>
              <div className="w-full max-w-xs">
                <div className="mb-1 flex justify-between text-[10px] uppercase tracking-wider text-zinc-500">
                  <span>Form Completion</span>
                  <span>{formCompletion}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full bg-gradient-to-r from-teal-700 to-teal-400 transition-all"
                    style={{ width: `${formCompletion}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-4">
                <h2 className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                  Case Information
                </h2>
                <Field
                  label="Case Name"
                  placeholder="e.g., Oak Street Incident"
                  value={caseInput.caseName}
                  onChange={(v) => setCaseInput({ ...caseInput, caseName: v })}
                />
                <Field
                  label="Location"
                  placeholder="e.g., Oak Street & 5th Avenue"
                  value={caseInput.location}
                  onChange={(v) => setCaseInput({ ...caseInput, location: v })}
                />
                <Field
                  label="Date & Time of Incident"
                  placeholder="e.g., December 15, 2024, approximately 9:15 PM"
                  value={caseInput.dateTime}
                  onChange={(v) => setCaseInput({ ...caseInput, dateTime: v })}
                />
                <label className="block space-y-1.5">
                  <span className="text-[11px] uppercase tracking-wider text-zinc-500">
                    Case Description
                  </span>
                  <textarea
                    rows={5}
                    value={caseInput.description}
                    onChange={(e) =>
                      setCaseInput({ ...caseInput, description: e.target.value })
                    }
                    className="w-full resize-y rounded border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 outline-none ring-teal-700/40 placeholder:text-zinc-600 focus:ring-2"
                    placeholder="Summarize the incident under investigation…"
                  />
                </label>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                    Witness Statements
                  </h2>
                  <button
                    type="button"
                    onClick={addWitness}
                    className="text-xs text-teal-400 hover:text-teal-200"
                  >
                    + Add witness
                  </button>
                </div>
                <div className="max-h-[28rem] space-y-4 overflow-y-auto pr-1">
                  {caseInput.witnesses.map((w, idx) => (
                    <div
                      key={w.id}
                      className="space-y-3 border border-white/8 bg-white/[0.02] p-4"
                    >
                      <p className="text-xs uppercase tracking-wider text-amber-500/80">
                        Witness {idx + 1}
                      </p>
                      <Field
                        label="Name"
                        value={w.name}
                        onChange={(v) => updateWitness(w.id, { name: v })}
                      />
                      <Field
                        label="Position / Location"
                        value={w.position}
                        onChange={(v) => updateWitness(w.id, { position: v })}
                      />
                      <label className="block space-y-1.5">
                        <span className="text-[11px] uppercase tracking-wider text-zinc-500">
                          Statement
                        </span>
                        <textarea
                          rows={4}
                          value={w.statement}
                          onChange={(e) =>
                            updateWitness(w.id, { statement: e.target.value })
                          }
                          className="w-full resize-y rounded border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none ring-teal-700/40 focus:ring-2"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 border-t border-white/5 pt-6">
              <label className="flex items-center gap-2 text-xs text-zinc-400">
                <input
                  type="checkbox"
                  checked={generateVideos}
                  onChange={(e) => setGenerateVideos(e.target.checked)}
                  className="accent-teal-500"
                />
                  Generate Wan scene videos (live DashScope only)
              </label>
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => runAnalysis(true)}
                  className="rounded border border-white/15 px-4 py-2 text-xs uppercase tracking-wider text-zinc-300 hover:bg-white/5 disabled:opacity-50"
                >
                  Analyze Demo
                </button>
                <button
                  type="button"
                  disabled={pending || formCompletion < 50}
                  onClick={() => runAnalysis(false)}
                  className="rounded bg-teal-600 px-5 py-2 text-xs uppercase tracking-wider text-white hover:bg-teal-500 disabled:opacity-40"
                >
                  {pending ? "Agents working…" : "Run Agent Society"}
                </button>
              </div>
            </div>
            {pending && (
              <p className="animate-pulse text-sm text-teal-300/80">
                ClaimExtractor → PhysicsValidator → CrossReference → Debate →
                SceneDirector → Visualizer → Detective (LangGraph)…
              </p>
            )}
          </section>
        )}

        {step === "ANALYSIS" && analysis && (
          <section className="space-y-10">
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-3xl">
                Claim Extraction & Physics
              </h1>
              <p className="mt-2 text-sm text-zinc-400">
                {analysis.report.totalClaims} claims from{" "}
                {analysis.report.totalWitnesses} witnesses ·{" "}
                {Object.entries(analysis.report.claimBreakdown)
                  .map(([k, v]) => `${v} ${k}`)
                  .join(", ")}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {analysis.claims.map((claim) => (
                <div
                  key={claim.id}
                  className="border border-white/8 bg-black/30 p-3"
                >
                  <div className="mb-2 flex flex-wrap gap-1">
                    {claim.tags.map((t) => (
                      <TagChip key={t} tag={t} />
                    ))}
                    {Object.entries(claim.metadata).map(([k, v]) =>
                      v ? (
                        <span
                          key={k}
                          className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-400"
                        >
                          {k}: {v}
                        </span>
                      ) : null,
                    )}
                  </div>
                  <p className="text-sm text-zinc-200">{claim.text}</p>
                  <p className="mt-1 text-[11px] text-zinc-500">{claim.witnessName}</p>
                </div>
              ))}
            </div>

            <div>
              <h2 className="mb-4 text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                Physics Validation · Vision Science
              </h2>
              <div className="space-y-8">
                {caseInput.witnesses.map((w) => {
                  const wClaims = claimsByWitness(w.id);
                  if (!wClaims.length) return null;
                  const score = witnessPhysicsScore(w.id, analysis.claims, analysis.physics);
                  return (
                    <div key={w.id}>
                      <div className="mb-2 flex items-baseline justify-between">
                        <h3 className="text-lg text-zinc-100">{w.name}</h3>
                        <p className="font-mono text-sm text-teal-300">
                          Physics Score: {score}%
                        </p>
                      </div>
                      <div className="overflow-x-auto border border-white/8">
                        <table className="w-full min-w-[640px] text-left text-sm">
                          <thead className="bg-white/[0.03] text-[10px] uppercase tracking-wider text-zinc-500">
                            <tr>
                              <th className="px-3 py-2">Claim</th>
                              <th className="px-3 py-2">Verdict</th>
                              <th className="px-3 py-2">Conf.</th>
                              <th className="px-3 py-2">Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {wClaims.map((c) => {
                              const p = physicsFor(c.id);
                              return (
                                <tr key={c.id} className="border-t border-white/5">
                                  <td className="px-3 py-2 text-zinc-300">{c.text}</td>
                                  <td
                                    className={`px-3 py-2 font-mono text-xs ${verdictColor(p?.verdict ?? "UNCERTAIN")}`}
                                  >
                                    {p?.verdict ?? "—"}
                                  </td>
                                  <td className="px-3 py-2 font-mono text-xs text-zinc-400">
                                    {p?.confidence ?? "—"}%
                                  </td>
                                  <td className="px-3 py-2 text-xs text-zinc-400">
                                    {p?.reason}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                Agent Debate
              </h2>
              <div className="space-y-3">
                {analysis.debates.map((d) => (
                  <div
                    key={d.id}
                    className="border border-amber-900/40 bg-amber-950/20 p-4"
                  >
                    <p className="text-sm font-medium text-amber-200">{d.trigger}</p>
                    <p className="mt-2 text-xs text-zinc-400">{d.physicsPosition}</p>
                    <p className="mt-1 text-xs text-zinc-400">{d.detectivePosition}</p>
                    <p className="mt-2 text-xs text-teal-300">{d.resolution}</p>
                  </div>
                ))}
                {!analysis.debates.length && (
                  <p className="text-sm text-zinc-500">No physics conflicts required debate.</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="mb-3 text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                Cross-Reference
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {analysis.crossRef.map((x) => (
                  <div key={x.id} className="border border-white/8 bg-black/30 p-4">
                    <div className="mb-1 flex items-center gap-2">
                      <span
                        className={`text-[10px] uppercase tracking-wider ${
                          x.type === "agreement"
                            ? "text-teal-400"
                            : x.type === "contradiction"
                              ? "text-amber-400"
                              : "text-zinc-400"
                        }`}
                      >
                        {x.type}
                      </span>
                      <span className="text-sm text-zinc-200">{x.topic}</span>
                    </div>
                    <p className="text-xs text-zinc-400">{x.summary}</p>
                    <p className="mt-2 text-[10px] text-zinc-600">
                      {x.witnessNames.join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-white/8 bg-black/20 p-4">
              <h2 className="mb-2 text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                Agent Log
              </h2>
              <ul className="space-y-1 font-mono text-[11px] text-zinc-500">
                {analysis.agentLog.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {step === "VIDEOS" && analysis && (
          <section className="space-y-6">
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-3xl">
                Scene Reconstructions
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                SceneDirector storyboards key beats; Visualizer calls Wan/HappyHorse on
                Alibaba DashScope and optionally stores MP4s on OSS.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {analysis.videos.map((v) => (
                <div key={v.id} className="overflow-hidden border border-white/8 bg-black/40">
                  <div className="aspect-video bg-gradient-to-br from-zinc-900 to-teal-950/40">
                    {v.url ? (
                      <video
                        src={v.url}
                        controls
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-amber-500/80">
                          {v.status}
                        </p>
                        <p className="text-sm text-zinc-300">{v.title}</p>
                        {v.error && (
                          <p className="text-xs text-amber-400">{v.error}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 p-4">
                    <h3 className="text-sm text-zinc-100">{v.title}</h3>
                    <p className="text-xs leading-relaxed text-zinc-500">{v.prompt}</p>
                    {v.error && (
                      <p className="text-xs text-amber-400">{v.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {step === "REPORT" && analysis && (
          <section className="space-y-8">
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-3xl">
                Case Report
              </h1>
              <p className="mt-2 text-sm text-teal-300/90">{analysis.report.summary}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="Witnesses" value={String(analysis.report.totalWitnesses)} />
              <Stat label="Claims" value={String(analysis.report.totalClaims)} />
              <Stat
                label="Physics Flags"
                value={String(analysis.report.physicsFlags)}
              />
            </div>

            <div>
              <h2 className="mb-3 text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                Key Findings
              </h2>
              <ul className="space-y-2">
                {analysis.report.keyFindings.map((f, i) => (
                  <li
                    key={i}
                    className="border-l-2 border-teal-700 pl-3 text-sm text-zinc-300"
                  >
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                Narrative
              </h2>
              <p className="max-w-3xl text-sm leading-relaxed text-zinc-300">
                {analysis.report.narrative}
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-[11px] uppercase tracking-[0.25em] text-zinc-500">
                Agent Society vs Single-Agent Baseline
              </h2>
              <div className="overflow-x-auto border border-white/8">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="bg-white/[0.03] text-[10px] uppercase tracking-wider text-zinc-500">
                    <tr>
                      <th className="px-3 py-2">Metric</th>
                      <th className="px-3 py-2">Multi-Agent</th>
                      <th className="px-3 py-2">Single-Agent</th>
                      <th className="px-3 py-2">Delta</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-xs">
                    {(
                      [
                        ["Claims extracted", "claimsExtracted"],
                        ["Conflicts found", "conflictsFound"],
                        ["Physics flags", "physicsFlags"],
                        ["Agreements found", "agreementsFound"],
                      ] as const
                    ).map(([label, key]) => {
                      const m = analysis.baseline.multi[key];
                      const s = analysis.baseline.single?.[key] ?? 0;
                      return (
                        <tr key={key} className="border-t border-white/5">
                          <td className="px-3 py-2 font-sans text-zinc-400">{label}</td>
                          <td className="px-3 py-2 text-teal-300">{m}</td>
                          <td className="px-3 py-2 text-zinc-500">{s}</td>
                          <td className="px-3 py-2 text-amber-300">
                            {m - s >= 0 ? `+${m - s}` : m - s}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="border-t border-white/5">
                      <td className="px-3 py-2 font-sans text-zinc-400">
                        Wall time (ms)
                      </td>
                      <td className="px-3 py-2 text-teal-300">
                        {analysis.baseline.multi.wallTimeMs}
                      </td>
                      <td className="px-3 py-2 text-zinc-500">
                        {analysis.baseline.single?.wallTimeMs ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-zinc-600">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Track 3 measurable gain: specialized agents recover more claims and
                contradictions than a single monolithic pass on the same case file.
              </p>
            </div>
          </section>
        )}

        {step === "DETECTIVE" && analysis && (
          <section className="mx-auto flex max-w-3xl flex-col gap-4">
            <div>
              <h1 className="font-[family-name:var(--font-display)] text-3xl">
                Detective
              </h1>
              <p className="mt-2 text-sm text-zinc-400">
                Ask about physics flags, conflicts, or how the scene was reconstructed.
              </p>
            </div>
            <div className="flex min-h-[24rem] flex-col gap-3 border border-white/8 bg-black/30 p-4">
              <div className="flex-1 space-y-3 overflow-y-auto">
                {chat.map((m, i) => (
                  <div
                    key={i}
                    className={`max-w-[90%] rounded px-3 py-2 text-sm ${
                      m.role === "user"
                        ? "ml-auto bg-teal-900/40 text-teal-50"
                        : "bg-white/5 text-zinc-300"
                    }`}
                  >
                    {m.content}
                  </div>
                ))}
                {chatBusy && (
                  <p className="animate-pulse text-xs text-zinc-500">Detective is thinking…</p>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendChat()}
                  placeholder="Why was the scar claim flagged unlikely?"
                  className="flex-1 rounded border border-white/10 bg-black/50 px-3 py-2 text-sm outline-none ring-teal-700/40 focus:ring-2"
                />
                <button
                  type="button"
                  disabled={chatBusy || !chatInput.trim()}
                  onClick={sendChat}
                  className="rounded bg-teal-600 px-4 py-2 text-xs uppercase tracking-wider text-white disabled:opacity-40"
                >
                  Ask
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="relative z-10 border-t border-white/5 py-6 text-center text-[10px] uppercase tracking-[0.25em] text-zinc-600">
        Detectr · Next.js + LangChain/LangGraph · Qwen Cloud · Track 3 Agent Society
      </footer>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] uppercase tracking-wider text-zinc-500">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none ring-teal-700/40 placeholder:text-zinc-600 focus:ring-2"
      />
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/8 bg-black/30 p-4">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-1 font-mono text-2xl text-teal-300">{value}</p>
    </div>
  );
}
