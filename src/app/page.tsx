"use client";

import { useMemo, useRef, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Input,
  ScrollShadow,
  Spacer,
  Textarea,
} from "@heroui/react";
import { Icon } from "@iconify/react";

import ActionCard from "@/components/pro/cards/action-card";
import SwitchCell from "@/components/pro/cards/switch-cell";
import CellValue from "@/components/pro/cards/cell-value";
import UserCell from "@/components/pro/cards/user-cell";
import ClaimCard from "@/components/pro/cards/claim-card";
import EmptyState from "@/components/pro/cards/empty-state";
import MessageCard from "@/components/pro/ai/message-card";
import PromptComposer from "@/components/pro/ai/prompt-composer";
import LinkPrompt from "@/components/pro/ai/link-prompt";
import Sidebar, { type SidebarItem } from "@/components/pro/sidebar/sidebar";
import SidebarDrawer from "@/components/pro/sidebar/sidebar-drawer";
import RowSteps from "@/components/pro/stepper/row-steps";
import TrendCard from "@/components/pro/charts/trend-card";
import SupportCard from "@/components/pro/forms/support-card";
import { CopyText } from "@/components/pro/tables/copy-text";
import CenteredNavbar from "@/components/pro/marketing/centered-navbar";
import type {
  AnalysisResult,
  AppStep,
  CaseInput,
  Claim,
  PhysicsResult,
  Witness,
} from "@/lib/types";
import { witnessPhysicsScore } from "@/lib/physics-score";

const STEPS: AppStep[] = [
  "INPUT",
  "ANALYSIS",
  "VIDEOS",
  "REPORT",
  "DETECTIVE",
];

const NAV: SidebarItem[] = [
  {
    key: "INPUT",
    title: "Case",
    icon: "solar:document-add-bold-duotone",
  },
  {
    key: "ANALYSIS",
    title: "Checks",
    icon: "solar:magnifer-bold-duotone",
  },
  {
    key: "VIDEOS",
    title: "Scenes",
    icon: "solar:videocamera-record-bold-duotone",
  },
  {
    key: "REPORT",
    title: "Summary",
    icon: "solar:clipboard-check-bold-duotone",
  },
  {
    key: "DETECTIVE",
    title: "Ask",
    icon: "solar:chat-round-line-bold-duotone",
  },
];

const ASK_IDEAS = [
  {
    title: "Why was the scar hard to believe?",
    description: "distance and light",
  },
  {
    title: "What did everyone agree on?",
    description: "matching details",
  },
  {
    title: "Who saw the alley?",
    description: "who was there",
  },
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
  const [runState, setRunState] = useState<"idle" | "running" | "paused">(
    "idle",
  );
  const [chatInput, setChatInput] = useState("");
  const [chat, setChat] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([]);
  const [chatBusy, setChatBusy] = useState(false);
  const [generateVideos, setGenerateVideos] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [linkPrompt, setLinkPrompt] = useState("");
  const analyzeAbort = useRef<AbortController | null>(null);
  const chatAbort = useRef<AbortController | null>(null);
  const resumeDemo = useRef(false);

  const pending = runState === "running";
  const paused = runState === "paused";
  const inApp = Boolean(analysis) || runState !== "idle";
  const stepIndex = STEPS.indexOf(step);

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

  function pauseRun() {
    analyzeAbort.current?.abort();
    analyzeAbort.current = null;
    setRunState("paused");
  }

  function stopAll() {
    analyzeAbort.current?.abort();
    analyzeAbort.current = null;
    chatAbort.current?.abort();
    chatAbort.current = null;
    setRunState("idle");
    setChatBusy(false);
    setError(null);
  }

  function resumeRun() {
    void runAnalysis(resumeDemo.current);
  }

  async function runAnalysis(useDemo = false) {
    analyzeAbort.current?.abort();
    const ac = new AbortController();
    analyzeAbort.current = ac;
    resumeDemo.current = useDemo;
    setError(null);
    setRunState("running");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ac.signal,
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
      setRunState("idle");
    } catch (e) {
      if (ac.signal.aborted) return;
      setError(e instanceof Error ? e.message : "Could not review this case");
      setRunState("idle");
    } finally {
      if (analyzeAbort.current === ac) analyzeAbort.current = null;
    }
  }

  async function sendChat() {
    if (!analysis || !chatInput.trim()) return;
    const message = chatInput.trim();
    setChatInput("");
    const nextHistory = [...chat, { role: "user" as const, content: message }];
    setChat(nextHistory);
    chatAbort.current?.abort();
    const ac = new AbortController();
    chatAbort.current = ac;
    setChatBusy(true);
    try {
      const res = await fetch("/api/detective", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ac.signal,
        body: JSON.stringify({
          caseId: caseInput.id,
          message,
          history: chat,
          case: caseInput,
          analysis,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not answer");
      setChat([...nextHistory, { role: "assistant", content: json.reply }]);
    } catch (e) {
      if (ac.signal.aborted) return;
      setChat([
        ...nextHistory,
        {
          role: "assistant",
          content: e instanceof Error ? e.message : "Could not answer",
        },
      ]);
    } finally {
      if (chatAbort.current === ac) chatAbort.current = null;
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
    NAV.find((n) => n.key === step)?.title ?? "Detectr";
  const pageSub = pending
    ? "Reviewing testimony…"
    : paused
      ? "Paused — resume when ready"
      : analysis
        ? caseInput.caseName || "Open case"
        : "Build a case to begin";

  // Pro Application/sidebars (19) layout — brand, user cell, nav, footer
  const sidebarNav = (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 px-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-foreground">
          <span className="text-tiny font-bold text-background">D</span>
        </div>
        <span className="text-small font-bold uppercase tracking-wide">
          Detectr
        </span>
      </div>

      <Spacer y={8} />

      <div className="flex items-center gap-3 px-2">
        <Avatar
          isBordered
          name={caseInput.caseName || "Case"}
          size="sm"
          radius="none"
        />
        <div className="min-w-0 flex flex-col">
          <p className="truncate text-small font-medium text-default-600">
            {caseInput.caseName || "Open case"}
          </p>
          <p className="truncate text-tiny text-default-400">
            {pending
              ? "Reviewing…"
              : paused
                ? "Paused"
                : analysis
                  ? "Investigator"
                  : "Draft"}
          </p>
        </div>
      </div>

      <ScrollShadow className="-mr-6 h-full max-h-full py-6 pr-6">
        <Sidebar
          key={step}
          defaultSelectedKey={step}
          items={NAV}
          onSelect={(key) => go(key as AppStep)}
        />
      </ScrollShadow>

      <Spacer y={8} />

      <div className="mt-auto flex flex-col">
        <Button
          fullWidth
          className="justify-start text-default-500 data-[hover=true]:text-foreground"
          startContent={
            <Icon
              className="text-default-500"
              icon="solar:play-circle-line-duotone"
              width={24}
            />
          }
          variant="light"
          onPress={loadDemo}
        >
          Sample case
        </Button>
        <Button
          fullWidth
          className="justify-start text-default-500 data-[hover=true]:text-foreground"
          startContent={
            <Icon
              className="text-default-500"
              icon="solar:add-circle-line-duotone"
              width={24}
            />
          }
          variant="light"
          onPress={() => {
            stopAll();
            setAnalysis(null);
            setCaseInput(emptyCase());
            setChat([]);
            setStep("INPUT");
          }}
        >
          New case
        </Button>
      </div>
    </div>
  );

  // ——— Landing: Pro CenteredNavbar + full-bleed brutal hero + rest ———
  if (!inApp) {
    return (
      <div id="top" className="flex min-h-dvh w-full flex-col bg-background">
        <div className="relative px-4 pt-4 sm:px-6">
          <CenteredNavbar
            onGetStarted={() => {
              document
                .getElementById("case-form")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          />
        </div>

        {/* Full-bleed hero — original art only, no stock ads */}
        <section className="relative mt-4 min-h-[min(88dvh,720px)] w-full overflow-hidden border-y-2 border-foreground">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/hero.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
          <div className="relative z-10 mx-auto flex min-h-[min(88dvh,720px)] w-full max-w-3xl flex-col justify-end gap-5 px-4 pb-10 pt-28 sm:px-6 sm:pb-14">
            <p className="text-4xl font-semibold tracking-wide text-foreground sm:text-5xl">
              Detectr
            </p>
            <h1 className="max-w-xl text-3xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
              four people, four nights
            </h1>
            <p className="max-w-md text-medium leading-relaxed text-default-700">
              See what holds up, where stories clash, and how the scene likely
              looked.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                color="primary"
                radius="none"
                size="lg"
                className="font-medium"
                endContent={
                  <Icon icon="solar:alt-arrow-right-linear" width={18} />
                }
                onPress={() => {
                  document
                    .getElementById("case-form")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Get Started
              </Button>
              <Button
                variant="bordered"
                radius="none"
                size="lg"
                className="border-2 border-foreground bg-background font-medium"
                onPress={() => runAnalysis(true)}
              >
                Review sample
              </Button>
            </div>
          </div>
        </section>

        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14">
        <div id="why" className="grid gap-3 sm:grid-cols-3">
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

        <LinkPrompt
          value={linkPrompt}
          onValueChange={setLinkPrompt}
          onSend={() => {
            if (linkPrompt.trim()) {
              setCaseInput((c) => ({
                ...c,
                description: linkPrompt.trim(),
              }));
              document
                .getElementById("case-form")
                ?.scrollIntoView({ behavior: "smooth" });
            }
          }}
          onMakeVideo={() => {
            setGenerateVideos(true);
            if (linkPrompt.trim()) {
              setCaseInput((c) => ({
                ...c,
                description: linkPrompt.trim(),
              }));
            }
            void loadDemo().then(() => runAnalysis(true));
          }}
        />

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
              <SwitchCell
                label="Show the scene as video"
                description="Short clips for a jury. Takes longer."
                color="primary"
                isSelected={generateVideos}
                onValueChange={setGenerateVideos}
              />
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
      </div>
    );
  }

  // ——— App shell (Pro Sidebar 19 + RowSteps) ———
  // SidebarDrawer owns BOTH mobile drawer + one permanent sm+ rail — do not add a second <aside>
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-background">
      <SidebarDrawer
        isOpen={mobileOpen}
        onOpenChange={setMobileOpen}
        sidebarWidth={288}
        className="shrink-0 border-r-small border-divider bg-content1"
      >
        <div className="relative flex h-full w-full flex-1 flex-col p-6">
          {sidebarNav}
        </div>
      </SidebarDrawer>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 flex-wrap items-center gap-3 border-b-small border-divider bg-content1 px-3 py-3 sm:px-5">
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            radius="none"
            className="shrink-0 sm:hidden"
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
          {paused && (
            <Chip size="sm" color="warning" variant="flat" className="shrink-0">
              Paused
            </Chip>
          )}
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-5 sm:px-6 sm:py-7">
            <RowSteps
              currentStep={pending ? 1 : Math.max(stepIndex, 0)}
              color="primary"
              steps={STEPS.map((s) => ({
                title: NAV.find((n) => n.key === s)?.title ?? s,
              }))}
              onStepChange={(i) => go(STEPS[i])}
            />

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

            {(pending || paused) && (
              <Card className="border-small border-default-200" shadow="sm">
                <CardBody className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex rounded-medium border border-primary-100 bg-primary-50 p-2">
                      <Icon
                        className="text-primary"
                        icon={
                          paused
                            ? "solar:pause-circle-bold-duotone"
                            : "solar:hourglass-bold-duotone"
                        }
                        width={22}
                      />
                    </div>
                    <div>
                      <p className="text-medium font-medium">
                        {paused
                          ? "Review paused"
                          : "Reviewing the testimony"}
                      </p>
                      <p className="text-small text-default-500">
                        {paused
                          ? "Nothing is running. Resume to continue, or stop all."
                          : "Checking details, comparing people, writing a clear summary."}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pending && (
                      <Button
                        variant="bordered"
                        radius="none"
                        className="border-2 border-foreground font-medium"
                        startContent={
                          <Icon icon="solar:pause-bold" width={16} />
                        }
                        onPress={pauseRun}
                      >
                        Pause
                      </Button>
                    )}
                    {paused && (
                      <Button
                        color="primary"
                        radius="none"
                        className="font-medium"
                        startContent={
                          <Icon icon="solar:play-bold" width={16} />
                        }
                        onPress={resumeRun}
                      >
                        Resume
                      </Button>
                    )}
                    <Button
                      color="danger"
                      variant="flat"
                      radius="none"
                      className="font-medium"
                      startContent={
                        <Icon icon="solar:stop-bold" width={16} />
                      }
                      onPress={stopAll}
                    >
                      Stop all
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}

            {step === "INPUT" && runState === "idle" && (
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
                    <SwitchCell
                      label="Show the scene as video"
                      description="Short clips for a jury. Takes longer."
                      color="primary"
                      isSelected={generateVideos}
                      onValueChange={setGenerateVideos}
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
                <Card className="border-small border-default-200" shadow="sm">
                  <CardBody className="flex flex-col gap-1 p-2">
                    {caseInput.witnesses.map((w, idx) => (
                      <UserCell
                        key={w.id}
                        name={w.name || `Witness ${idx + 1}`}
                        permission={w.position || "No location set"}
                      />
                    ))}
                  </CardBody>
                </Card>
                {caseInput.witnesses.map((w, idx) => (
                  <ClaimCard
                    key={w.id}
                    title={w.name || `Witness ${idx + 1}`}
                    subtitle={w.position || "No location set"}
                    body={w.statement || "No statement yet"}
                    icon="solar:user-bold-duotone"
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
                    <ClaimCard
                      key={claim.id}
                      title={claim.text}
                      subtitle={claim.witnessName}
                      tags={claim.tags}
                      status={p ? verdictLabel(p.verdict) : undefined}
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
                    <ClaimCard
                      key={`score-${w.id}`}
                      title={w.name}
                      subtitle="How solid is their account overall?"
                      metric={`${score}%`}
                      metricLabel="solid"
                      progress={score}
                      icon="solar:user-check-bold-duotone"
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
                <dl className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
                  <TrendCard
                    title="People"
                    value={String(analysis.report.totalWitnesses)}
                    change="witnesses"
                    changeType="neutral"
                    trendType="neutral"
                  />
                  <TrendCard
                    title="Details"
                    value={String(analysis.report.totalClaims)}
                    change="claims"
                    changeType="positive"
                    trendType="up"
                  />
                  <TrendCard
                    title="Hard to believe"
                    value={String(analysis.report.physicsFlags)}
                    change="flags"
                    changeType={
                      analysis.report.physicsFlags > 0 ? "negative" : "positive"
                    }
                    trendType={
                      analysis.report.physicsFlags > 0 ? "down" : "neutral"
                    }
                  />
                </dl>

                <Card className="border-small border-default-200" shadow="sm">
                  <CardHeader className="flex flex-col items-start gap-2 px-5 pb-0 pt-5">
                    <p className="text-large font-medium">What we found</p>
                    <CopyText textClassName="text-small text-default-500">
                      {analysis.report.summary}
                    </CopyText>
                  </CardHeader>
                  <CardBody className="flex flex-col gap-1 px-5 pb-5">
                    <CellValue label="Case" value={caseInput.caseName} />
                    <CellValue label="Where" value={caseInput.location} />
                    <CellValue label="When" value={caseInput.dateTime} />
                  </CardBody>
                </Card>

                <div>
                  <p className="text-large font-medium text-default-900">
                    The takeaways
                  </p>
                </div>
                {analysis.report.keyFindings.map((f, i) => (
                  <ClaimCard
                    key={i}
                    title={f}
                    icon="solar:checklist-minimalistic-bold-duotone"
                  />
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
                  <CardBody className="flex flex-col gap-1 px-5 pb-5">
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
                      const delta = m - s;
                      return (
                        <CellValue
                          key={key}
                          label={label}
                          value={
                            <span className="flex items-center gap-2 font-mono text-tiny">
                              <span className="text-primary">Full {m}</span>
                              <span className="text-default-400">Quick {s}</span>
                              <Chip size="sm" variant="flat" color="warning">
                                {delta >= 0 ? `+${delta}` : delta}
                              </Chip>
                            </span>
                          }
                        />
                      );
                    })}
                  </CardBody>
                </Card>

                <SupportCard
                  message="Still unsure? Ask about any detail."
                  onPress={() => go("DETECTIVE")}
                />
              </>
            )}

            {step === "DETECTIVE" && analysis && (
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-large font-medium text-default-900">
                    Ask about the case
                  </p>
                  <p className="text-small text-default-500">
                    Why a detail looks weak, or what everyone agreed on
                  </p>
                </div>

                <SupportCard message="We’re here to walk through the testimony." />

                <ScrollShadow className="flex max-h-[28rem] flex-col gap-4">
                  {chat.map((m, i) =>
                    m.role === "assistant" ? (
                      <MessageCard
                        key={i}
                        showFeedback
                        message={m.content}
                      />
                    ) : (
                      <MessageCard
                        key={i}
                        className="flex-row-reverse"
                        messageClassName="bg-primary text-primary-foreground"
                        avatar={undefined}
                        message={m.content}
                      />
                    ),
                  )}
                  {chatBusy && (
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-tiny text-default-400">Thinking…</p>
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        radius="none"
                        startContent={
                          <Icon icon="solar:stop-bold" width={14} />
                        }
                        onPress={stopAll}
                      >
                        Stop all
                      </Button>
                    </div>
                  )}
                </ScrollShadow>

                <PromptComposer
                  value={chatInput}
                  onValueChange={setChatInput}
                  onSubmit={() => void sendChat()}
                  isDisabled={chatBusy}
                  ideas={ASK_IDEAS}
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
