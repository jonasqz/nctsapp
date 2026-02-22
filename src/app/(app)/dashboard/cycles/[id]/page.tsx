"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
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

interface Team {
  id: string;
  name: string;
}

interface Narrative {
  id: string;
  title: string;
  status: string;
  cycleId: string | null;
  teamId: string | null;
}

interface Commitment {
  id: string;
  title: string;
  status: string;
  narrativeId: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  commitmentId: string;
}

// ─── Status config ───────────────────────────────────────────────────

const cycleStatusConfig: Record<
  string,
  { label: string; badge: string }
> = {
  planning: { label: "Planning", badge: "bg-blue-100 text-blue-700" },
  active: { label: "Active", badge: "bg-green-100 text-green-700" },
  review: { label: "Review", badge: "bg-amber-100 text-amber-700" },
  archived: { label: "Archived", badge: "bg-navy-100 text-navy-600" },
};

const narrativeStatusConfig: Record<
  string,
  { label: string; dot: string }
> = {
  active: { label: "Active", dot: "bg-green-400" },
  at_risk: { label: "At Risk", dot: "bg-amber-400" },
  completed: { label: "Completed", dot: "bg-navy-400" },
  draft: { label: "Draft", dot: "bg-navy-300" },
  archived: { label: "Archived", dot: "bg-navy-300" },
};

const cycleStatuses: Array<Cycle["status"]> = [
  "planning",
  "active",
  "review",
  "archived",
];

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

function getWeekProgress(start: string, end: string) {
  const now = new Date();
  const s = new Date(start);
  const e = new Date(end);

  const totalMs = e.getTime() - s.getTime();
  const elapsedMs = Math.max(0, Math.min(totalMs, now.getTime() - s.getTime()));
  const totalWeeks = Math.max(1, Math.round(totalMs / (7 * 24 * 60 * 60 * 1000)));
  const currentWeek = Math.min(
    totalWeeks,
    Math.max(1, Math.ceil((elapsedMs / totalMs) * totalWeeks))
  );
  const percent = Math.min(100, Math.round((elapsedMs / totalMs) * 100));

  return { currentWeek, totalWeeks, percent };
}

function computeHealth(
  narratives: Narrative[],
  commitments: Commitment[],
  tasks: Task[]
): number {
  if (narratives.length === 0) return 0;

  let score = 100;

  // Penalize at-risk narratives
  const atRiskNarratives = narratives.filter((n) => n.status === "at_risk").length;
  score -= atRiskNarratives * 10;

  // Penalize at-risk / blocked commitments
  const atRiskCommitments = commitments.filter(
    (c) => c.status === "at_risk" || c.status === "blocked"
  ).length;
  score -= atRiskCommitments * 5;

  // Penalize blocked tasks
  const blockedTasks = tasks.filter((t) => t.status === "blocked").length;
  score -= blockedTasks * 2;

  return Math.max(0, Math.min(100, score));
}

function healthColor(score: number): {
  bg: string;
  text: string;
  dot: string;
} {
  if (score >= 80) return { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-400" };
  if (score >= 60) return { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" };
  return { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" };
}

// ─── Subcomponents ───────────────────────────────────────────────────

function StatusDropdown({
  currentStatus,
  onChangeStatus,
}: {
  currentStatus: Cycle["status"];
  onChangeStatus: (status: Cycle["status"]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const config = cycleStatusConfig[currentStatus] ?? cycleStatusConfig.planning;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${config.badge}`}
      >
        {config.label}
        <svg
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-lg border border-navy-100 bg-white py-1 shadow-lg">
          {cycleStatuses.map((s) => {
            const sc = cycleStatusConfig[s];
            return (
              <button
                key={s}
                onClick={() => {
                  onChangeStatus(s);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-navy-50 ${
                  s === currentStatus ? "font-medium" : ""
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${cycleStatusConfig[s]?.badge.includes("blue") ? "bg-blue-400" : s === "active" ? "bg-green-400" : s === "review" ? "bg-amber-400" : "bg-navy-400"}`}
                />
                {sc.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-navy-100 bg-white p-5">
      <p
        className={`text-2xl font-semibold ${accent ?? "text-navy-950"}`}
      >
        {value}
      </p>
      <p className="mt-1 text-sm text-navy-400">{label}</p>
    </div>
  );
}

function NarrativeRow({
  narrative,
  commitmentCount,
  tasksDone,
  tasksTotal,
}: {
  narrative: Narrative;
  commitmentCount: number;
  tasksDone: number;
  tasksTotal: number;
}) {
  const config =
    narrativeStatusConfig[narrative.status] ?? narrativeStatusConfig.draft;

  return (
    <Link
      href={`/dashboard/narratives/${narrative.id}`}
      className="flex items-center justify-between rounded-lg border border-navy-50 bg-white px-5 py-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="min-w-0 flex-1">
        <h4 className="font-heading text-base font-semibold text-navy-950">
          {narrative.title}
        </h4>
        <p className="mt-1 text-xs text-navy-400">
          {commitmentCount}{" "}
          {commitmentCount === 1 ? "commitment" : "commitments"}
          {tasksTotal > 0 && (
            <>
              {" "}
              &middot; {tasksDone}/{tasksTotal} tasks complete
            </>
          )}
        </p>
      </div>
      <div className="ml-4 flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${config.dot}`} />
        <span className="text-xs font-medium text-navy-500">
          {config.label}
        </span>
      </div>
    </Link>
  );
}

// ─── Page ────────────────────────────────────────────────────────────

export default function CycleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [narratives, setNarratives] = useState<Narrative[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const cycleRes = await fetch(`/api/cycles/${id}`);
      if (!cycleRes.ok) {
        setError("Cycle not found");
        setLoading(false);
        return;
      }
      const cycleData: Cycle = await cycleRes.json();
      setCycle(cycleData);

      // Fetch teams, narratives for this cycle, all commitments, all tasks in parallel
      const [teamsRes, narrativesRes, commitmentsRes, tasksRes] =
        await Promise.all([
          fetch("/api/teams"),
          fetch(`/api/narratives?cycleId=${id}`),
          fetch("/api/commitments"),
          fetch("/api/tasks"),
        ]);

      const teamsData: Team[] = await teamsRes.json();
      const narrativesData: Narrative[] = await narrativesRes.json();
      const commitmentsData: Commitment[] = await commitmentsRes.json();
      const tasksData: Task[] = await tasksRes.json();

      setTeams(teamsData);
      setNarratives(narrativesData);

      // Filter commitments to only those belonging to this cycle's narratives
      const cycleNarrativeIds = new Set(narrativesData.map((n) => n.id));
      const cycleCommitments = commitmentsData.filter((c) =>
        cycleNarrativeIds.has(c.narrativeId)
      );
      setCommitments(cycleCommitments);

      // Filter tasks to only those belonging to this cycle's commitments
      const cycleCommitmentIds = new Set(cycleCommitments.map((c) => c.id));
      const cycleTasks = tasksData.filter((t) =>
        cycleCommitmentIds.has(t.commitmentId)
      );
      setTasks(cycleTasks);
    } catch {
      setError("Failed to load cycle");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Handlers ──────────────────────────────────────────────────────

  async function handleStatusChange(newStatus: Cycle["status"]) {
    if (!cycle) return;
    const res = await fetch(`/api/cycles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated: Cycle = await res.json();
      setCycle(updated);
      toast.success(`Status changed to ${newStatus}`);
    } else {
      toast.error("Failed to update status");
    }
  }

  function startEditing() {
    if (!cycle) return;
    setEditName(cycle.name);
    // Format dates for input[type=date]
    setEditStartDate(new Date(cycle.startDate).toISOString().split("T")[0]);
    setEditEndDate(new Date(cycle.endDate).toISOString().split("T")[0]);
    setEditing(true);
  }

  async function saveEdit() {
    if (!editName.trim() || !editStartDate || !editEndDate) return;
    if (new Date(editEndDate) <= new Date(editStartDate)) return;

    setSaving(true);
    const res = await fetch(`/api/cycles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName.trim(),
        startDate: editStartDate,
        endDate: editEndDate,
      }),
    });
    if (res.ok) {
      const updated: Cycle = await res.json();
      setCycle(updated);
      setEditing(false);
      toast.success("Cycle updated");
    } else {
      toast.error("Failed to update cycle");
    }
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/cycles/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Cycle deleted");
      router.push("/dashboard/cycles");
    } else {
      toast.error("Failed to delete cycle");
    }
    setDeleting(false);
  }

  // ─── Loading / Error ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="animate-pulse">
          <div className="h-4 w-32 rounded bg-navy-100" />
          <div className="mt-6 h-8 w-64 rounded bg-navy-100" />
          <div className="mt-2 h-4 w-48 rounded bg-navy-50" />
          <div className="mt-8 h-3 w-full rounded-full bg-navy-50" />
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl border border-navy-100 bg-white p-5"
              >
                <div className="h-6 w-8 rounded bg-navy-100" />
                <div className="mt-2 h-3 w-24 rounded bg-navy-50" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !cycle) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-navy-400">{error || "Cycle not found"}</p>
        <Link
          href="/dashboard/cycles"
          className="mt-4 text-sm font-medium text-amber-500 hover:text-amber-600"
        >
          Back to Cycles
        </Link>
      </div>
    );
  }

  // ─── Computed values ──────────────────────────────────────────────

  const progress = getWeekProgress(cycle.startDate, cycle.endDate);
  const healthScore = computeHealth(narratives, commitments, tasks);
  const hc = healthColor(healthScore);

  // Build per-narrative lookup maps
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

  // Group narratives by team
  const narrativesByTeam = new Map<string | null, Narrative[]>();
  for (const n of narratives) {
    const key = n.teamId;
    const list = narrativesByTeam.get(key) || [];
    list.push(n);
    narrativesByTeam.set(key, list);
  }

  // Teams that have narratives in this cycle + teams with no narratives
  const teamsWithNarratives = teams.filter(
    (t) => narrativesByTeam.has(t.id) && (narrativesByTeam.get(t.id)?.length ?? 0) > 0
  );
  const teamsWithout = teams.filter(
    (t) => !narrativesByTeam.has(t.id) || (narrativesByTeam.get(t.id)?.length ?? 0) === 0
  );
  const unassignedNarratives = narrativesByTeam.get(null) || [];

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-5xl">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-navy-400">
        <Link
          href="/dashboard/cycles"
          className="transition-colors hover:text-navy-900"
        >
          Cycles
        </Link>
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
            d="M9 5l7 7-7 7"
          />
        </svg>
        <span className="font-medium text-navy-900">{cycle.name}</span>
      </nav>

      {/* Back link */}
      <Link
        href="/dashboard/cycles"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-navy-400 transition-colors hover:text-navy-900"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Cycles
      </Link>

      {/* Header */}
      {editing ? (
        <div className="rounded-xl border border-navy-100 bg-white p-6">
          <h3 className="font-heading text-base font-semibold text-navy-950">
            Edit Cycle
          </h3>
          <div className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="edit-name"
                className="mb-1.5 block text-sm font-medium text-navy-900"
              >
                Name
              </label>
              <input
                id="edit-name"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="edit-start"
                  className="mb-1.5 block text-sm font-medium text-navy-900"
                >
                  Start date
                </label>
                <input
                  id="edit-start"
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className="w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="edit-end"
                  className="mb-1.5 block text-sm font-medium text-navy-900"
                >
                  End date
                </label>
                <input
                  id="edit-end"
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                  className="w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button
              onClick={saveEdit}
              disabled={saving}
              className="rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800 disabled:opacity-50"
            >
              {saving ? "Saving\u2026" : "Save Changes"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg border border-navy-200 px-4 py-2.5 text-sm font-medium text-navy-900 transition-colors hover:bg-navy-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-heading text-2xl font-semibold text-navy-950">
                {cycle.name}{" "}
                <span className="font-normal text-navy-400">
                  &middot; {formatDateRange(cycle.startDate, cycle.endDate)}
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <StatusDropdown
                currentStatus={cycle.status}
                onChangeStatus={handleStatusChange}
              />
              <button
                onClick={startEditing}
                className="rounded-lg border border-navy-200 px-3.5 py-2 text-sm font-medium text-navy-900 transition-colors hover:bg-navy-50"
              >
                Edit
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-lg border border-red-200 px-3.5 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Delete confirmation */}
          {showDeleteConfirm && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-900">
                Are you sure you want to delete this cycle?
              </p>
              <p className="mt-1 text-sm text-red-600">
                This will permanently remove the cycle. Narratives assigned to
                this cycle will become unassigned.
              </p>
              <div className="mt-3 flex gap-3">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? "Deleting\u2026" : "Yes, delete"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-lg border border-navy-200 px-4 py-2 text-sm font-medium text-navy-900 transition-colors hover:bg-navy-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Progress bar */}
      {!editing && (
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm text-navy-500">
            <span>
              Week {progress.currentWeek} of {progress.totalWeeks}
            </span>
            <span className="font-medium">{progress.percent}%</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-navy-100">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Summary stats */}
      {!editing && (
        <div className="mt-8 grid grid-cols-3 gap-4">
          <StatCard
            label={
              narratives.length === 1 ? "Active Narrative" : "Active Narratives"
            }
            value={narratives.filter((n) => n.status === "active").length}
          />
          <StatCard
            label={
              commitments.length === 1 ? "Commitment" : "Commitments"
            }
            value={commitments.length}
          />
          <div
            className={`rounded-xl border border-navy-100 p-5 ${hc.bg}`}
          >
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-semibold ${hc.text}`}>
                {healthScore}
              </p>
              <span
                className={`h-3 w-3 rounded-full ${hc.dot}`}
              />
            </div>
            <p className="mt-1 text-sm text-navy-400">Health</p>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="my-8 border-t border-navy-100" />

      {/* Team sections */}
      {teamsWithNarratives.map((team) => {
        const teamNarratives = narrativesByTeam.get(team.id) || [];
        return (
          <div key={team.id} className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <svg
                className="h-5 w-5 text-navy-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <h3 className="font-heading text-lg font-semibold text-navy-950">
                {team.name}
              </h3>
            </div>
            <div className="space-y-3">
              {teamNarratives.map((n) => {
                const nc = commitmentsByNarrative.get(n.id) || [];
                let totalTasks = 0;
                let doneTasks = 0;
                for (const c of nc) {
                  const ct = tasksByCommitment.get(c.id) || [];
                  totalTasks += ct.length;
                  doneTasks += ct.filter(
                    (t) => t.status === "done" || t.status === "completed"
                  ).length;
                }
                return (
                  <NarrativeRow
                    key={n.id}
                    narrative={n}
                    commitmentCount={nc.length}
                    tasksDone={doneTasks}
                    tasksTotal={totalTasks}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Unassigned narratives (no team) */}
      {unassignedNarratives.length > 0 && (
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <svg
              className="h-5 w-5 text-navy-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="font-heading text-lg font-semibold text-navy-950">
              Unassigned
            </h3>
          </div>
          <div className="space-y-3">
            {unassignedNarratives.map((n) => {
              const nc = commitmentsByNarrative.get(n.id) || [];
              let totalTasks = 0;
              let doneTasks = 0;
              for (const c of nc) {
                const ct = tasksByCommitment.get(c.id) || [];
                totalTasks += ct.length;
                doneTasks += ct.filter(
                  (t) => t.status === "done" || t.status === "completed"
                ).length;
              }
              return (
                <NarrativeRow
                  key={n.id}
                  narrative={n}
                  commitmentCount={nc.length}
                  tasksDone={doneTasks}
                  tasksTotal={totalTasks}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Teams with no narratives in this cycle */}
      {teamsWithout.map((team) => (
        <div key={team.id} className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <svg
              className="h-5 w-5 text-navy-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <h3 className="font-heading text-lg font-semibold text-navy-950">
              {team.name}
            </h3>
          </div>
          <div className="rounded-lg border-2 border-dashed border-navy-100 bg-white px-5 py-8 text-center">
            <p className="text-sm text-navy-400">
              No narratives in this cycle.{" "}
              <Link
                href="/dashboard/narratives/new"
                className="font-medium text-amber-500 hover:text-amber-600"
              >
                + Add Narrative
              </Link>
            </p>
          </div>
        </div>
      ))}

      {/* Completely empty state — no teams and no narratives */}
      {teams.length === 0 && narratives.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-navy-200 bg-white p-12 text-center">
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
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 className="font-heading text-lg font-semibold text-navy-900">
            No narratives in this cycle
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-navy-400">
            Create narratives and assign them to this cycle to start tracking
            progress.
          </p>
          <Link
            href="/dashboard/narratives/new"
            className="mt-6 inline-block rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800"
          >
            + New Narrative
          </Link>
        </div>
      )}
    </div>
  );
}
