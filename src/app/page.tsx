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

const STEP_LABEL: Record<AppStep, string> = {
  INPUT: "Case",
  ANALYSIS: "Checks",
  VIDEOS: "Scenes",
  REPORT: "Summary",
  DETECTIVE: "Ask",
};

function statusLabel(status: CaseInput["status"]) {
  if (status === "DRAFT") return "Draft";
  if (status === "ANALYZING") return "Working";
  return "Ready";
}

function verdictLabel(v: PhysicsResult["verdict"]) {
  if (v === "POSSIBLE") return "Likely";
  if (v === "UNLIKELY") return "Unlikely";
  return "Unclear";
}

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
    <div className="relative min-h-screen overflow-x-hidden bg-[#F4F4F5]">
      <div className="relative mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
        {/* Top bar */}
        <Card className="border-small border-default-200 bg-white shadow-sm" shadow="sm">
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
                <p className="text-tiny text-default-400">
                  Clearer cases from messy testimony
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Chip size="sm" variant="flat" color="primary">
                {statusLabel(caseInput.status)}
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
                Try a sample case
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
                {STEP_LABEL[s]}
              </Chip>
            );
          })}
        </div>

        {/* Hero */}
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            See what holds up and what the scene looked like
          </h1>
          <p className="max-w-xl text-small text-default-500">
            Put in what people said. Detectr shows what is believable, where
            stories clash, and a short video of the night.
          </p>
        </div>

        {/* 3 ActionCards */}
        <div className="grid gap-3 sm:grid-cols-3">
          <ActionCard
            icon="solar:document-add-bold-duotone"
            title="Add the facts"
            description="Who was there, where, and what they said."
            color="primary"
            onPress={() => setStep("INPUT")}
          />
          <ActionCard
            icon="solar:magnifer-bold-duotone"
            title="Find what matters"
            description="Spot weak details and matching stories."
            color={analysis ? "primary" : undefined}
            onPress={() => (analysis ? setStep("ANALYSIS") : runAnalysis(false))}
          />
          <ActionCard
            icon="solar:chat-round-line-bold-duotone"
            title="Ask follow-ups"
            description="Get plain answers about the case."
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
                  <p className="text-medium">Reviewing the testimony</p>
                  <p className="text-small text-default-400">
                    Checking each detail, comparing witnesses, and writing a
                    clear summary.
                  </p>
                </div>
              </div>
              <Button color="primary" radius="full" isLoading>
                Working…
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
                    <p className="text-large font-medium">What happened</p>
                    <p className="text-tiny text-default-400">
                      Start here, or open a sample case
                    </p>
                  </div>
                  <div className="w-28">
                    <p className="mb-1 text-right text-tiny text-default-400">
                      {formCompletion}% ready
                    </p>
                    <Progress
                      aria-label="How complete the case is"
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
                  classNames={{ inputWrapper: "bg-white" }}
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
                  label="Where"
                  placeholder="e.g. Oak Street & 5th Avenue"
                  variant="bordered"
                  classNames={{ inputWrapper: "bg-white" }}
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
                  label="When"
                  placeholder="e.g. December 15, 2024, about 9:15 PM"
                  variant="bordered"
                  classNames={{ inputWrapper: "bg-white" }}
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
                  label="In your own words"
                  placeholder="What happened that night…"
                  variant="bordered"
                  classNames={{ inputWrapper: "bg-white" }}
                  minRows={3}
                  value={caseInput.description}
                  onValueChange={(v) =>
                    setCaseInput({ ...caseInput, description: v })
                  }
                />
                <CellWrapper className="bg-white">
                  <div>
                    <p>Show the scene as video</p>
                    <p className="text-small text-default-500">
                      Short clips so a jury can picture it. Takes longer.
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
                    Review this case
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
                    Review sample case
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
                <p className="text-large font-medium">What people said</p>
                <p className="text-small text-default-500">
                  {analysis.report.totalClaims} details from{" "}
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
                        Could they really see or hear this?
                      </p>
                    </div>
                    <Chip color="primary" variant="flat">
                      {score}% solid
                    </Chip>
                  </CardHeader>
                  <CardBody className="flex flex-col gap-2 p-4">
                    {wClaims.map((c) => {
                      const p = physicsFor(c.id);
                      return (
                        <CellWrapper key={c.id} className="items-start bg-white">
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
                              {p ? verdictLabel(p.verdict) : "—"}
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
                  <p className="text-large font-medium">Where stories strain</p>
                  <p className="text-small text-default-500">
                    Details that are hard to believe at that distance or light
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
                <p className="text-large font-medium">Do their stories match?</p>
                <p className="text-small text-default-500">
                  What everyone agrees on, and what only one person claims
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
              <h2 className="text-large font-medium">See the night play out</h2>
              <p className="text-small text-default-500">
                Short clips so you can picture what witnesses described
              </p>
            </div>
            {analysis.videos.length === 0 ? (
              <Card className="border-dashed border-default-200 bg-white shadow-none">
                <CardBody className="flex flex-col items-center gap-2 py-10 text-center">
                  <Icon
                    className="text-default-300"
                    icon="solar:videocamera-record-bold-duotone"
                    width={40}
                  />
                  <p className="text-small text-default-500">
                    No clips yet. Turn on “Show the scene as video” and review
                    again.
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
                <p className="text-large font-medium">What we found</p>
                <p className="text-small text-default-500">
                  {analysis.report.summary}
                </p>
              </CardHeader>
              <CardBody className="grid gap-3 p-4 sm:grid-cols-3">
                {[
                  ["People heard from", analysis.report.totalWitnesses],
                  ["Details checked", analysis.report.totalClaims],
                  ["Hard to believe", analysis.report.physicsFlags],
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
                <p className="text-large font-medium">The takeaways</p>
              </CardHeader>
              <CardBody className="flex flex-col gap-2 p-4">
                {analysis.report.keyFindings.map((f, i) => (
                  <CellWrapper key={i} className="items-start bg-white">
                    <p className="text-small">{f}</p>
                  </CellWrapper>
                ))}
              </CardBody>
            </Card>

            <Card className="border-small border-default-200 bg-white shadow-sm" shadow="sm">
              <CardHeader className="flex flex-col items-start px-4 pb-0 pt-4">
                <p className="text-large font-medium">The story in full</p>
              </CardHeader>
              <CardBody className="p-4">
                <p className="text-small leading-relaxed text-default-600">
                  {analysis.report.narrative}
                </p>
              </CardBody>
            </Card>

            <Card className="border-small border-default-200 bg-white shadow-sm" shadow="sm">
              <CardHeader className="flex flex-col items-start px-4 pb-0 pt-4">
                <p className="text-large font-medium">Why a full review helps</p>
                <p className="text-small text-default-500">
                  Same case: careful review vs a quick skim
                </p>
              </CardHeader>
              <CardBody className="flex flex-col gap-2 p-4">
                {(
                  [
                    ["Details found", "claimsExtracted"],
                    ["Conflicts found", "conflictsFound"],
                    ["Hard-to-believe spots", "physicsFlags"],
                    ["Matching points", "agreementsFound"],
                  ] as const
                ).map(([label, key]) => {
                  const m = analysis.baseline.multi[key];
                  const s = analysis.baseline.single?.[key] ?? 0;
                  return (
                    <CellWrapper key={key} className="bg-white">
                      <p className="text-small">{label}</p>
                      <div className="flex items-center gap-3 font-mono text-tiny">
                        <span className="text-primary">Full {m}</span>
                        <span className="text-default-400">Quick {s}</span>
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
              <p className="text-large font-medium">Ask about the case</p>
              <p className="text-small text-default-500">
                Why a detail looks weak, or what everyone agreed on
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
