"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Input,
  Progress,
  Switch,
  Textarea,
  cn,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import ActionCard from "@/components/action-card";
import CellWrapper from "@/components/cell-wrapper";
import PromptInput from "@/components/prompt-input";
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
    witnesses: [{ id: "w1", name: "", position: "", statement: "" }],
  };
}

function verdictChip(v: PhysicsResult["verdict"]) {
  if (v === "POSSIBLE") return "success" as const;
  if (v === "UNLIKELY") return "warning" as const;
  return "default" as const;
}

export default function Home() {
  const [step, setStep] = useState<AppStep>("INPUT");
  const [caseInput, setCaseInput] = useState<CaseInput>(emptyCase);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [chatInput, setChatInput] = useState("");
  const [chat, setChat] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
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
        setChat([{ role: "assistant", content: json.analysis.report.summary }]);
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
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(15,138,82,0.12),_transparent_55%)]" />

      <div className="relative mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
        {/* Top bar */}
        <Card className="border-small border-default-200 shadow-sm" shadow="sm">
          <CardBody className="flex flex-row items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <div className="flex rounded-medium border border-primary-100 bg-primary-50 p-2">
                <Icon
                  className="text-primary"
                  icon="solar:shield-keyhole-bold-duotone"
                  width={24}
                />
              </div>
              <div>
                <p className="text-medium font-semibold">Detectr</p>
                <p className="text-tiny text-default-400">Witness forensics</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Chip size="sm" variant="flat" color="primary">
                {caseInput.status}
              </Chip>
              <Button
                size="sm"
                variant="bordered"
                radius="full"
                startContent={
                  <Icon icon="solar:play-circle-linear" width={16} />
                }
                onPress={loadDemo}
              >
                Load demo
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Step chips */}
        <div className="flex flex-wrap gap-2">
          {STEPS.map((s) => {
            const canOpen = s === "INPUT" || Boolean(analysis);
            const active = step === s;
            return (
              <Chip
                key={s}
                as="button"
                type="button"
                size="sm"
                variant={active ? "solid" : "flat"}
                color={active ? "primary" : "default"}
                className={cn(!canOpen && "opacity-40")}
                isDisabled={!canOpen}
                onClick={() => canOpen && setStep(s)}
              >
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </Chip>
            );
          })}
        </div>

        {/* Hero */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Make witness stories checkable
          </h1>
          <p className="max-w-xl text-small text-default-500">
            Enter case details, run the agent team, then review physics scores,
            scene videos, and a clear report.
          </p>
        </div>

        {/* 3 ActionCards */}
        <div className="grid gap-3 sm:grid-cols-3">
          <ActionCard
            icon="solar:document-add-bold-duotone"
            title="Build the case"
            description="Names, places, and witness statements."
            color="primary"
            onPress={() => setStep("INPUT")}
          />
          <ActionCard
            icon="solar:atom-bold-duotone"
            title="Run agents"
            description="Claims, physics, and cross-checks."
            color={analysis ? "primary" : undefined}
            onPress={() => (analysis ? setStep("ANALYSIS") : runAnalysis(false))}
          />
          <ActionCard
            icon="solar:chat-round-line-bold-duotone"
            title="Ask detective"
            description="Questions grounded in the case file."
            color={analysis ? "primary" : undefined}
            onPress={() => analysis && setStep("DETECTIVE")}
          />
        </div>

        {/* Error gate */}
        {error && (
          <Card className="border-small border-danger-300 shadow-sm" shadow="sm">
            <CardBody className="flex flex-row items-start gap-3 p-4">
              <div className="flex rounded-medium border border-danger-100 bg-danger-50 p-2">
                <Icon
                  className="text-danger"
                  icon="solar:danger-triangle-bold"
                  width={22}
                />
              </div>
              <div className="flex-1">
                <p className="text-medium">Something went wrong</p>
                <p className="text-small text-danger">{error}</p>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Analyzing gate */}
        {pending && (
          <Card className="border-small border-default-200 shadow-sm" shadow="sm">
            <CardBody className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex rounded-medium border border-primary-100 bg-primary-50 p-2">
                  <Icon
                    className="text-primary"
                    icon="solar:cpu-bolt-bold-duotone"
                    width={22}
                  />
                </div>
                <div>
                  <p className="text-medium">Agents are working</p>
                  <p className="text-small text-default-400">
                    Extracting claims, scoring physics, and drafting the report.
                  </p>
                </div>
              </div>
              <Button color="primary" radius="full" isLoading>
                Running…
              </Button>
            </CardBody>
          </Card>
        )}

        {/* INPUT */}
        {step === "INPUT" && !pending && (
          <>
            <Card className="border-small border-default-200 shadow-sm" shadow="sm">
              <CardHeader className="flex flex-col items-start gap-1 px-4 pb-0 pt-4">
                <div className="flex w-full items-center justify-between gap-3">
                  <div>
                    <p className="text-large font-medium">Case file</p>
                    <p className="font-mono text-tiny text-default-400">
                      {caseInput.id}
                    </p>
                  </div>
                  <div className="w-28">
                    <p className="mb-1 text-right text-tiny text-default-400">
                      {formCompletion}%
                    </p>
                    <Progress
                      aria-label="Form completion"
                      size="sm"
                      color="primary"
                      value={formCompletion}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardBody className="flex flex-col gap-4 p-4">
                <Input
                  label="Case name"
                  placeholder="e.g. Oak Street Incident"
                  variant="bordered"
                  value={caseInput.caseName}
                  onValueChange={(v) =>
                    setCaseInput({ ...caseInput, caseName: v })
                  }
                  startContent={
                    <Icon
                      className="text-default-400"
                      icon="solar:folder-with-files-linear"
                      width={18}
                    />
                  }
                />
                <Input
                  label="Location"
                  placeholder="e.g. Oak Street & 5th Avenue"
                  variant="bordered"
                  value={caseInput.location}
                  onValueChange={(v) =>
                    setCaseInput({ ...caseInput, location: v })
                  }
                  startContent={
                    <Icon
                      className="text-default-400"
                      icon="solar:map-point-linear"
                      width={18}
                    />
                  }
                />
                <Input
                  label="Date and time"
                  placeholder="e.g. December 15, 2024, about 9:15 PM"
                  variant="bordered"
                  value={caseInput.dateTime}
                  onValueChange={(v) =>
                    setCaseInput({ ...caseInput, dateTime: v })
                  }
                  startContent={
                    <Icon
                      className="text-default-400"
                      icon="solar:calendar-linear"
                      width={18}
                    />
                  }
                />
                <Textarea
                  label="Case description"
                  placeholder="What happened, in plain language…"
                  variant="bordered"
                  minRows={3}
                  value={caseInput.description}
                  onValueChange={(v) =>
                    setCaseInput({ ...caseInput, description: v })
                  }
                />
                <CellWrapper>
                  <div>
                    <p>Generate scene videos</p>
                    <p className="text-small text-default-500">
                      Live Wan clips. Leave off for a faster analysis pass.
                    </p>
                  </div>
                  <Switch
                    isSelected={generateVideos}
                    onValueChange={setGenerateVideos}
                    color="primary"
                  />
                </CellWrapper>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    color="primary"
                    radius="full"
                    isDisabled={formCompletion < 50}
                    startContent={
                      <Icon icon="solar:play-bold" width={18} />
                    }
                    onPress={() => runAnalysis(false)}
                  >
                    Run agents
                  </Button>
                  <Button
                    variant="bordered"
                    radius="full"
                    size="sm"
                    startContent={
                      <Icon icon="solar:magic-stick-3-linear" width={16} />
                    }
                    onPress={() => runAnalysis(true)}
                  >
                    Analyze demo
                  </Button>
                </div>
              </CardBody>
            </Card>

            <div className="flex items-center justify-between">
              <p className="text-small text-default-500">Witnesses</p>
              <Button
                size="sm"
                variant="light"
                radius="full"
                startContent={
                  <Icon icon="solar:user-plus-linear" width={16} />
                }
                onPress={addWitness}
              >
                Add witness
              </Button>
            </div>

            {caseInput.witnesses.map((w, idx) => (
              <Card
                key={w.id}
                className="border-small border-default-200 shadow-sm"
                shadow="sm"
              >
                <CardHeader className="flex flex-col items-start px-4 pb-0 pt-4">
                  <p className="text-medium">Witness {idx + 1}</p>
                  <p className="text-small text-default-500">
                    Who they are and what they saw
                  </p>
                </CardHeader>
                <CardBody className="flex flex-col gap-3 p-4">
                  <Input
                    label="Name"
                    variant="bordered"
                    value={w.name}
                    onValueChange={(v) => updateWitness(w.id, { name: v })}
                    startContent={
                      <Icon
                        className="text-default-400"
                        icon="solar:user-linear"
                        width={18}
                      />
                    }
                  />
                  <Input
                    label="Position / location"
                    variant="bordered"
                    value={w.position}
                    onValueChange={(v) =>
                      updateWitness(w.id, { position: v })
                    }
                    startContent={
                      <Icon
                        className="text-default-400"
                        icon="solar:eye-linear"
                        width={18}
                      />
                    }
                  />
                  <Textarea
                    label="Statement"
                    variant="bordered"
                    minRows={3}
                    value={w.statement}
                    onValueChange={(v) =>
                      updateWitness(w.id, { statement: v })
                    }
                  />
                </CardBody>
              </Card>
            ))}
          </>
        )}

        {/* ANALYSIS */}
        {step === "ANALYSIS" && analysis && (
          <>
            <Card className="border-small border-default-200 shadow-sm" shadow="sm">
              <CardHeader className="flex flex-col items-start px-4 pb-0 pt-4">
                <p className="text-large font-medium">Claims</p>
                <p className="text-small text-default-500">
                  {analysis.report.totalClaims} from{" "}
                  {analysis.report.totalWitnesses} witnesses
                </p>
              </CardHeader>
              <CardBody className="grid gap-3 p-4 sm:grid-cols-2">
                {analysis.claims.map((claim) => (
                  <Card
                    key={claim.id}
                    className="border-small border-default-200"
                    shadow="none"
                  >
                    <CardBody className="gap-2 p-3">
                      <div className="flex flex-wrap gap-1">
                        {claim.tags.map((t) => (
                          <Chip key={t} size="sm" variant="flat">
                            {t}
                          </Chip>
                        ))}
                      </div>
                      <p className="text-small">{claim.text}</p>
                      <p className="text-tiny text-default-400">
                        {claim.witnessName}
                      </p>
                    </CardBody>
                  </Card>
                ))}
              </CardBody>
            </Card>

            {caseInput.witnesses.map((w) => {
              const wClaims = claimsByWitness(w.id);
              if (!wClaims.length) return null;
              const score = witnessPhysicsScore(
                w.id,
                analysis.claims,
                analysis.physics,
              );
              return (
                <Card
                  key={w.id}
                  className="border-small border-default-200 shadow-sm"
                  shadow="sm"
                >
                  <CardHeader className="flex flex-row items-center justify-between px-4 pb-0 pt-4">
                    <div>
                      <p className="text-medium">{w.name}</p>
                      <p className="text-small text-default-500">
                        Physics checks
                      </p>
                    </div>
                    <Chip color="primary" variant="flat">
                      {score}%
                    </Chip>
                  </CardHeader>
                  <CardBody className="flex flex-col gap-2 p-4">
                    {wClaims.map((c) => {
                      const p = physicsFor(c.id);
                      return (
                        <CellWrapper key={c.id} className="items-start">
                          <div className="min-w-0 flex-1">
                            <p className="text-small">{c.text}</p>
                            <p className="mt-1 text-tiny text-default-400">
                              {p?.reason}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <Chip
                              size="sm"
                              color={verdictChip(p?.verdict ?? "UNCERTAIN")}
                              variant="flat"
                            >
                              {p?.verdict ?? "—"}
                            </Chip>
                            <p className="font-mono text-tiny text-default-400">
                              {p?.confidence ?? "—"}%
                            </p>
                          </div>
                        </CellWrapper>
                      );
                    })}
                  </CardBody>
                </Card>
              );
            })}

            {analysis.debates.length > 0 && (
              <Card className="border-small border-warning-500 shadow-sm" shadow="sm">
                <CardHeader className="flex flex-col items-start px-4 pb-0 pt-4">
                  <p className="text-large font-medium">Agent debate</p>
                  <p className="text-small text-default-500">
                    Where physics and testimony pull apart
                  </p>
                </CardHeader>
                <CardBody className="flex flex-col gap-3 p-4">
                  {analysis.debates.map((d) => (
                    <CellWrapper key={d.id} className="items-start">
                      <div>
                        <p className="text-small font-medium">{d.trigger}</p>
                        <p className="mt-1 text-tiny text-default-500">
                          {d.physicsPosition}
                        </p>
                        <p className="text-tiny text-default-500">
                          {d.detectivePosition}
                        </p>
                        <p className="mt-2 text-tiny text-primary">
                          {d.resolution}
                        </p>
                      </div>
                    </CellWrapper>
                  ))}
                </CardBody>
              </Card>
            )}

            <Card className="border-small border-default-200 shadow-sm" shadow="sm">
              <CardHeader className="flex flex-col items-start px-4 pb-0 pt-4">
                <p className="text-large font-medium">Cross-reference</p>
                <p className="text-small text-default-500">
                  Agreements, conflicts, and one-off details
                </p>
              </CardHeader>
              <CardBody className="grid gap-3 p-4 sm:grid-cols-2">
                {analysis.crossRef.map((x) => (
                  <ActionCard
                    key={x.id}
                    isPressable={false}
                    icon={
                      x.type === "agreement"
                        ? "solar:check-circle-bold-duotone"
                        : x.type === "contradiction"
                          ? "solar:danger-triangle-bold-duotone"
                          : "solar:star-bold-duotone"
                    }
                    color={
                      x.type === "agreement"
                        ? "primary"
                        : x.type === "contradiction"
                          ? "warning"
                          : undefined
                    }
                    title={x.topic}
                    description={`${x.summary} · ${x.witnessNames.join(", ")}`}
                  />
                ))}
              </CardBody>
            </Card>
          </>
        )}

        {/* VIDEOS */}
        {step === "VIDEOS" && analysis && (
          <>
            <div>
              <h2 className="text-large font-medium">Scene reconstructions</h2>
              <p className="text-small text-default-500">
                Live clips from the storyboard
              </p>
            </div>
            {analysis.videos.length === 0 ? (
              <Card className="border-dashed border-default-200 shadow-none">
                <CardBody className="flex flex-col items-center gap-2 py-10 text-center">
                  <Icon
                    className="text-default-300"
                    icon="solar:videocamera-record-bold-duotone"
                    width={40}
                  />
                  <p className="text-small text-default-500">
                    No videos for this run. Turn on scene videos and analyze again.
                  </p>
                </CardBody>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {analysis.videos.map((v) => (
                  <Card
                    key={v.id}
                    className="overflow-hidden border-small border-default-200 shadow-sm"
                    shadow="sm"
                  >
                    <div className="aspect-video bg-default-100">
                      {v.url ? (
                        <video
                          src={v.url}
                          controls
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2 p-4">
                          <Chip size="sm" variant="flat">
                            {v.status}
                          </Chip>
                          <p className="text-center text-small">{v.title}</p>
                        </div>
                      )}
                    </div>
                    <CardBody className="gap-1 p-4">
                      <p className="text-medium">{v.title}</p>
                      <p className="text-tiny text-default-400">{v.prompt}</p>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* REPORT */}
        {step === "REPORT" && analysis && (
          <>
            <Card className="border-small border-default-200 shadow-sm" shadow="sm">
              <CardHeader className="flex flex-col items-start px-4 pb-0 pt-4">
                <p className="text-large font-medium">Case report</p>
                <p className="text-small text-default-500">
                  {analysis.report.summary}
                </p>
              </CardHeader>
              <CardBody className="grid gap-3 p-4 sm:grid-cols-3">
                {[
                  ["Witnesses", analysis.report.totalWitnesses],
                  ["Claims", analysis.report.totalClaims],
                  ["Physics flags", analysis.report.physicsFlags],
                ].map(([label, value]) => (
                  <CellWrapper key={String(label)} className="flex-col items-start">
                    <p className="text-tiny text-default-400">{label}</p>
                    <p className="font-mono text-2xl text-primary">{value}</p>
                  </CellWrapper>
                ))}
              </CardBody>
            </Card>

            <Card className="border-small border-default-200 shadow-sm" shadow="sm">
              <CardHeader className="flex flex-col items-start px-4 pb-0 pt-4">
                <p className="text-large font-medium">Key findings</p>
              </CardHeader>
              <CardBody className="flex flex-col gap-2 p-4">
                {analysis.report.keyFindings.map((f, i) => (
                  <CellWrapper key={i} className="items-start">
                    <p className="text-small">{f}</p>
                  </CellWrapper>
                ))}
              </CardBody>
            </Card>

            <Card className="border-small border-default-200 shadow-sm" shadow="sm">
              <CardHeader className="flex flex-col items-start px-4 pb-0 pt-4">
                <p className="text-large font-medium">Narrative</p>
              </CardHeader>
              <CardBody className="p-4">
                <p className="text-small leading-relaxed text-default-600">
                  {analysis.report.narrative}
                </p>
              </CardBody>
            </Card>

            <Card className="border-small border-default-200 shadow-sm" shadow="sm">
              <CardHeader className="flex flex-col items-start px-4 pb-0 pt-4">
                <p className="text-large font-medium">Agent team vs one model</p>
                <p className="text-small text-default-500">
                  Same case, two approaches
                </p>
              </CardHeader>
              <CardBody className="flex flex-col gap-2 p-4">
                {(
                  [
                    ["Claims", "claimsExtracted"],
                    ["Conflicts", "conflictsFound"],
                    ["Physics flags", "physicsFlags"],
                    ["Agreements", "agreementsFound"],
                  ] as const
                ).map(([label, key]) => {
                  const m = analysis.baseline.multi[key];
                  const s = analysis.baseline.single?.[key] ?? 0;
                  return (
                    <CellWrapper key={key}>
                      <p className="text-small">{label}</p>
                      <div className="flex items-center gap-3 font-mono text-tiny">
                        <span className="text-primary">Team {m}</span>
                        <span className="text-default-400">Solo {s}</span>
                        <Chip size="sm" variant="flat" color="warning">
                          {m - s >= 0 ? `+${m - s}` : m - s}
                        </Chip>
                      </div>
                    </CellWrapper>
                  );
                })}
              </CardBody>
            </Card>
          </>
        )}

        {/* DETECTIVE */}
        {step === "DETECTIVE" && analysis && (
          <Card className="border-small border-default-200 shadow-sm" shadow="sm">
            <CardHeader className="flex flex-col items-start px-4 pb-0 pt-4">
              <p className="text-large font-medium">Detective</p>
              <p className="text-small text-default-500">
                Ask about flags, conflicts, or what the scene shows
              </p>
            </CardHeader>
            <CardBody className="flex flex-col gap-4 p-4">
              <div className="flex max-h-80 flex-col gap-3 overflow-y-auto">
                {chat.map((m, i) => (
                  <div
                    key={i}
                    className={cn(
                      "max-w-[90%] rounded-large px-3 py-2 text-small",
                      m.role === "user"
                        ? "ml-auto bg-primary text-primary-foreground"
                        : "bg-content2 text-default-700",
                    )}
                  >
                    {m.content}
                  </div>
                ))}
                {chatBusy && (
                  <p className="text-tiny text-default-400">Thinking…</p>
                )}
              </div>
              <div className="flex items-end gap-2">
                <PromptInput
                  value={chatInput}
                  onValueChange={setChatInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void sendChat();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  isIconOnly
                  color="primary"
                  radius="full"
                  isDisabled={chatBusy || !chatInput.trim()}
                  aria-label="Send"
                  onPress={sendChat}
                >
                  <Icon icon="solar:arrow-up-bold" width={18} />
                </Button>
              </div>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
