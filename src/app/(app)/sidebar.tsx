"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SignOutButton } from "./sign-out-button";

// ---------- Types ----------

interface TaskNode {
  id: string;
  title: string;
  status: string;
}

interface CommitmentNode {
  id: string;
  title: string;
  status: string;
  tasks: TaskNode[];
}

interface NarrativeNode {
  id: string;
  title: string;
  status: string;
  commitments: CommitmentNode[];
}

interface TeamNode {
  id: string;
  name: string;
  narratives: NarrativeNode[];
}

interface CycleNode {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  teams: TeamNode[];
}

interface YearNode {
  id: string;
  year: number;
  cycles: CycleNode[];
}

interface WorkspaceTree {
  workspace: { id: string; name: string };
  strategy: string | null;
  years: YearNode[];
  uncategorized?: NarrativeNode[];
}

// ---------- Helpers ----------

const statusDot: Record<string, string> = {
  active: "bg-green-400",
  on_track: "bg-green-400",
  at_risk: "bg-amber-400",
  blocked: "bg-red-400",
  completed: "bg-navy-400",
  done: "bg-green-400",
  draft: "bg-navy-600",
  todo: "bg-navy-600",
  in_progress: "bg-blue-400",
};

const cycleStatusDot: Record<string, string> = {
  planning: "bg-blue-400",
  active: "bg-green-400",
  review: "bg-amber-400",
  archived: "bg-navy-600",
};

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ---------- Component ----------

export function Sidebar() {
  const pathname = usePathname();
  const [tree, setTree] = useState<WorkspaceTree | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Expanded state for each collapsible level
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});
  const [expandedCycles, setExpandedCycles] = useState<Record<string, boolean>>({});
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});
  const [expandedNarratives, setExpandedNarratives] = useState<Record<string, boolean>>({});
  const [expandedCommitments, setExpandedCommitments] = useState<Record<string, boolean>>({});
  const [expandedUncategorized, setExpandedUncategorized] = useState(true);

  useEffect(() => {
    fetch("/api/nct-tree")
      .then((res) => res.json())
      .then((data: WorkspaceTree) => {
        if (!data || !data.workspace) return;
        setTree(data);

        // Auto-expand years, active cycles, and their teams
        const yExp: Record<string, boolean> = {};
        const cExp: Record<string, boolean> = {};
        const tExp: Record<string, boolean> = {};
        const nExp: Record<string, boolean> = {};

        for (const year of data.years) {
          yExp[year.id] = true;
          for (const cycle of year.cycles) {
            if (cycle.status === "active") {
              cExp[cycle.id] = true;
              for (const team of cycle.teams) {
                tExp[team.id] = true;
                for (const narrative of team.narratives) {
                  nExp[narrative.id] = true;
                }
              }
            }
          }
        }

        setExpandedYears(yExp);
        setExpandedCycles(cExp);
        setExpandedTeams(tExp);
        setExpandedNarratives(nExp);
      })
      .catch(() => {});
  }, [pathname]);

  const toggle = (
    setter: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
    id: string,
  ) => {
    setter((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  // ---------- Render helpers ----------

  function renderTask(task: TaskNode) {
    const icon =
      task.status === "done"
        ? "\u2713"
        : task.status === "in_progress"
          ? "\u25D0"
          : task.status === "blocked"
            ? "\u2298"
            : "\u25CB";

    return (
      <div
        key={task.id}
        className="flex items-center gap-2 rounded-md px-2 py-0.5 text-xs text-navy-400"
      >
        <span>{icon}</span>
        <span className="truncate">{task.title}</span>
      </div>
    );
  }

  function renderCommitment(commitment: CommitmentNode) {
    const hasTasks = commitment.tasks.length > 0;
    const isExp = expandedCommitments[commitment.id];

    return (
      <div key={commitment.id}>
        <div className="group flex items-center">
          {hasTasks ? (
            <button
              onClick={() => toggle(setExpandedCommitments, commitment.id)}
              className="flex h-4 w-4 shrink-0 items-center justify-center text-navy-400 hover:text-white"
            >
              <ChevronIcon expanded={!!isExp} />
            </button>
          ) : (
            <span className="w-4" />
          )}
          <Link
            href={`/dashboard/commitments/${commitment.id}`}
            className={`flex flex-1 items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs transition-colors ${
              pathname === `/dashboard/commitments/${commitment.id}`
                ? "bg-amber-500/20 font-medium text-amber-300"
                : "text-navy-300 hover:bg-white/5 hover:text-navy-100"
            }`}
          >
            <span className="shrink-0 text-[10px] opacity-70">C</span>
            <span className="flex-1 truncate">{commitment.title}</span>
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusDot[commitment.status] || "bg-navy-600"}`}
            />
          </Link>
        </div>

        {isExp && hasTasks && (
          <div className="ml-3 mt-0.5 space-y-0.5 border-l border-white/5 pl-1">
            {commitment.tasks.map(renderTask)}
          </div>
        )}
      </div>
    );
  }

  function renderNarrative(narrative: NarrativeNode) {
    const hasCommitments = narrative.commitments.length > 0;
    const isExp = expandedNarratives[narrative.id];

    return (
      <div key={narrative.id}>
        <div className="group flex items-center">
          {hasCommitments ? (
            <button
              onClick={() => toggle(setExpandedNarratives, narrative.id)}
              className="flex h-5 w-5 shrink-0 items-center justify-center text-navy-400 hover:text-white"
            >
              <ChevronIcon expanded={!!isExp} />
            </button>
          ) : (
            <span className="w-5" />
          )}
          <Link
            href={`/dashboard/narratives/${narrative.id}`}
            className={`flex flex-1 items-center gap-1.5 rounded-md px-1.5 py-1 text-sm transition-colors ${
              pathname === `/dashboard/narratives/${narrative.id}`
                ? "bg-amber-500/20 font-medium text-amber-300"
                : "text-navy-200 hover:bg-white/5 hover:text-white"
            }`}
          >
            <span className="shrink-0 text-xs opacity-70">N</span>
            <span className="flex-1 truncate">{narrative.title}</span>
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${statusDot[narrative.status] || "bg-navy-600"}`}
            />
          </Link>
        </div>

        {isExp && hasCommitments && (
          <div className="ml-3 mt-0.5 space-y-0.5 border-l border-white/10 pl-1">
            {narrative.commitments.map(renderCommitment)}
          </div>
        )}
      </div>
    );
  }

  function renderTeam(team: TeamNode) {
    const isExp = expandedTeams[team.id];
    const teamPath = `/dashboard/teams/${team.id}`;
    const active = isActive(teamPath);

    return (
      <div key={team.id} className="ml-1">
        <div className="flex items-center">
          <Link
            href={teamPath}
            className={`flex flex-1 items-center gap-2 rounded-lg px-2 py-1 text-sm transition-colors ${
              active
                ? "bg-white/10 font-medium text-white"
                : "text-navy-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <svg
              className="h-3.5 w-3.5 shrink-0"
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
            <span className="flex-1 truncate text-left">{team.name}</span>
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggle(setExpandedTeams, team.id);
            }}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-navy-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ChevronIcon expanded={!!isExp} />
          </button>
        </div>

        {isExp && team.narratives.length > 0 && (
          <div className="ml-2 mt-0.5 space-y-0.5 border-l border-white/10 pl-1">
            {team.narratives.map(renderNarrative)}
          </div>
        )}
      </div>
    );
  }

  function getCycleYearLabel(c: CycleNode): string | null {
    if (!c.startDate || !c.endDate) return null;
    const startYear = new Date(c.startDate).getFullYear();
    const endYear = new Date(c.endDate).getFullYear();
    if (startYear !== endYear) return `${startYear}/${endYear}`;
    return null;
  }

  function renderCycle(cycle: CycleNode) {
    const isExp = expandedCycles[cycle.id];
    const dotColor = cycleStatusDot[cycle.status] || "bg-navy-600";
    const yearLabel = getCycleYearLabel(cycle);

    return (
      <div key={cycle.id} className="ml-1">
        <button
          onClick={() => toggle(setExpandedCycles, cycle.id)}
          className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-navy-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ChevronIcon expanded={!!isExp} />
          <span className="flex-1 truncate text-left">{cycle.name}</span>
          {yearLabel && (
            <span className="shrink-0 text-[10px] text-navy-500">{yearLabel}</span>
          )}
          <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
        </button>

        {isExp && cycle.teams.length > 0 && (
          <div className="mt-0.5 space-y-0.5 border-l border-white/10 ml-2 pl-1">
            {cycle.teams.map(renderTeam)}
          </div>
        )}
      </div>
    );
  }

  function renderYear(year: YearNode) {
    const isExp = expandedYears[year.id];

    return (
      <div key={year.id}>
        <button
          onClick={() => toggle(setExpandedYears, year.id)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-navy-200 transition-colors hover:bg-white/5 hover:text-white"
        >
          <svg
            className="h-4 w-4 shrink-0"
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
          <span className="flex-1 text-left">{year.year}</span>
          <ChevronIcon expanded={!!isExp} />
        </button>

        {isExp && (
          <div className="mt-0.5 space-y-0.5">
            {year.cycles.map(renderCycle)}

            {/* New Cycle link */}
            <Link
              href="/dashboard/cycles?new=true"
              className="ml-2 flex items-center gap-2 rounded-lg px-2 py-1 text-xs text-navy-400 transition-colors hover:bg-white/5 hover:text-navy-200"
            >
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Cycle
            </Link>
          </div>
        )}
      </div>
    );
  }

  function renderUncategorized(narratives: NarrativeNode[]) {
    if (!narratives || narratives.length === 0) return null;

    return (
      <div>
        <button
          onClick={() => setExpandedUncategorized((prev) => !prev)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-navy-200 transition-colors hover:bg-white/5 hover:text-white"
        >
          <svg
            className="h-4 w-4 shrink-0"
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
          <span className="flex-1 text-left">Uncategorized</span>
          <ChevronIcon expanded={expandedUncategorized} />
        </button>

        {expandedUncategorized && (
          <div className="ml-2 mt-0.5 space-y-0.5 border-l border-white/10 pl-1">
            {narratives.map(renderNarrative)}
          </div>
        )}
      </div>
    );
  }

  // ---------- Main render ----------

  return (
    <>
      {/* Mobile top bar */}
      <div className="fixed left-0 right-0 top-0 z-50 flex h-12 items-center gap-3 bg-navy-900 px-4 md:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white hover:bg-white/10"
          aria-label="Toggle sidebar"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        <Link href="/dashboard" className="font-heading text-lg font-semibold text-white">
          ncts<span className="text-amber-400">.</span>app
        </Link>
      </div>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col bg-navy-900 transition-transform duration-200 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <Link
          href="/dashboard"
          className="font-heading text-xl font-semibold text-white"
        >
          ncts<span className="text-amber-400">.</span>app
        </Link>
      </div>

      {/* Main nav */}
      <nav className="space-y-1 px-3 pt-2">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
            isActive("/dashboard", true)
              ? "bg-white/10 font-medium text-white"
              : "text-navy-300 hover:bg-white/5 hover:text-white"
          }`}
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
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          Dashboard
        </Link>

        <Link
          href="/dashboard/strategy"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
            isActive("/dashboard/strategy")
              ? "bg-white/10 font-medium text-white"
              : "text-navy-300 hover:bg-white/5 hover:text-white"
          }`}
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
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Strategy
        </Link>

        <Link
          href="/dashboard/cycles"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
            isActive("/dashboard/cycles")
              ? "bg-white/10 font-medium text-white"
              : "text-navy-300 hover:bg-white/5 hover:text-white"
          }`}
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
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
            />
          </svg>
          Cycles
        </Link>

        <Link
          href="/dashboard/alignment"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
            isActive("/dashboard/alignment")
              ? "bg-white/10 font-medium text-white"
              : "text-navy-300 hover:bg-white/5 hover:text-white"
          }`}
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
              d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z"
            />
          </svg>
          Alignment
        </Link>
      </nav>

      {/* Divider */}
      <div className="mx-4 my-3 border-t border-white/10" />

      {/* Workspace tree */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {tree && tree.years.length > 0 ? (
          <div className="space-y-1">
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-navy-400">
              {tree.workspace.name}
            </p>
            {tree.years.map(renderYear)}
            {tree.uncategorized && renderUncategorized(tree.uncategorized)}
          </div>
        ) : tree ? (
          <div className="px-3 py-4">
            <p className="text-xs text-navy-400">
              No cycles yet. Create one to get started.
            </p>
          </div>
        ) : (
          <div className="px-3 py-4">
            <p className="text-xs text-navy-400">Loading...</p>
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="space-y-1 border-t border-white/10 p-3">
        <Link
          href="/dashboard/narratives/new"
          className="flex items-center gap-2 rounded-lg bg-amber-500/20 px-3 py-2 text-sm font-medium text-amber-300 transition-colors hover:bg-amber-500/30"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Narrative
        </Link>
        <Link
          href="/dashboard/settings"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
            isActive("/dashboard/settings")
              ? "bg-white/10 font-medium text-white"
              : "text-navy-300 hover:bg-white/5 hover:text-white"
          }`}
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
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
          </svg>
          Settings
        </Link>
        <SignOutButton />
      </div>
      </aside>
    </>
  );
}
