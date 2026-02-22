"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STEPS = ["Workspace", "Rhythm", "Teams", "Review"] as const;

type PlanningRhythm = "quarters" | "cycles" | "custom";
type TeamMode = "solo" | "multiple";
type CycleLength = 6 | 8 | 12 | "custom";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [workspaceName, setWorkspaceName] = useState("");
  const [vision, setVision] = useState("");

  // Step 2
  const [planningRhythm, setPlanningRhythm] = useState<PlanningRhythm | null>(
    null,
  );
  const [cycleLength, setCycleLength] = useState<CycleLength>(6);
  const [customCycleWeeks, setCustomCycleWeeks] = useState("");

  // Step 3
  const [teamMode, setTeamMode] = useState<TeamMode | null>(null);
  const [teamNames, setTeamNames] = useState(["", ""]);

  function canContinue(): boolean {
    switch (step) {
      case 0:
        return workspaceName.trim().length > 0;
      case 1:
        return planningRhythm !== null;
      case 2:
        if (teamMode === null) return false;
        if (teamMode === "multiple") {
          return teamNames.some((t) => t.trim().length > 0);
        }
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  }

  function handleNext() {
    if (step < 3 && canContinue()) {
      setStep(step + 1);
    }
  }

  function handleBack() {
    if (step > 0) {
      setStep(step - 1);
    }
  }

  async function handleCreate() {
    setIsSubmitting(true);
    setError(null);
    try {
      const teams =
        teamMode === "multiple"
          ? teamNames.filter((t) => t.trim().length > 0)
          : ["My Team"];

      const payload = {
        name: workspaceName.trim(),
        vision: vision.trim() || null,
        planningRhythm,
        cycleLengthWeeks:
          planningRhythm === "cycles"
            ? cycleLength === "custom"
              ? parseInt(customCycleWeeks, 10) || 6
              : cycleLength
            : null,
        teams,
      };

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to create workspace");
      }

      const data = await res.json();

      document.cookie = `ncts-workspace-id=${data.id};path=/;max-age=${60 * 60 * 24 * 365}`;

      router.push("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
      setIsSubmitting(false);
    }
  }

  function getResolvedCycleLabel(): string {
    if (planningRhythm !== "cycles") return "";
    if (cycleLength === "custom") {
      const w = parseInt(customCycleWeeks, 10);
      return w ? `${w} weeks` : "Custom";
    }
    return `${cycleLength} weeks`;
  }

  function getRhythmLabel(): string {
    switch (planningRhythm) {
      case "quarters":
        return "Quarters (Q1–Q4)";
      case "cycles":
        return `Cycles — ${getResolvedCycleLabel()}`;
      case "custom":
        return "Custom rhythm";
      default:
        return "—";
    }
  }

  function getTeamsList(): string[] {
    if (teamMode === "multiple") {
      return teamNames.filter((t) => t.trim().length > 0);
    }
    return ["My Team"];
  }

  // ─── Progress Indicator ────────────────────────────────────────────

  function renderProgress() {
    return (
      <div className="mb-10 flex items-center justify-center">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  i < step
                    ? "bg-green-500 text-white"
                    : i === step
                      ? "bg-amber-500 text-white"
                      : "border-2 border-navy-200 text-navy-400"
                }`}
              >
                {i < step ? (
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-xs font-medium ${
                  i <= step ? "text-navy-950" : "text-navy-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-3 mb-5 h-0.5 w-12 rounded-full sm:w-16 ${
                  i < step ? "bg-green-500" : "bg-navy-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  // ─── Step 1: Workspace ─────────────────────────────────────────────

  function renderStep1() {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-navy-950">
            Set up your workspace
          </h1>
          <p className="mt-1.5 text-sm text-navy-400">
            This is your team&apos;s home for strategy execution.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="workspace-name"
              className="mb-1.5 block text-sm font-medium text-navy-950"
            >
              Workspace name <span className="text-red-500">*</span>
            </label>
            <input
              id="workspace-name"
              type="text"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="e.g., Acme Corp"
              className="w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="vision"
              className="mb-1.5 block text-sm font-medium text-navy-950"
            >
              Vision{" "}
              <span className="font-normal text-navy-400">(optional)</span>
            </label>
            <textarea
              id="vision"
              rows={3}
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              placeholder="e.g., Make sustainable energy accessible to everyone"
              className="w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleNext}
            disabled={!canContinue()}
            className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // ─── Step 2: Planning Rhythm ───────────────────────────────────────

  function renderStep2() {
    const rhythmOptions: {
      value: PlanningRhythm;
      icon: string;
      title: string;
      desc: string;
    }[] = [
      {
        value: "quarters",
        icon: "📅",
        title: "Quarters",
        desc: "Traditional Q1-Q4 (3 months each)",
      },
      {
        value: "cycles",
        icon: "🔄",
        title: "Cycles (recommended)",
        desc: "Flexible length — 6, 8, or 12 weeks",
      },
      {
        value: "custom",
        icon: "📆",
        title: "Custom",
        desc: "Define your own planning rhythm",
      },
    ];

    const cycleLengthOptions: { value: CycleLength; label: string }[] = [
      { value: 6, label: "6 weeks" },
      { value: 8, label: "8 weeks" },
      { value: 12, label: "12 weeks" },
      { value: "custom", label: "Custom" },
    ];

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-navy-950">
            How does your team plan work?
          </h1>
        </div>

        <div className="space-y-3">
          {rhythmOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPlanningRhythm(opt.value)}
              className={`flex w-full items-start gap-3.5 rounded-lg border p-4 text-left transition-colors ${
                planningRhythm === opt.value
                  ? "border-amber-500 bg-amber-50"
                  : "border-navy-200 hover:bg-navy-50"
              }`}
            >
              <span className="mt-0.5 text-xl">{opt.icon}</span>
              <div>
                <p className="text-sm font-medium text-navy-950">
                  {opt.title}
                </p>
                <p className="mt-0.5 text-sm text-navy-400">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {planningRhythm === "cycles" && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-navy-950">Cycle length</p>
            <div className="flex gap-2">
              {cycleLengthOptions.map((opt) => (
                <button
                  key={String(opt.value)}
                  onClick={() => setCycleLength(opt.value)}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    cycleLength === opt.value
                      ? "border-amber-500 bg-amber-50 text-amber-700"
                      : "border-navy-200 text-navy-900 hover:bg-navy-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {cycleLength === "custom" && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={customCycleWeeks}
                  onChange={(e) => setCustomCycleWeeks(e.target.value)}
                  placeholder="e.g., 10"
                  className="w-24 rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
                <span className="text-sm text-navy-400">weeks</span>
              </div>
            )}

            <p className="text-sm text-navy-400">
              💡 6 weeks is popular (Basecamp, Shape Up). Long enough to ship,
              short enough to adapt.
            </p>
          </div>
        )}

        <div className="flex justify-between pt-2">
          <button
            onClick={handleBack}
            className="rounded-lg border border-navy-200 px-5 py-2.5 text-sm font-medium text-navy-900 transition-colors hover:bg-navy-50"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!canContinue()}
            className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // ─── Step 3: Teams ─────────────────────────────────────────────────

  function renderStep3() {
    const teamOptions: {
      value: TeamMode;
      icon: string;
      title: string;
      desc: string;
    }[] = [
      {
        value: "solo",
        icon: "👤",
        title: "Solo or single team",
        desc: "We'll keep it simple",
      },
      {
        value: "multiple",
        icon: "👥",
        title: "Multiple teams",
        desc: "Each team will have their own narratives",
      },
    ];

    function addTeamInput() {
      setTeamNames([...teamNames, ""]);
    }

    function removeTeamInput(index: number) {
      if (teamNames.length <= 1) return;
      setTeamNames(teamNames.filter((_, i) => i !== index));
    }

    function updateTeamName(index: number, value: string) {
      const updated = [...teamNames];
      updated[index] = value;
      setTeamNames(updated);
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-navy-950">
            Do you work in teams?
          </h1>
        </div>

        <div className="space-y-3">
          {teamOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTeamMode(opt.value)}
              className={`flex w-full items-start gap-3.5 rounded-lg border p-4 text-left transition-colors ${
                teamMode === opt.value
                  ? "border-amber-500 bg-amber-50"
                  : "border-navy-200 hover:bg-navy-50"
              }`}
            >
              <span className="mt-0.5 text-xl">{opt.icon}</span>
              <div>
                <p className="text-sm font-medium text-navy-950">
                  {opt.title}
                </p>
                <p className="mt-0.5 text-sm text-navy-400">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {teamMode === "multiple" && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-navy-950">Team names</p>
            <div className="space-y-2">
              {teamNames.map((name, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => updateTeamName(i, e.target.value)}
                    placeholder={`Team ${i + 1}`}
                    className="flex-1 rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                  {teamNames.length > 1 && (
                    <button
                      onClick={() => removeTeamInput(i)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-navy-200 text-navy-400 transition-colors hover:bg-navy-50 hover:text-navy-900"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addTeamInput}
              className="flex items-center gap-1.5 text-sm font-medium text-amber-600 transition-colors hover:text-amber-500"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Add team
            </button>
          </div>
        )}

        <div className="flex justify-between pt-2">
          <button
            onClick={handleBack}
            className="rounded-lg border border-navy-200 px-5 py-2.5 text-sm font-medium text-navy-900 transition-colors hover:bg-navy-50"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            disabled={!canContinue()}
            className="rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // ─── Step 4: Review & Create ───────────────────────────────────────

  function renderStep4() {
    const teams = getTeamsList();

    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-navy-950">
            Ready to start
          </h1>
        </div>

        <div className="rounded-lg border border-navy-200 bg-white p-5">
          <dl className="space-y-4">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-navy-400">
                Workspace
              </dt>
              <dd className="mt-1 text-sm font-medium text-navy-950">
                {workspaceName}
              </dd>
            </div>

            {vision.trim() && (
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-navy-400">
                  Vision
                </dt>
                <dd className="mt-1 text-sm text-navy-950">{vision}</dd>
              </div>
            )}

            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-navy-400">
                Planning rhythm
              </dt>
              <dd className="mt-1 text-sm text-navy-950">
                {getRhythmLabel()}
              </dd>
            </div>

            <div>
              <dt className="text-xs font-medium uppercase tracking-wider text-navy-400">
                Teams
              </dt>
              <dd className="mt-1.5 flex flex-wrap gap-2">
                {teams.map((team) => (
                  <span
                    key={team}
                    className="inline-flex rounded-md bg-navy-100 px-2.5 py-1 text-xs font-medium text-navy-900"
                  >
                    {team}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-between pt-2">
          <button
            onClick={handleBack}
            disabled={isSubmitting}
            className="rounded-lg border border-navy-200 px-5 py-2.5 text-sm font-medium text-navy-900 transition-colors hover:bg-navy-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>
          <button
            onClick={handleCreate}
            disabled={isSubmitting}
            className="rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Creating…
              </span>
            ) : (
              "Create Workspace"
            )}
          </button>
        </div>
      </div>
    );
  }

  // ─── Main Render ───────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-2xl">
        {renderProgress()}
        <div className="rounded-xl border border-navy-200 bg-white p-8 shadow-sm">
          {step === 0 && renderStep1()}
          {step === 1 && renderStep2()}
          {step === 2 && renderStep3()}
          {step === 3 && renderStep4()}
        </div>
      </div>
    </div>
  );
}
