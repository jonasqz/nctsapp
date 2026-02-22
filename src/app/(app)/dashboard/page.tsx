"use client";

import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface HealthData {
  score: number;
  status: "healthy" | "needs_attention" | "at_risk";
  issues: string[];
  stats: {
    activeNarratives: number;
    totalNarratives: number;
    atRiskCommitments: number;
    totalCommitments: number;
    completedTasks: number;
    totalTasks: number;
    orphanTasks: number;
    blockedTasks: number;
    overdueTasks: number;
    onTrackCommitments: number;
    staleNarratives: number;
  };
}

interface Cycle {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
}

const statusConfig = {
  healthy: {
    label: "Healthy",
    color: "text-green-700",
    bg: "bg-green-100",
    bar: "bg-green-400",
    dot: "bg-green-400",
  },
  needs_attention: {
    label: "Needs Attention",
    color: "text-amber-700",
    bg: "bg-amber-200",
    bar: "bg-amber-400",
    dot: "bg-amber-400",
  },
  at_risk: {
    label: "At Risk",
    color: "text-red-700",
    bg: "bg-red-100",
    bar: "bg-red-400",
    dot: "bg-red-400",
  },
};

function getCycleWeekProgress(startDate: string, endDate: string): number {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const total = end.getTime() - start.getTime();
  if (total <= 0) return 100;
  const elapsed = now.getTime() - start.getTime();
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

function formatDateRange(startDate: string, endDate: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const start = new Date(startDate).toLocaleDateString("en-US", opts);
  const end = new Date(endDate).toLocaleDateString("en-US", {
    ...opts,
    year: "numeric",
  });
  return `${start} – ${end}`;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [health, setHealth] = useState<HealthData | null>(null);
  const [activeCycle, setActiveCycle] = useState<Cycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Empty state form
  const [narrativeTitle, setNarrativeTitle] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/health").then((res) => {
        if (!res.ok) throw new Error("Failed to load health data");
        return res.json();
      }),
      fetch("/api/cycles")
        .then((res) => {
          if (!res.ok) return [];
          return res.json();
        })
        .catch(() => []),
    ])
      .then(([healthData, cyclesData]) => {
        setHealth(healthData);
        const active = Array.isArray(cyclesData)
          ? cyclesData.find((c: Cycle) => c.status === "active") || null
          : null;
        setActiveCycle(active);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  async function handleCreateNarrative() {
    if (!narrativeTitle.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/narratives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: narrativeTitle.trim() }),
      });
      if (!res.ok) throw new Error("Failed to create narrative");
      const created = await res.json();
      toast.success("Narrative created");
      router.push(`/dashboard/narratives/${created.id}`);
    } catch {
      toast.error("Failed to create narrative");
      setCreating(false);
    }
  }

  // --- Loading state ---
  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-64 rounded-lg bg-navy-100" />
        <div className="h-4 w-48 rounded bg-navy-50" />
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-navy-50" />
          ))}
        </div>
      </div>
    );
  }

  // --- Error state ---
  if (error || !health) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-8 text-center">
        <p className="text-sm font-medium text-red-700">
          {error || "Something went wrong loading your dashboard."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy-800"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { score, status, issues, stats } = health;
  const cfg = statusConfig[status];

  // --- Empty state: no narratives at all ---
  if (stats.totalNarratives === 0) {
    return (
      <div>
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="font-heading text-2xl font-semibold text-navy-950">
            Welcome{session?.user?.name ? `, ${session.user.name}` : ""}
          </h1>
          <p className="mt-1 text-sm text-navy-400">
            Let&apos;s connect your strategy to execution.
          </p>
        </div>

        {/* Active Cycle Card (empty state) */}
        <div className="mb-8">
          {activeCycle ? (
            <Link
              href={`/dashboard/cycles/${activeCycle.id}`}
              className="block rounded-xl border border-navy-100 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-navy-400">Active Cycle</p>
                  <p className="mt-1 text-sm font-semibold text-navy-950">
                    {activeCycle.name}
                  </p>
                  <p className="mt-0.5 text-xs text-navy-400">
                    {formatDateRange(activeCycle.startDate, activeCycle.endDate)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-navy-600">
                    {getCycleWeekProgress(activeCycle.startDate, activeCycle.endDate)}% elapsed
                  </span>
                </div>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-navy-100">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-700 ease-out"
                  style={{
                    width: `${getCycleWeekProgress(activeCycle.startDate, activeCycle.endDate)}%`,
                  }}
                />
              </div>
            </Link>
          ) : (
            <div className="rounded-xl border border-dashed border-navy-200 bg-white p-5 text-center">
              <p className="text-sm text-navy-400">
                No active cycle.{" "}
                <Link
                  href="/dashboard/cycles"
                  className="font-medium text-amber-500 hover:text-amber-600"
                >
                  Create one
                </Link>{" "}
                to start planning.
              </p>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <Link
            href="/dashboard/strategy"
            className="flex items-center gap-3 rounded-xl border border-navy-100 bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-50">
              <svg className="h-4.5 w-4.5 text-navy-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-navy-900">Strategy</span>
          </Link>
          <Link
            href={activeCycle ? `/dashboard/cycles/${activeCycle.id}` : "/dashboard/cycles"}
            className="flex items-center gap-3 rounded-xl border border-navy-100 bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-50">
              <svg className="h-4.5 w-4.5 text-navy-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
              </svg>
            </div>
            <span className="text-sm font-medium text-navy-900">Current Cycle</span>
          </Link>
          <Link
            href="/dashboard/alignment"
            className="flex items-center gap-3 rounded-xl border border-navy-100 bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-50">
              <svg className="h-4.5 w-4.5 text-navy-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-navy-900">Alignment</span>
          </Link>
        </div>

        {/* Onboarding card */}
        <div className="mx-auto max-w-2xl rounded-xl border-2 border-dashed border-navy-200 bg-white p-10">
          {/* Heading */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-200">
              <svg
                className="h-7 w-7 text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
                />
              </svg>
            </div>
            <h2 className="font-heading text-xl font-semibold text-navy-950">
              Start with your Strategy
            </h2>
            <p className="mt-2 text-sm text-navy-400">
              The NCT framework connects high-level strategy to daily work in
              three layers.
            </p>
          </div>

          {/* N-C-T hierarchy */}
          <div className="mb-10 space-y-4">
            {/* Narrative */}
            <div className="flex items-start gap-4 rounded-lg border border-navy-100 bg-navy-50 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-900 font-heading text-sm font-bold text-white">
                N
              </div>
              <div>
                <p className="text-sm font-semibold text-navy-950">Narrative</p>
                <p className="mt-0.5 text-sm text-navy-600">
                  &ldquo;Why are we doing this?&rdquo; &mdash; The strategic
                  direction that gives everything meaning.
                </p>
              </div>
            </div>

            {/* Commitment */}
            <div className="ml-6 flex items-start gap-4 rounded-lg border border-navy-100 bg-white p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-800 font-heading text-sm font-bold text-white">
                C
              </div>
              <div>
                <p className="text-sm font-semibold text-navy-950">
                  Commitment
                </p>
                <p className="mt-0.5 text-sm text-navy-600">
                  &ldquo;What will be true when we succeed?&rdquo; &mdash;
                  Measurable outcomes that prove the narrative is working.
                </p>
              </div>
            </div>

            {/* Task */}
            <div className="ml-12 flex items-start gap-4 rounded-lg border border-navy-100 bg-white p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-600 font-heading text-sm font-bold text-white">
                T
              </div>
              <div>
                <p className="text-sm font-semibold text-navy-950">Task</p>
                <p className="mt-0.5 text-sm text-navy-600">
                  &ldquo;What do we need to do?&rdquo; &mdash; Concrete actions
                  that move a commitment forward.
                </p>
              </div>
            </div>
          </div>

          {/* Create form */}
          <div className="border-t border-navy-100 pt-8">
            <p className="mb-3 text-center text-sm font-medium text-navy-600">
              Create your first narrative to get started
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={narrativeTitle}
                onChange={(e) => setNarrativeTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateNarrative();
                }}
                placeholder="e.g., Expand into enterprise market"
                className="flex-1 rounded-lg border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-950 placeholder:text-navy-400 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
              />
              <button
                onClick={handleCreateNarrative}
                disabled={!narrativeTitle.trim() || creating}
                className="shrink-0 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? "Creating..." : "Create Narrative"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Main dashboard with health data ---
  return (
    <div>
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold text-navy-950">
          Welcome{session?.user?.name ? `, ${session.user.name}` : ""}
        </h1>
        <p className="mt-1 text-sm text-navy-400">
          Your NCT workspace overview.
        </p>
      </div>

      {/* Active Cycle Card */}
      <div className="mb-6">
        {activeCycle ? (
          <Link
            href={`/dashboard/cycles/${activeCycle.id}`}
            className="block rounded-xl border border-navy-100 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-navy-400">Active Cycle</p>
                <p className="mt-1 text-sm font-semibold text-navy-950">
                  {activeCycle.name}
                </p>
                <p className="mt-0.5 text-xs text-navy-400">
                  {formatDateRange(activeCycle.startDate, activeCycle.endDate)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-navy-600">
                  {getCycleWeekProgress(activeCycle.startDate, activeCycle.endDate)}% elapsed
                </span>
              </div>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-navy-100">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-700 ease-out"
                style={{
                  width: `${getCycleWeekProgress(activeCycle.startDate, activeCycle.endDate)}%`,
                }}
              />
            </div>
          </Link>
        ) : (
          <div className="rounded-xl border border-dashed border-navy-200 bg-white p-5 text-center">
            <p className="text-sm text-navy-400">
              No active cycle.{" "}
              <Link
                href="/dashboard/cycles"
                className="font-medium text-amber-500 hover:text-amber-600"
              >
                Create one
              </Link>{" "}
              to start planning.
            </p>
          </div>
        )}
      </div>

      {/* Health score card + Stats grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Health score card */}
        <div className="lg:col-span-4">
          <div className="rounded-xl border border-navy-100 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium text-navy-400">
                NCT Health Score
              </h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.color}`}
              >
                {cfg.label}
              </span>
            </div>

            {/* Large score */}
            <div className="mb-5 flex items-baseline gap-2">
              <span
                className={`font-heading text-5xl font-bold ${
                  score >= 80
                    ? "text-green-700"
                    : score >= 60
                      ? "text-amber-500"
                      : "text-red-700"
                }`}
              >
                {score}
              </span>
              <span className="text-lg text-navy-400">/100</span>
            </div>

            {/* Progress bar */}
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-navy-100">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${cfg.bar}`}
                style={{ width: `${score}%` }}
              />
            </div>

            {/* Breakdown hints */}
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-navy-400">Narratives</span>
                <span className="font-medium text-navy-600">
                  {stats.activeNarratives} active / {stats.totalNarratives}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-navy-400">On-track commitments</span>
                <span className="font-medium text-navy-600">
                  {stats.onTrackCommitments} / {stats.totalCommitments}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-navy-400">Tasks completed</span>
                <span className="font-medium text-navy-600">
                  {stats.completedTasks} / {stats.totalTasks}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="lg:col-span-8">
          <div className="grid grid-cols-2 gap-4">
            {/* Active Narratives */}
            <div className="rounded-xl border border-navy-100 bg-white p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-navy-50">
                <svg
                  className="h-5 w-5 text-navy-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-navy-400">
                Active Narratives
              </p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-heading text-3xl font-bold text-navy-950">
                  {stats.activeNarratives}
                </span>
                <span className="text-sm text-navy-400">
                  / {stats.totalNarratives}
                </span>
              </div>
              {stats.staleNarratives > 0 && (
                <p className="mt-2 text-xs text-amber-500">
                  {stats.staleNarratives} stale (30+ days idle)
                </p>
              )}
            </div>

            {/* Commitments at Risk */}
            <div className="rounded-xl border border-navy-100 bg-white p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-navy-50">
                <svg
                  className="h-5 w-5 text-navy-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-navy-400">
                Commitments at Risk
              </p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span
                  className={`font-heading text-3xl font-bold ${
                    stats.atRiskCommitments > 0
                      ? "text-red-700"
                      : "text-navy-950"
                  }`}
                >
                  {stats.atRiskCommitments}
                </span>
                <span className="text-sm text-navy-400">
                  / {stats.totalCommitments}
                </span>
              </div>
              {stats.onTrackCommitments > 0 && (
                <p className="mt-2 text-xs text-green-700">
                  {stats.onTrackCommitments} on track
                </p>
              )}
            </div>

            {/* Tasks on Track */}
            <div className="rounded-xl border border-navy-100 bg-white p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-navy-50">
                <svg
                  className="h-5 w-5 text-navy-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-navy-400">
                Tasks Completed
              </p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-heading text-3xl font-bold text-navy-950">
                  {stats.completedTasks}
                </span>
                <span className="text-sm text-navy-400">
                  / {stats.totalTasks}
                </span>
              </div>
              {stats.totalTasks > 0 && (
                <div className="mt-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy-100">
                    <div
                      className="h-full rounded-full bg-green-400 transition-all duration-500"
                      style={{
                        width: `${Math.round(
                          (stats.completedTasks / stats.totalTasks) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Overdue Tasks */}
            <div className="rounded-xl border border-navy-100 bg-white p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-navy-50">
                <svg
                  className="h-5 w-5 text-navy-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-navy-400">Overdue Tasks</p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span
                  className={`font-heading text-3xl font-bold ${
                    stats.overdueTasks > 0 ? "text-red-700" : "text-navy-950"
                  }`}
                >
                  {stats.overdueTasks}
                </span>
              </div>
              {stats.blockedTasks > 0 && (
                <p className="mt-2 text-xs text-red-700">
                  {stats.blockedTasks} blocked
                </p>
              )}
              {stats.orphanTasks > 0 && (
                <p className="mt-1 text-xs text-amber-500">
                  {stats.orphanTasks} orphaned (no commitment)
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <Link
          href="/dashboard/strategy"
          className="flex items-center gap-3 rounded-xl border border-navy-100 bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-50">
            <svg className="h-4.5 w-4.5 text-navy-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-navy-900">Strategy</span>
        </Link>
        <Link
          href={activeCycle ? `/dashboard/cycles/${activeCycle.id}` : "/dashboard/cycles"}
          className="flex items-center gap-3 rounded-xl border border-navy-100 bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-50">
            <svg className="h-4.5 w-4.5 text-navy-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
            </svg>
          </div>
          <span className="text-sm font-medium text-navy-900">Current Cycle</span>
        </Link>
        <Link
          href="/dashboard/alignment"
          className="flex items-center gap-3 rounded-xl border border-navy-100 bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-50">
            <svg className="h-4.5 w-4.5 text-navy-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
            </svg>
          </div>
          <span className="text-sm font-medium text-navy-900">Alignment</span>
        </Link>
      </div>

      {/* Issues list */}
      {issues.length > 0 && (
        <div className="mt-6 rounded-xl border border-navy-100 bg-white p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-medium text-navy-950">
            <svg
              className="h-4 w-4 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
            Issues to Address
          </h2>
          <ul className="space-y-2">
            {issues.map((issue, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-lg bg-amber-200/30 px-4 py-3 text-sm text-navy-800"
              >
                <span className="mt-0.5 block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
