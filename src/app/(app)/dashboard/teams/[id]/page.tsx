"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface TeamMember {
  id: string;
  userId: string;
  createdAt: string;
  user: { id: string; name: string; email: string; image: string | null };
}

interface WorkspaceMember {
  id: string;
  userId: string;
  role: string;
  user: { id: string; name: string; email: string; image: string | null };
}

interface TeamDashboardData {
  team: { id: string; name: string };
  stats: {
    totalNarratives: number;
    activeNarratives: number;
    draftNarratives: number;
    atRiskNarratives: number;
    completedNarratives: number;
    totalCommitments: number;
    activeCommitments: number;
    atRiskCommitments: number;
    completedCommitments: number;
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    blockedTasks: number;
  };
  narratives: {
    id: string;
    title: string;
    status: string;
    cycleId: string | null;
    commitmentCount: number;
    taskCount: number;
    tasksDone: number;
  }[];
  members: TeamMember[];
}

const statusConfig: Record<
  string,
  { label: string; dot: string; bg: string; text: string }
> = {
  active: {
    label: "Active",
    dot: "bg-green-400",
    bg: "bg-green-50",
    text: "text-green-700",
  },
  at_risk: {
    label: "At Risk",
    dot: "bg-red-400",
    bg: "bg-red-50",
    text: "text-red-700",
  },
  draft: {
    label: "Draft",
    dot: "bg-navy-300",
    bg: "bg-navy-50",
    text: "text-navy-500",
  },
  completed: {
    label: "Completed",
    dot: "bg-blue-400",
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
  archived: {
    label: "Archived",
    dot: "bg-navy-200",
    bg: "bg-navy-50",
    text: "text-navy-400",
  },
};

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
  progress,
}: {
  label: string;
  value: number;
  sub?: string;
  icon: React.ReactNode;
  accent?: string;
  progress?: { value: number; max: number };
}) {
  return (
    <div className="rounded-xl border border-navy-100 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-navy-400">{label}</p>
          <p
            className={`mt-1 font-heading text-2xl font-bold ${accent || "text-navy-950"}`}
          >
            {value}
          </p>
          {sub && <p className="mt-0.5 text-xs text-navy-400">{sub}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-50">
          {icon}
        </div>
      </div>
      {progress && progress.max > 0 && (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy-100">
            <div
              className="h-full rounded-full bg-green-400 transition-all duration-500"
              style={{
                width: `${Math.round((progress.value / progress.max) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function NarrativeCard({
  n,
}: {
  n: TeamDashboardData["narratives"][number];
}) {
  const cfg = statusConfig[n.status] || statusConfig.draft;
  const taskPercent =
    n.taskCount > 0 ? Math.round((n.tasksDone / n.taskCount) * 100) : 0;

  return (
    <Link
      href={`/dashboard/narratives/${n.id}`}
      className="group block rounded-xl border border-navy-100 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        {/* Icon container */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${cfg.bg}`}
        >
          <svg
            className={`h-5 w-5 ${cfg.text}`}
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

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-navy-950 group-hover:text-amber-700">
              {n.title}
            </h3>
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>

          {/* Meta row */}
          <div className="mt-2 flex items-center gap-4 text-xs text-navy-400">
            {/* Commitments */}
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
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              {n.commitmentCount} commitment
              {n.commitmentCount !== 1 ? "s" : ""}
            </span>

            {/* Tasks */}
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
                  d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z"
                />
              </svg>
              {n.tasksDone}/{n.taskCount} tasks done
            </span>
          </div>

          {/* Task progress bar */}
          {n.taskCount > 0 && (
            <div className="mt-2.5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy-100">
                <div
                  className="h-full rounded-full bg-green-400 transition-all duration-500"
                  style={{ width: `${taskPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-pulse">
      <div>
        <div className="h-4 w-24 rounded bg-navy-100" />
        <div className="mt-4 h-8 w-64 rounded-lg bg-navy-100" />
        <div className="mt-2 h-4 w-48 rounded bg-navy-50" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-navy-50" />
        ))}
      </div>
      <div className="space-y-3">
        <div className="h-5 w-32 rounded bg-navy-100" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-navy-50" />
        ))}
      </div>
    </div>
  );
}

function TeamMembersSection({
  teamId,
  members,
  isAdmin,
  onMembersChange,
}: {
  teamId: string;
  members: TeamMember[];
  isAdmin: boolean;
  onMembersChange: () => void;
}) {
  const [managing, setManaging] = useState(false);
  const [wsMembersList, setWsMembersList] = useState<WorkspaceMember[]>([]);
  const [loadingWs, setLoadingWs] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState<{
    userId: string;
    name: string;
  } | null>(null);

  function openManage() {
    setManaging(true);
    if (wsMembersList.length === 0) {
      setLoadingWs(true);
      fetch("/api/members")
        .then((r) => r.json())
        .then((data) => setWsMembersList(data))
        .catch(() => {})
        .finally(() => setLoadingWs(false));
    }
  }

  async function addMember(userId: string) {
    setAdding(userId);
    try {
      const res = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        onMembersChange();
        toast.success("Member added to team");
      } else {
        toast.error("Failed to add member");
      }
    } catch {
      toast.error("Failed to add member");
    }
    setAdding(null);
  }

  async function removeMember(userId: string) {
    setRemoving(userId);
    try {
      const res = await fetch(`/api/teams/${teamId}/members/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onMembersChange();
        toast.success("Member removed from team");
      } else {
        toast.error("Failed to remove member");
      }
    } catch {
      toast.error("Failed to remove member");
    }
    setRemoving(null);
  }

  const memberUserIds = new Set(members.map((m) => m.userId));
  const availableMembers = wsMembersList.filter(
    (wm) => !memberUserIds.has(wm.userId),
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-navy-950">
          Team Members ({members.length})
        </h2>
        {isAdmin && (
          <button
            onClick={() => (managing ? setManaging(false) : openManage())}
            className="inline-flex items-center gap-1.5 rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-700 transition-colors hover:bg-navy-50"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              {managing ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18 18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
                />
              )}
            </svg>
            {managing ? "Done" : "Manage"}
          </button>
        )}
      </div>

      {/* Members avatar row */}
      {members.length > 0 ? (
        <div className="rounded-xl border border-navy-100 bg-white p-4">
          <div className="flex flex-wrap gap-3">
            {members.map((m) => (
              <div
                key={m.userId}
                className="group relative flex items-center gap-2 rounded-lg border border-navy-100 px-3 py-2 text-sm"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-100 text-xs font-medium text-navy-600">
                  {m.user.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <span className="font-medium text-navy-900">
                  {m.user.name}
                </span>
                {managing && isAdmin && (
                  <button
                    onClick={() =>
                      setRemoveConfirm({
                        userId: m.userId,
                        name: m.user.name || m.user.email,
                      })
                    }
                    disabled={removing === m.userId}
                    className="ml-1 rounded p-0.5 text-navy-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                    title="Remove from team"
                  >
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
                        d="M6 18 18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-navy-200 p-6 text-center">
          <p className="text-sm text-navy-400">
            No members assigned to this team yet.
          </p>
          {isAdmin && !managing && (
            <button
              onClick={openManage}
              className="mt-2 text-sm font-medium text-amber-500 hover:text-amber-400"
            >
              Add members
            </button>
          )}
        </div>
      )}

      {/* Manage panel: add workspace members to team */}
      {managing && isAdmin && (
        <div className="rounded-xl border border-navy-100 bg-navy-50/50 p-4">
          <p className="mb-3 text-xs font-medium text-navy-500">
            Add workspace members to this team
          </p>
          {loadingWs ? (
            <div className="animate-pulse space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-10 rounded-lg bg-navy-100" />
              ))}
            </div>
          ) : availableMembers.length === 0 ? (
            <p className="text-xs text-navy-400">
              All workspace members are already in this team.
            </p>
          ) : (
            <div className="space-y-1.5">
              {availableMembers.map((wm) => (
                <div
                  key={wm.userId}
                  className="flex items-center justify-between rounded-lg bg-white px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-100 text-xs font-medium text-navy-600">
                      {wm.user.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-navy-900">
                        {wm.user.name}
                      </p>
                      <p className="text-xs text-navy-400">{wm.user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => addMember(wm.userId)}
                    disabled={adding === wm.userId}
                    className="rounded-lg bg-navy-950 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-navy-800 disabled:opacity-50"
                  >
                    {adding === wm.userId ? "Adding..." : "Add"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Remove member confirmation */}
      <ConfirmDialog
        open={removeConfirm !== null}
        title="Remove member"
        description={`Are you sure you want to remove ${removeConfirm?.name} from this team?`}
        confirmLabel="Remove"
        variant="danger"
        loading={removing !== null}
        onConfirm={async () => {
          if (removeConfirm) {
            await removeMember(removeConfirm.userId);
            setRemoveConfirm(null);
          }
        }}
        onCancel={() => setRemoveConfirm(null)}
      />
    </div>
  );
}

export default function TeamDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const [data, setData] = useState<TeamDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("editor");

  function fetchData() {
    fetch(`/api/teams/${id}/dashboard`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((json) => setData(json))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchData();
  }, [id]);

  // Determine user role from workspace members
  useEffect(() => {
    if (!session?.user?.id) return;
    fetch("/api/members")
      .then((r) => r.json())
      .then((members: WorkspaceMember[]) => {
        const me = members.find(
          (m: WorkspaceMember) => m.userId === session.user.id,
        );
        if (me) setUserRole(me.role);
      })
      .catch(() => {});
  }, [session?.user?.id]);

  const isAdmin = userRole === "owner" || userRole === "admin";

  if (loading) return <LoadingSkeleton />;

  if (!data) {
    return (
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard/settings#teams"
          className="inline-flex items-center gap-1 text-sm text-navy-400 hover:text-navy-600"
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
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
          Back to Settings
        </Link>
        <p className="mt-6 text-sm text-navy-400">
          Team not found or you don&apos;t have access.
        </p>
      </div>
    );
  }

  const { team, stats, narratives } = data;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Back link + Header */}
      <div>
        <Link
          href="/dashboard/settings#teams"
          className="inline-flex items-center gap-1 text-sm text-navy-400 hover:text-navy-600"
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
              d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
            />
          </svg>
          Back to Settings
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-50">
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
                d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>
          </div>
          <div>
            <h1 className="font-heading text-2xl font-semibold text-navy-950">
              {team.name}
            </h1>
            <p className="text-sm text-navy-400">
              Team overview &middot; {stats.totalNarratives} narrative
              {stats.totalNarratives !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Team Members */}
      <TeamMembersSection
        teamId={team.id}
        members={data.members}
        isAdmin={isAdmin}
        onMembersChange={fetchData}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Narratives"
          value={stats.activeNarratives}
          sub={`${stats.totalNarratives} total`}
          accent={stats.activeNarratives > 0 ? "text-navy-950" : undefined}
          icon={
            <svg
              className="h-5 w-5 text-navy-400"
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
          }
        />
        <StatCard
          label="Commitments at Risk"
          value={stats.atRiskCommitments}
          sub={`${stats.totalCommitments} total`}
          accent={stats.atRiskCommitments > 0 ? "text-red-600" : undefined}
          icon={
            <svg
              className="h-5 w-5 text-navy-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          }
        />
        <StatCard
          label="Tasks Completed"
          value={stats.completedTasks}
          sub={`${stats.totalTasks} total`}
          icon={
            <svg
              className="h-5 w-5 text-navy-400"
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
          }
          progress={{ value: stats.completedTasks, max: stats.totalTasks }}
        />
        <StatCard
          label="Overdue Tasks"
          value={stats.overdueTasks}
          sub={
            stats.blockedTasks > 0
              ? `${stats.blockedTasks} blocked`
              : undefined
          }
          accent={stats.overdueTasks > 0 ? "text-amber-600" : undefined}
          icon={
            <svg
              className="h-5 w-5 text-navy-400"
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
          }
        />
      </div>

      {/* Narratives section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-navy-950">
            Narratives ({narratives.length})
          </h2>
          <Link
            href={`/dashboard/narratives/new?teamId=${team.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-navy-950 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-navy-800"
          >
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
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            New Narrative
          </Link>
        </div>

        {narratives.length === 0 ? (
          <div className="rounded-xl border border-navy-100 bg-white p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-navy-50">
              <svg
                className="h-7 w-7 text-navy-300"
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
            <p className="text-lg font-semibold text-navy-950">
              No narratives yet
            </p>
            <p className="mt-1 text-sm text-navy-400">
              Create a narrative to start tracking this team&apos;s strategic
              goals.
            </p>
            <Link
              href={`/dashboard/narratives/new?teamId=${team.id}`}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-navy-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy-800"
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
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Create Narrative
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {narratives.map((n) => (
              <NarrativeCard key={n.id} n={n} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
