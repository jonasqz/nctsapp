"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────

interface Cycle {
  id: string;
  yearId: string;
  workspaceId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "planning" | "active" | "review" | "archived";
  createdAt: string;
  updatedAt: string;
}

interface Narrative {
  id: string;
  cycleId: string | null;
}

interface Commitment {
  id: string;
  narrativeId: string;
}

interface Task {
  id: string;
  commitmentId: string;
}

interface Year {
  id: string;
  year: number;
}

interface CycleCounts {
  narratives: number;
  commitments: number;
  tasks: number;
}

interface WorkspaceSettings {
  planningRhythm: "quarters" | "cycles" | "custom";
  cycleLengthWeeks: number | null;
}

interface CycleDefaults {
  name: string;
  startDate: string;
  endDate: string;
}

// ─── Status config ───────────────────────────────────────────────────

const statusConfig: Record<
  string,
  { label: string; badge: string; dot: string; iconBg: string; iconColor: string }
> = {
  planning: {
    label: "Planning",
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-400",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  active: {
    label: "Active",
    badge: "bg-green-100 text-green-700",
    dot: "bg-green-400",
    iconBg: "bg-green-50",
    iconColor: "text-green-600",
  },
  review: {
    label: "Review",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-400",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
  },
  archived: {
    label: "Archived",
    badge: "bg-navy-100 text-navy-600",
    dot: "bg-navy-400",
    iconBg: "bg-navy-50",
    iconColor: "text-navy-500",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };
  const startStr = s.toLocaleDateString("en-US", opts);
  const endStr = e.toLocaleDateString("en-US", {
    ...opts,
    year: "numeric",
  });

  if (s.getFullYear() === e.getFullYear()) {
    return `${startStr} \u2013 ${endStr}`;
  }
  const startWithYear = s.toLocaleDateString("en-US", {
    ...opts,
    year: "numeric",
  });
  return `${startWithYear} \u2013 ${endStr}`;
}

function getWeekProgress(start: string, end: string): {
  currentWeek: number;
  totalWeeks: number;
  percent: number;
} | null {
  const now = new Date();
  const s = new Date(start);
  const e = new Date(end);

  if (now < s || now > e) return null;

  const totalMs = e.getTime() - s.getTime();
  const elapsedMs = now.getTime() - s.getTime();
  const totalWeeks = Math.max(1, Math.round(totalMs / (7 * 24 * 60 * 60 * 1000)));
  const currentWeek = Math.min(
    totalWeeks,
    Math.max(1, Math.ceil((elapsedMs / totalMs) * totalWeeks))
  );
  const percent = Math.min(100, Math.round((elapsedMs / totalMs) * 100));

  return { currentWeek, totalWeeks, percent };
}

function computeCycleDefaults(
  rhythm: "quarters" | "cycles" | "custom",
  cycleLengthWeeks: number | null,
  existingCycles: Cycle[]
): CycleDefaults {
  const today = new Date();

  if (rhythm === "quarters") {
    const currentYear = today.getFullYear();
    const quarters = [
      { name: "Q1", start: new Date(currentYear, 0, 1), end: new Date(currentYear, 2, 31) },
      { name: "Q2", start: new Date(currentYear, 3, 1), end: new Date(currentYear, 5, 30) },
      { name: "Q3", start: new Date(currentYear, 6, 1), end: new Date(currentYear, 8, 30) },
      { name: "Q4", start: new Date(currentYear, 9, 1), end: new Date(currentYear, 11, 31) },
    ];

    const nextYear = currentYear + 1;
    const nextYearQuarters = [
      { name: "Q1", start: new Date(nextYear, 0, 1), end: new Date(nextYear, 2, 31) },
      { name: "Q2", start: new Date(nextYear, 3, 1), end: new Date(nextYear, 5, 30) },
      { name: "Q3", start: new Date(nextYear, 6, 1), end: new Date(nextYear, 8, 30) },
      { name: "Q4", start: new Date(nextYear, 9, 1), end: new Date(nextYear, 11, 31) },
    ];

    const allQuarters = [...quarters, ...nextYearQuarters];
    const existingNames = new Set(existingCycles.map((c) => c.name.toLowerCase()));

    for (const q of allQuarters) {
      const yearForQ = q.start.getFullYear();
      const fullName = `${q.name} ${yearForQ}`;
      if (q.end >= today && !existingNames.has(fullName.toLowerCase())) {
        return {
          name: fullName,
          startDate: q.start.toISOString().split("T")[0],
          endDate: q.end.toISOString().split("T")[0],
        };
      }
    }

    return { name: "", startDate: "", endDate: "" };
  }

  if (rhythm === "cycles" && cycleLengthWeeks) {
    const sortedCycles = [...existingCycles].sort(
      (a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
    );

    let startDate: Date;
    if (sortedCycles.length > 0) {
      const lastEnd = new Date(sortedCycles[0].endDate);
      startDate = new Date(lastEnd);
      startDate.setDate(startDate.getDate() + 1);
      if (startDate < today) startDate = today;
    } else {
      startDate = today;
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + cycleLengthWeeks * 7 - 1);

    const cycleNumber = existingCycles.length + 1;

    return {
      name: `Cycle ${cycleNumber}`,
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
    };
  }

  // Custom mode: default today + 6 weeks
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 42);

  return {
    name: "",
    startDate: today.toISOString().split("T")[0],
    endDate: endDate.toISOString().split("T")[0],
  };
}

// ─── Subcomponents ───────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? statusConfig.planning;
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.badge}`}
    >
      {config.label}
    </span>
  );
}

function ProgressBar({
  currentWeek,
  totalWeeks,
  percent,
}: {
  currentWeek: number;
  totalWeeks: number;
  percent: number;
}) {
  return (
    <div className="mt-3">
      <div className="mb-1.5 flex items-center justify-between text-xs text-navy-500">
        <span>
          Week {currentWeek} of {totalWeeks}
        </span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-navy-100">
        <div
          className="h-full rounded-full bg-green-500 transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-navy-100 bg-white p-4"
          >
            <div className="mb-2 h-9 w-9 rounded-lg bg-navy-50" />
            <div className="h-7 w-12 rounded bg-navy-100" />
            <div className="mt-1 h-3.5 w-20 rounded bg-navy-50" />
          </div>
        ))}
      </div>
      {/* Card skeletons */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-navy-100 bg-white p-6"
        >
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-lg bg-navy-50" />
            <div className="flex-1">
              <div className="h-5 w-48 rounded bg-navy-100" />
              <div className="mt-2 h-4 w-64 rounded bg-navy-50" />
            </div>
            <div className="h-5 w-16 rounded-full bg-navy-50" />
          </div>
          <div className="ml-14 mt-4 h-2 w-full rounded-full bg-navy-50" />
          <div className="ml-14 mt-3 flex items-center gap-4">
            <div className="h-3.5 w-24 rounded bg-navy-50" />
            <div className="h-3.5 w-24 rounded bg-navy-50" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-navy-200 bg-white p-12">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <svg
            className="h-6 w-6 text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="font-heading text-xl font-semibold text-navy-950">
          No cycles yet
        </h2>
        <p className="mt-2 text-sm text-navy-400">
          Cycles are time-boxed planning periods that keep your team focused.
          Create your first cycle to start organizing work.
        </p>
        <button
          onClick={onCreateClick}
          className="mt-6 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800"
        >
          + New Cycle
        </button>
      </div>
    </div>
  );
}

function CycleCard({
  cycle,
  counts,
}: {
  cycle: Cycle;
  counts: CycleCounts;
}) {
  const router = useRouter();
  const config = statusConfig[cycle.status] ?? statusConfig.planning;
  const progress =
    cycle.status === "active"
      ? getWeekProgress(cycle.startDate, cycle.endDate)
      : null;

  return (
    <button
      type="button"
      onClick={() => router.push(`/dashboard/cycles/${cycle.id}`)}
      className="w-full cursor-pointer rounded-xl border border-navy-100 bg-white p-6 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        {/* Status-colored icon */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${config.iconBg}`}
        >
          <svg
            className={`h-5 w-5 ${config.iconColor}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full ${config.dot}`}
                />
                <h3 className="font-heading text-lg font-semibold text-navy-950">
                  {cycle.name}
                </h3>
              </div>
              <p className="mt-1 text-sm text-navy-500">
                {formatDateRange(cycle.startDate, cycle.endDate)}
              </p>
            </div>
            <StatusBadge status={cycle.status} />
          </div>

          {progress && (
            <ProgressBar
              currentWeek={progress.currentWeek}
              totalWeeks={progress.totalWeeks}
              percent={progress.percent}
            />
          )}

          <div className="mt-3 flex items-center gap-3 text-xs text-navy-400">
            <span className="flex items-center gap-1">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
                />
              </svg>
              {counts.narratives}{" "}
              {counts.narratives === 1 ? "narrative" : "narratives"}
            </span>
            {counts.commitments > 0 && (
              <>
                <span className="text-navy-200">&middot;</span>
                <span>
                  {counts.commitments}{" "}
                  {counts.commitments === 1 ? "commitment" : "commitments"}
                </span>
              </>
            )}
            {counts.tasks > 0 && (
              <>
                <span className="text-navy-200">&middot;</span>
                <span>
                  {counts.tasks} {counts.tasks === 1 ? "task" : "tasks"}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function NewCycleForm({
  years,
  defaults,
  onCreated,
  onCancel,
}: {
  years: Year[];
  defaults?: CycleDefaults;
  onCreated: (cycle: Cycle) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(defaults?.name ?? "");
  const [startDate, setStartDate] = useState(defaults?.startDate ?? "");
  const [endDate, setEndDate] = useState(defaults?.endDate ?? "");
  const [yearId, setYearId] = useState(years[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || !startDate || !endDate || !yearId) return;

    if (new Date(endDate) <= new Date(startDate)) {
      setError("End date must be after start date.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          startDate,
          endDate,
          yearId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create cycle");
      }

      const created: Cycle = await res.json();
      onCreated(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-navy-100 bg-white p-6"
    >
      <h3 className="font-heading text-base font-semibold text-navy-950">
        New Cycle
      </h3>

      {defaults?.name && (
        <p className="mt-1.5 text-xs text-navy-400">
          Pre-filled based on your workspace planning settings. Feel free to adjust.
        </p>
      )}

      {error && (
        <div className="mt-3 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="cycle-name"
            className="mb-1.5 block text-sm font-medium text-navy-900"
          >
            Name
          </label>
          <input
            id="cycle-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Q1 2026"
            required
            className="w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-300 focus:border-amber-500 focus:outline-none"
          />
        </div>

        {years.length > 1 && (
          <div>
            <label
              htmlFor="cycle-year"
              className="mb-1.5 block text-sm font-medium text-navy-900"
            >
              Year
            </label>
            <select
              id="cycle-year"
              value={yearId}
              onChange={(e) => setYearId(e.target.value)}
              className="w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 focus:border-amber-500 focus:outline-none"
            >
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.year}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="cycle-start"
              className="mb-1.5 block text-sm font-medium text-navy-900"
            >
              Start date
            </label>
            <input
              id="cycle-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 focus:border-amber-500 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="cycle-end"
              className="mb-1.5 block text-sm font-medium text-navy-900"
            >
              End date
            </label>
            <input
              id="cycle-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 focus:border-amber-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <button
          type="submit"
          disabled={submitting || !name.trim() || !startDate || !endDate}
          className="rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Creating\u2026" : "Create Cycle"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-navy-200 px-4 py-2.5 text-sm font-medium text-navy-900 transition-colors hover:bg-navy-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ─── Stats Row ───────────────────────────────────────────────────────

function StatsRow({ cycles }: { cycles: Cycle[] }) {
  const active = cycles.filter((c) => c.status === "active").length;
  const planning = cycles.filter((c) => c.status === "planning").length;
  const archived = cycles.filter((c) => c.status === "archived").length;

  const stats = [
    {
      label: "Total Cycles",
      value: cycles.length,
      iconBg: "bg-navy-50",
      iconColor: "text-navy-600",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
        />
      ),
    },
    {
      label: "Active",
      value: active,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
        />
      ),
    },
    {
      label: "Planning",
      value: planning,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
        />
      ),
    },
    {
      label: "Archived",
      value: archived,
      iconBg: "bg-navy-50",
      iconColor: "text-navy-500",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
        />
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-navy-100 bg-white p-4"
        >
          <div
            className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${stat.iconBg}`}
          >
            <svg
              className={`h-4.5 w-4.5 ${stat.iconColor}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              {stat.icon}
            </svg>
          </div>
          <p className="font-heading text-2xl font-bold text-navy-950">
            {stat.value}
          </p>
          <p className="mt-0.5 text-xs text-navy-400">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Inner page (uses useSearchParams) ───────────────────────────────

function CyclesPageInner() {
  const searchParams = useSearchParams();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [counts, setCounts] = useState<Record<string, CycleCounts>>({});
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [cycleDefaults, setCycleDefaults] = useState<CycleDefaults | undefined>(
    undefined
  );

  // Auto-open form if ?new=true
  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setShowNewForm(true);
      // Clean up URL so refresh doesn't re-trigger
      window.history.replaceState({}, "", "/dashboard/cycles");
    }
  }, [searchParams]);

  const loadCounts = useCallback(async (cycleList: Cycle[]) => {
    try {
      const [narrativesRes, commitmentsRes, tasksRes] = await Promise.all([
        fetch("/api/narratives"),
        fetch("/api/commitments"),
        fetch("/api/tasks"),
      ]);

      const narratives: Narrative[] = await narrativesRes.json();
      const commitments: Commitment[] = await commitmentsRes.json();
      const tasks: Task[] = await tasksRes.json();

      const narrativesByCycle = new Map<string, Narrative[]>();
      for (const n of narratives) {
        if (n.cycleId) {
          const list = narrativesByCycle.get(n.cycleId) || [];
          list.push(n);
          narrativesByCycle.set(n.cycleId, list);
        }
      }

      const commitmentsByNarrative = new Map<string, Commitment[]>();
      for (const c of commitments) {
        const list = commitmentsByNarrative.get(c.narrativeId) || [];
        list.push(c);
        commitmentsByNarrative.set(c.narrativeId, list);
      }

      const tasksByCommitment = new Map<string, Task[]>();
      for (const t of tasks) {
        const list = tasksByCommitment.get(t.commitmentId) || [];
        list.push(t);
        tasksByCommitment.set(t.commitmentId, list);
      }

      const newCounts: Record<string, CycleCounts> = {};
      for (const cy of cycleList) {
        const cycleNarratives = narrativesByCycle.get(cy.id) || [];
        let commitmentCount = 0;
        let taskCount = 0;

        for (const n of cycleNarratives) {
          const narComm = commitmentsByNarrative.get(n.id) || [];
          commitmentCount += narComm.length;
          for (const c of narComm) {
            const commTasks = tasksByCommitment.get(c.id) || [];
            taskCount += commTasks.length;
          }
        }

        newCounts[cy.id] = {
          narratives: cycleNarratives.length,
          commitments: commitmentCount,
          tasks: taskCount,
        };
      }

      setCounts(newCounts);
    } catch {
      // Fail silently — counts will remain at 0
    }
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const [cyclesRes, treeRes, workspacesRes] = await Promise.all([
          fetch("/api/cycles"),
          fetch("/api/nct-tree"),
          fetch("/api/workspaces"),
        ]);

        const cyclesData: Cycle[] = await cyclesRes.json();
        setCycles(cyclesData);

        // Extract years from the tree response
        const treeData = await treeRes.json();
        if (treeData.years) {
          setYears(
            treeData.years.map((y: { id: string; year: number }) => ({
              id: y.id,
              year: y.year,
            }))
          );
        }

        // Compute cycle defaults from workspace settings
        if (workspacesRes.ok) {
          const workspaces = await workspacesRes.json();
          if (workspaces.length > 0) {
            const ws = workspaces[0] as WorkspaceSettings;
            const defaults = computeCycleDefaults(
              ws.planningRhythm || "quarters",
              ws.cycleLengthWeeks,
              cyclesData
            );
            setCycleDefaults(defaults);
          }
        }

        await loadCounts(cyclesData);
      } catch {
        // Fail silently
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [loadCounts]);

  function handleCycleCreated(newCycle: Cycle) {
    const updated = [newCycle, ...cycles];
    setCycles(updated);
    setCounts((prev) => ({
      ...prev,
      [newCycle.id]: { narratives: 0, commitments: 0, tasks: 0 },
    }));
    setShowNewForm(false);
    toast.success("Cycle created");
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-navy-950">
            Cycles
          </h1>
          <p className="mt-1 text-sm text-navy-400">
            Your planning periods.
          </p>
        </div>
        {!loading && cycles.length > 0 && !showNewForm && (
          <button
            onClick={() => setShowNewForm(true)}
            className="rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800"
          >
            + New Cycle
          </button>
        )}
      </div>

      {/* Stats row */}
      {!loading && cycles.length > 0 && (
        <div className="mt-6">
          <StatsRow cycles={cycles} />
        </div>
      )}

      <div className="mt-6">
        {/* New cycle form */}
        {showNewForm && (
          <div className="mb-6">
            <NewCycleForm
              years={years}
              defaults={cycleDefaults}
              onCreated={handleCycleCreated}
              onCancel={() => setShowNewForm(false)}
            />
          </div>
        )}

        {/* Content */}
        {loading ? (
          <LoadingSkeleton />
        ) : cycles.length === 0 && !showNewForm ? (
          <EmptyState onCreateClick={() => setShowNewForm(true)} />
        ) : (
          <div className="grid gap-4">
            {cycles.map((c) => (
              <CycleCard
                key={c.id}
                cycle={c}
                counts={
                  counts[c.id] ?? { narratives: 0, commitments: 0, tasks: 0 }
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page (Suspense wrapper for useSearchParams) ─────────────────────

export default function CyclesPage() {
  return (
    <Suspense
      fallback={
        <div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-2xl font-semibold text-navy-950">
                Cycles
              </h1>
              <p className="mt-1 text-sm text-navy-400">
                Your planning periods.
              </p>
            </div>
          </div>
          <div className="mt-8">
            <LoadingSkeleton />
          </div>
        </div>
      }
    >
      <CyclesPageInner />
    </Suspense>
  );
}
