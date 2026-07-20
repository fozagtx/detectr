"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Input,
  ScrollShadow,
  Switch,
  Textarea,
  cn,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import ActionCard from "@/components/action-card";
import { BrandMark } from "@/components/brand-mark";
import { DetailCard, EmptyState } from "@/components/detail-card";
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

const NAV: { id: AppStep; label: string; icon: string }[] = [
  { id: "INPUT", label: "Case", icon: "solar:document-add-bold-duotone" },
  { id: "ANALYSIS", label: "Checks", icon: "solar:magnifer-bold-duotone" },
  { id: "VIDEOS", label: "Scenes", icon: "solar:videocamera-record-bold-duotone" },
  { id: "REPORT", label: "Summary", icon: "solar:clipboard-check-bold-duotone" },
  { id: "DETECTIVE", label: "Ask", icon: "solar:chat-round-line-bold-duotone" },
];

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

function verdictLabel(v: PhysicsResult["verdict"]) {
  if (v === "POSSIBLE") return "Likely";
  if (v === "UNLIKELY") return "Unlikely";
  return "Unclear";
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const inApp = Boolean(analysis) || pending;

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

  function go(next: AppStep) {
    if (next !== "INPUT" && !analysis && !pending) return;
    setStep(next);
    setMobileOpen(false);
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
        if (!res.ok) throw new Error(json.error || "Could not review this case");
        setCaseInput(json.case);
        setAnalysis(json.analysis);
        setStep("ANALYSIS");
        setChat([{ role: "assistant", content: json.analysis.report.summary }]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not review this case");
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
      if (!res.ok) throw new Error(json.error || "Could not answer");
      setChat([...nextHistory, { role: "assistant", content: json.reply }]);
    } catch (e) {
      setChat([
        ...nextHistory,
        {
          role: "assistant",
          content: e instanceof Error ? e.message : "Could not answer",
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

  const pageTitle =
    NAV.find((n) => n.id === step)?.label ?? "Detectr";
  const pageSub = pending
    ? "Reviewing testimony…"
    : analysis
      ? caseInput.caseName || "Open case"
      : "Build a case to begin";

  // ——— Landing (GhostKeys LandingPage quality) ———
  if (!inApp) {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-10 bg-background px-4 py-6 sm:px-6 sm:py-10">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-large border border-default-200 bg-content1 px-4 py-3 shadow-small">
          <div className="flex items-center gap-3">
            <BrandMark size={40} framed />
            <p className="text-medium font-semibold text-default-900">Detectr</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="bordered"
              radius="full"
              startContent={
                <Icon icon="solar:play-circle-linear" width={16} />
              }
              onPress={loadDemo}
            >
              Try sample case
            </Button>
            <Button
              color="primary"
              radius="full"
              size="sm"
              startContent={<Icon icon="solar:play-bold" width={16} />}
              onPress={() => runAnalysis(true)}
            >
              See it work
            </Button>
          </div>
        </header>

        <section className="flex flex-col gap-8 rounded-large border border-default-200 bg-content1 px-6 py-10 shadow-small sm:px-10 sm:py-14">
          <div className="flex flex-wrap gap-2">
            <Chip size="sm" color="primary" variant="flat">
              For investigators
            </Chip>
            <Chip size="sm" variant="flat">
              Witness statements
            </Chip>
            <Chip size="sm" variant="flat">
              Scene videos
            </Chip>
          </div>
          <div className="flex max-w-xl flex-col gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-default-900 sm:text-4xl sm:leading-[1.15]">
              when four people tell four different nights
            </h1>
            <p className="text-medium leading-relaxed text-default-500">
              Detectr shows what holds up, where stories clash, and how the
              scene likely looked — so a jury can actually follow along.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              color="primary"
              radius="full"
              size="lg"
              startContent={
                <Icon icon="solar:document-add-bold" width={20} />
              }
              onPress={() => {
                document
                  .getElementById("case-form")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Start a case
            </Button>
            <Button
              variant="bordered"
              radius="full"
              size="lg"
              startContent={
                <Icon icon="solar:magic-stick-3-linear" width={18} />
              }
              onPress={() => runAnalysis(true)}
            >
              Review sample case
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div>
            <p className="text-large font-medium text-default-900">
              Why Detectr
            </p>
            <p className="text-small text-default-500">
              From messy statements to a picture you can show people.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <ActionCard
              color="primary"
              icon="solar:document-add-bold-duotone"
              title="Gather what was said"
              description="Case facts and every witness statement in one place."
            />
            <ActionCard
              color="secondary"
              icon="solar:magnifer-bold-duotone"
              title="See what holds up"
              description="Spot weak details and stories that do not match."
            />
            <ActionCard
              icon="solar:videocamera-record-bold-duotone"
              title="Show the scene"
              description="Short clips so everyone can picture that night."
            />
          </div>
        </section>

        {error && (
          <Card className="border-small border-danger-300" shadow="sm">
            <CardBody className="flex flex-row items-start gap-3 p-4">
              <Icon
                className="shrink-0 text-danger"
                icon="solar:danger-circle-bold"
                width={22}
              />
              <p className="text-small text-danger">{error}</p>
            </CardBody>
          </Card>
        )}

        <section id="case-form" className="flex flex-col gap-4">
          <div>
            <p className="text-large font-medium text-default-900">
              Build your case
            </p>
            <p className="text-small text-default-500">
              Fill this in, or open the sample and hit review.
            </p>
          </div>

          <Card className="border-small border-default-200" shadow="sm">
            <CardHeader className="flex flex-col items-start gap-1 px-5 pb-0 pt-5 sm:px-6 sm:pt-6">
              <p className="text-large font-medium">What happened</p>
              <p className="text-small text-default-500">
                {formCompletion}% ready
              </p>
            </CardHeader>
            <CardBody className="flex flex-col gap-4 px-5 pb-5 sm:px-6 sm:pb-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Case name"
                  placeholder="e.g. Oak Street Incident"
                  variant="bordered"
                  value={caseInput.caseName}
                  onValueChange={(v) =>
                    setCaseInput({ ...caseInput, caseName: v })
                  }
                />
                <Input
                  label="Where"
                  placeholder="e.g. Oak Street & 5th Avenue"
                  variant="bordered"
                  value={caseInput.location}
                  onValueChange={(v) =>
                    setCaseInput({ ...caseInput, location: v })
                  }
                />
              </div>
              <Input
                label="When"
                placeholder="e.g. December 15, 2024, about 9:15 PM"
                variant="bordered"
                value={caseInput.dateTime}
                onValueChange={(v) =>
                  setCaseInput({ ...caseInput, dateTime: v })
                }
              />
              <Textarea
                label="In your own words"
                placeholder="What happened that night…"
                variant="bordered"
                minRows={3}
                value={caseInput.description}
                onValueChange={(v) =>
                  setCaseInput({ ...caseInput, description: v })
                }
              />
              <div className="flex items-center justify-between rounded-medium border border-default-200 bg-default-50 px-4 py-3">
                <div>
                  <p className="text-small font-medium">Show the scene as video</p>
                  <p className="text-tiny text-default-500">
                    Short clips for a jury. Takes longer.
                  </p>
                </div>
                <Switch
                  isSelected={generateVideos}
                  onValueChange={setGenerateVideos}
                  color="primary"
                />
              </div>
              <Button
                color="primary"
                radius="full"
                className="w-full sm:w-auto sm:self-end"
                isDisabled={formCompletion < 50}
                startContent={<Icon icon="solar:play-bold" width={18} />}
                onPress={() => runAnalysis(false)}
              >
                Review this case
              </Button>
            </CardBody>
          </Card>

          <div className="flex items-center justify-between">
            <p className="text-medium font-medium text-default-900">Witnesses</p>
            <Button
              size="sm"
              variant="light"
              radius="full"
              startContent={<Icon icon="solar:user-plus-linear" width={16} />}
              onPress={addWitness}
            >
              Add witness
            </Button>
          </div>

          {caseInput.witnesses.map((w, idx) => (
            <Card
              key={w.id}
              className="border-small border-default-200"
              shadow="sm"
            >
              <CardHeader className="flex flex-col items-start gap-1 px-5 pb-0 pt-5">
                <p className="text-medium font-medium">Witness {idx + 1}</p>
                <p className="text-small text-default-500">
                  Who they are and what they saw
                </p>
              </CardHeader>
              <CardBody className="flex flex-col gap-3 px-5 pb-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Name"
                    variant="bordered"
                    value={w.name}
                    onValueChange={(v) => updateWitness(w.id, { name: v })}
                  />
                  <Input
                    label="Where they stood"
                    variant="bordered"
                    value={w.position}
                    onValueChange={(v) =>
                      updateWitness(w.id, { position: v })
                    }
                  />
                </div>
                <Textarea
                  label="What they said"
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
        </section>
      </div>
    );
  }

  // ——— App shell (GhostKeys VaultApp quality) ———
  const sidebarBody = (
    <>
      <div className="flex shrink-0 items-center gap-2.5">
        <BrandMark size={36} framed />
        <div className="min-w-0">
          <p className="truncate text-medium font-semibold text-default-900">
            Detectr
          </p>
          <p className="truncate text-tiny text-default-400">
            {caseInput.caseName || "Open case"}
          </p>
        </div>
      </div>

      <nav className="mt-6 flex flex-col gap-1" aria-label="Detectr">
        {NAV.map((item) => {
          const active = step === item.id;
          const locked = item.id !== "INPUT" && !analysis;
          return (
            <button
              key={item.id}
              type="button"
              disabled={locked}
              onClick={() => go(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-medium px-3 py-2.5 text-left text-small font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground shadow-small"
                  : "text-default-600 hover:bg-default-100",
                locked && "cursor-not-allowed opacity-40",
              )}
            >
              <Icon icon={item.icon} width={20} className="shrink-0" />
              <span className="min-w-0 flex-1">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto flex shrink-0 flex-col gap-2 border-t border-default-200 pt-4">
        <Button
          size="sm"
          radius="full"
          variant="bordered"
          startContent={<Icon icon="solar:refresh-linear" width={16} />}
          onPress={loadDemo}
        >
          Sample case
        </Button>
        <Button
          size="sm"
          radius="full"
          variant="flat"
          startContent={<Icon icon="solar:add-circle-linear" width={16} />}
          onPress={() => {
            setAnalysis(null);
            setCaseInput(emptyCase());
            setChat([]);
            setStep("INPUT");
          }}
        >
          New case
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      <aside className="hidden h-full w-56 shrink-0 flex-col border-r border-default-200 bg-content1 md:flex lg:w-60">
        <div className="flex h-full min-h-0 flex-col p-4">{sidebarBody}</div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(16rem,88vw)] flex-col border-r border-default-200 bg-content1 shadow-large">
            <div className="flex items-center justify-between border-b border-default-200 px-3 py-3">
              <div className="flex items-center gap-2">
                <BrandMark size={28} framed />
                <span className="text-small font-semibold">Detectr</span>
              </div>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                radius="full"
                aria-label="Close"
                onPress={() => setMobileOpen(false)}
              >
                <Icon icon="solar:close-circle-linear" width={20} />
              </Button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
              {sidebarBody}
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center gap-3 border-b border-default-200 bg-content1 px-3 py-3 sm:px-5">
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            radius="full"
            className="shrink-0 md:hidden"
            aria-label="Open menu"
            onPress={() => setMobileOpen(true)}
          >
            <Icon icon="solar:hamburger-menu-linear" width={20} />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-medium font-semibold text-default-900 sm:text-large">
              {pageTitle}
            </h1>
            <p className="truncate text-tiny text-default-500">{pageSub}</p>
          </div>
          {pending && (
            <Chip size="sm" color="primary" variant="flat" className="shrink-0">
              Working
            </Chip>
          )}
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-5 sm:px-6 sm:py-7">
            {error && (
              <Card className="border-small border-danger-300" shadow="sm">
                <CardBody className="flex flex-row items-start gap-3 p-4">
                  <Icon
                    className="shrink-0 text-danger"
                    icon="solar:danger-circle-bold"
                    width={22}
                  />
                  <p className="text-small text-danger">{error}</p>
                </CardBody>
              </Card>
            )}

            {pending && (
              <Card className="border-small border-default-200" shadow="sm">
                <CardBody className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex rounded-medium border border-primary-100 bg-primary-50 p-2">
                      <Icon
                        className="text-primary"
                        icon="solar:hourglass-bold-duotone"
                        width={22}
                      />
                    </div>
                    <div>
                      <p className="text-medium font-medium">
                        Reviewing the testimony
                      </p>
                      <p className="text-small text-default-500">
                        Checking details, comparing people, writing a clear
                        summary.
                      </p>
                    </div>
                  </div>
                  <Button color="primary" radius="full" isLoading>
                    Working…
                  </Button>
                </CardBody>
              </Card>
            )}

            {step === "INPUT" && !pending && (
              <>
                <Card className="border-small border-default-200" shadow="sm">
                  <CardHeader className="flex flex-col items-start gap-1 px-5 pb-0 pt-5">
                    <p className="text-large font-medium">Case details</p>
                    <p className="text-small text-default-500">
                      Edit and run again anytime
                    </p>
                  </CardHeader>
                  <CardBody className="flex flex-col gap-4 px-5 pb-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Input
                        label="Case name"
                        variant="bordered"
                        value={caseInput.caseName}
                        onValueChange={(v) =>
                          setCaseInput({ ...caseInput, caseName: v })
                        }
                      />
                      <Input
                        label="Where"
                        variant="bordered"
                        value={caseInput.location}
                        onValueChange={(v) =>
                          setCaseInput({ ...caseInput, location: v })
                        }
                      />
                    </div>
                    <Input
                      label="When"
                      variant="bordered"
                      value={caseInput.dateTime}
                      onValueChange={(v) =>
                        setCaseInput({ ...caseInput, dateTime: v })
                      }
                    />
                    <Textarea
                      label="In your own words"
                      variant="bordered"
                      minRows={3}
                      value={caseInput.description}
                      onValueChange={(v) =>
                        setCaseInput({ ...caseInput, description: v })
                      }
                    />
                    <Button
                      color="primary"
                      radius="full"
                      className="sm:self-end"
                      startContent={
                        <Icon icon="solar:play-bold" width={18} />
                      }
                      onPress={() => runAnalysis(false)}
                    >
                      Review again
                    </Button>
                  </CardBody>
                </Card>
                {caseInput.witnesses.map((w, idx) => (
                  <DetailCard
                    key={w.id}
                    title={w.name || `Witness ${idx + 1}`}
                    subtitle={w.position || "No location set"}
                    body={w.statement || "No statement yet"}
                  />
                ))}
              </>
            )}

            {step === "ANALYSIS" && analysis && (
              <>
                <div>
                  <p className="text-large font-medium text-default-900">
                    What people said
                  </p>
                  <p className="text-small text-default-500">
                    {analysis.report.totalClaims} details from{" "}
                    {analysis.report.totalWitnesses} witnesses
                  </p>
                </div>
                {analysis.claims.map((claim) => {
                  const p = physicsFor(claim.id);
                  return (
                    <DetailCard
                      key={claim.id}
                      title={claim.text}
                      subtitle={claim.witnessName}
                      tags={claim.tags}
                      metric={p ? verdictLabel(p.verdict) : undefined}
                      metricLabel={p ? `${p.confidence}% sure` : undefined}
                      body={p?.reason}
                    />
                  );
                })}

                {caseInput.witnesses.map((w) => {
                  const score = witnessPhysicsScore(
                    w.id,
                    analysis.claims,
                    analysis.physics,
                  );
                  if (!claimsByWitness(w.id).length) return null;
                  return (
                    <DetailCard
                      key={`score-${w.id}`}
                      title={w.name}
                      subtitle="How solid is their account overall?"
                      metric={`${score}%`}
                      metricLabel="solid"
                      progress={score}
                    />
                  );
                })}

                {analysis.debates.length > 0 && (
                  <>
                    <div>
                      <p className="text-large font-medium text-default-900">
                        Where stories strain
                      </p>
                      <p className="text-small text-default-500">
                        Hard to believe at that distance or light
                      </p>
                    </div>
                    {analysis.debates.map((d) => (
                      <Card
                        key={d.id}
                        className="border-small border-warning-500"
                        shadow="sm"
                      >
                        <CardBody className="gap-2 p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex rounded-medium border border-warning-100 bg-warning-50 p-2">
                              <Icon
                                className="text-warning-600"
                                icon="solar:danger-triangle-bold"
                                width={20}
                              />
                            </div>
                            <div>
                              <p className="text-medium font-medium">
                                {d.trigger}
                              </p>
                              <p className="mt-1 text-small text-default-500">
                                {d.resolution}
                              </p>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </>
                )}

                <div>
                  <p className="text-large font-medium text-default-900">
                    Do their stories match?
                  </p>
                  <p className="text-small text-default-500">
                    Agreements and one-off claims
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {analysis.crossRef.map((x) => (
                    <ActionCard
                      key={x.id}
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
                </div>
              </>
            )}

            {step === "VIDEOS" && analysis && (
              <>
                <div>
                  <p className="text-large font-medium text-default-900">
                    See the night play out
                  </p>
                  <p className="text-small text-default-500">
                    Short clips from what witnesses described
                  </p>
                </div>
                {analysis.videos.length === 0 ? (
                  <EmptyState
                    title="No clips yet"
                    body="Turn on scene video when you review a case."
                    icon="solar:videocamera-record-bold-duotone"
                    actionLabel="Back to case"
                    onAction={() => go("INPUT")}
                  />
                ) : (
                  analysis.videos.map((v) => (
                    <Card
                      key={v.id}
                      className="overflow-hidden border-small border-default-200"
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
                          <div className="flex h-full items-center justify-center">
                            <Chip size="sm" variant="flat">
                              {v.status}
                            </Chip>
                          </div>
                        )}
                      </div>
                      <CardBody className="gap-1 p-4">
                        <p className="text-medium font-medium">{v.title}</p>
                        <p className="text-tiny text-default-400">{v.prompt}</p>
                      </CardBody>
                    </Card>
                  ))
                )}
              </>
            )}

            {step === "REPORT" && analysis && (
              <>
                <Card className="border-small border-default-200" shadow="sm">
                  <CardHeader className="flex flex-col items-start gap-1 px-5 pb-0 pt-5">
                    <p className="text-large font-medium">What we found</p>
                    <p className="text-small text-default-500">
                      {analysis.report.summary}
                    </p>
                  </CardHeader>
                  <CardBody className="grid gap-3 px-5 pb-5 sm:grid-cols-3">
                    {[
                      ["People", analysis.report.totalWitnesses],
                      ["Details", analysis.report.totalClaims],
                      ["Hard to believe", analysis.report.physicsFlags],
                    ].map(([label, value]) => (
                      <div
                        key={String(label)}
                        className="rounded-medium border border-default-200 bg-default-50 p-3"
                      >
                        <p className="text-tiny text-default-400">{label}</p>
                        <p className="font-mono text-2xl text-primary">
                          {value}
                        </p>
                      </div>
                    ))}
                  </CardBody>
                </Card>

                <div>
                  <p className="text-large font-medium text-default-900">
                    The takeaways
                  </p>
                </div>
                {analysis.report.keyFindings.map((f, i) => (
                  <DetailCard key={i} title={f} />
                ))}

                <Card className="border-small border-default-200" shadow="sm">
                  <CardHeader className="flex flex-col items-start gap-1 px-5 pb-0 pt-5">
                    <p className="text-large font-medium">The story in full</p>
                  </CardHeader>
                  <CardBody className="px-5 pb-5">
                    <p className="text-small leading-relaxed text-default-600">
                      {analysis.report.narrative}
                    </p>
                  </CardBody>
                </Card>

                <Card className="border-small border-default-200" shadow="sm">
                  <CardHeader className="flex flex-col items-start gap-1 px-5 pb-0 pt-5">
                    <p className="text-large font-medium">
                      Why a full review helps
                    </p>
                    <p className="text-small text-default-500">
                      Careful review vs a quick skim
                    </p>
                  </CardHeader>
                  <CardBody className="flex flex-col gap-2 px-5 pb-5">
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
                        <div
                          key={key}
                          className="flex items-center justify-between rounded-medium border border-default-200 bg-default-50 px-3 py-2"
                        >
                          <p className="text-small">{label}</p>
                          <div className="flex items-center gap-3 font-mono text-tiny">
                            <span className="text-primary">Full {m}</span>
                            <span className="text-default-400">Quick {s}</span>
                            <Chip size="sm" variant="flat" color="warning">
                              {m - s >= 0 ? `+${m - s}` : m - s}
                            </Chip>
                          </div>
                        </div>
                      );
                    })}
                  </CardBody>
                </Card>
              </>
            )}

            {step === "DETECTIVE" && analysis && (
              <Card className="border-small border-default-200" shadow="sm">
                <CardHeader className="flex flex-col items-start gap-1 px-5 pb-0 pt-5">
                  <p className="text-large font-medium">Ask about the case</p>
                  <p className="text-small text-default-500">
                    Why a detail looks weak, or what everyone agreed on
                  </p>
                </CardHeader>
                <CardBody className="flex flex-col gap-4 px-5 pb-5">
                  <ScrollShadow className="flex max-h-80 flex-col gap-3">
                    {chat.map((m, i) => (
                      <div
                        key={i}
                        className={cn(
                          "max-w-[90%] rounded-large px-3 py-2 text-small",
                          m.role === "user"
                            ? "ml-auto bg-primary text-primary-foreground"
                            : "bg-default-100 text-default-700",
                        )}
                      >
                        {m.content}
                      </div>
                    ))}
                    {chatBusy && (
                      <p className="text-tiny text-default-400">Thinking…</p>
                    )}
                  </ScrollShadow>
                  <form
                    className="flex w-full flex-col items-start rounded-medium bg-default-100 transition-colors hover:bg-default-200/70"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void sendChat();
                    }}
                  >
                    <PromptInput
                      classNames={{
                        inputWrapper: "!bg-transparent shadow-none",
                        input: "pt-1 pl-2 pb-6 !pr-10 text-medium",
                      }}
                      endContent={
                        <Button
                          isIconOnly
                          color={!chatInput ? "default" : "primary"}
                          isDisabled={!chatInput || chatBusy}
                          radius="lg"
                          size="sm"
                          variant="solid"
                          type="submit"
                          aria-label="Send"
                        >
                          <Icon
                            className={
                              !chatInput
                                ? "text-default-600"
                                : "text-primary-foreground"
                            }
                            icon="solar:arrow-up-linear"
                            width={20}
                          />
                        </Button>
                      }
                      minRows={2}
                      radius="lg"
                      value={chatInput}
                      variant="flat"
                      onValueChange={setChatInput}
                    />
                    <div className="flex w-full gap-2 overflow-x-auto px-3 pb-3">
                      {[
                        "Why was the scar hard to believe?",
                        "What did everyone agree on?",
                        "Who saw the alley?",
                      ].map((q) => (
                        <Button
                          key={q}
                          size="sm"
                          variant="flat"
                          className="shrink-0"
                          onPress={() => setChatInput(q)}
                        >
                          {q}
                        </Button>
                      ))}
                    </div>
                  </form>
                </CardBody>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
