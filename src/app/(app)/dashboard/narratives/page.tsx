"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Narrative {
  id: string;
  title: string;
  context: string | null;
  status: string;
  createdAt: string;
}

interface TreeNarrative {
  id: string;
  title: string;
  status: string;
  commitments: { id: string }[];
}

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-100 text-green-700" },
  at_risk: { label: "At Risk", className: "bg-red-100 text-red-700" },
  completed: { label: "Completed", className: "bg-navy-100 text-navy-600" },
  draft: { label: "Draft", className: "bg-navy-50 text-navy-400" },
  archived: { label: "Archived", className: "bg-navy-50 text-navy-400" },
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? statusConfig.draft;
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-navy-100 bg-white p-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="h-5 w-48 rounded bg-navy-100" />
              <div className="mt-3 h-4 w-full max-w-md rounded bg-navy-50" />
              <div className="mt-1.5 h-4 w-3/4 max-w-sm rounded bg-navy-50" />
            </div>
            <div className="h-5 w-16 rounded-full bg-navy-50" />
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="h-3.5 w-24 rounded bg-navy-50" />
            <div className="h-3.5 w-20 rounded bg-navy-50" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/narratives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) throw new Error("Failed to create narrative");
      const created = await res.json();
      toast.success("Narrative created");
      router.push(`/dashboard/narratives/${created.id}`);
    } catch {
      toast.error("Failed to create narrative");
      setSubmitting(false);
    }
  }

  const steps = [
    {
      number: "1",
      term: "Narrative",
      description: "The strategic context.",
      question: "\u201CWhy are we doing this?\u201D",
    },
    {
      number: "2",
      term: "Commitments",
      description: "Measurable outcomes.",
      question: "\u201CWhat will be true when we succeed?\u201D",
    },
    {
      number: "3",
      term: "Tasks",
      description: "The actual work.",
      question: "\u201CWhat do we need to do?\u201D",
    },
  ];

  return (
    <div className="rounded-xl border-2 border-dashed border-navy-200 bg-white p-12">
      <div className="mx-auto max-w-xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <svg
              className="h-6 w-6 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5.002 5.002 0 017.072 0"
              />
            </svg>
          </div>
          <h2 className="font-heading text-xl font-semibold text-navy-950">
            Start with your Strategy
          </h2>
          <p className="mt-2 text-sm text-navy-400">
            NCT is a simple framework for turning strategy into action.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="flex items-start gap-4 rounded-lg bg-navy-50/50 p-4"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-white">
                {step.number}
              </span>
              <div>
                <p className="text-sm font-semibold text-navy-950">
                  {step.term}{" "}
                  <span className="font-normal text-navy-600">
                    &mdash; {step.description}
                  </span>
                </p>
                <p className="mt-0.5 text-sm italic text-navy-400">
                  {step.question}
                </p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-8">
          <label
            htmlFor="narrative-title"
            className="block text-sm font-medium text-navy-900"
          >
            What&apos;s your most important strategic priority right now?
          </label>
          <div className="mt-2 flex gap-3">
            <input
              id="narrative-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Expand into enterprise market"
              className="flex-1 rounded-lg border border-navy-200 bg-white px-4 py-2.5 text-sm text-navy-950 placeholder:text-navy-300 focus:border-navy-400 focus:outline-none focus:ring-1 focus:ring-navy-400"
            />
            <button
              type="submit"
              disabled={!title.trim() || submitting}
              className="shrink-0 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Creating\u2026" : "Create Narrative"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatsRow({ narratives }: { narratives: Narrative[] }) {
  const active = narratives.filter((n) => n.status === "active").length;
  const atRisk = narratives.filter((n) => n.status === "at_risk").length;
  const draft = narratives.filter((n) => n.status === "draft").length;

  const stats = [
    {
      label: "Total",
      value: narratives.length,
      iconBg: "bg-navy-50",
      iconColor: "text-navy-600",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
      ),
    },
    {
      label: "Active",
      value: active,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
      ),
    },
    {
      label: "At Risk",
      value: atRisk,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      ),
    },
    {
      label: "Draft",
      value: draft,
      iconBg: "bg-navy-50",
      iconColor: "text-navy-500",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl border border-navy-100 bg-white p-4">
          <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${stat.iconBg}`}>
            <svg className={`h-4.5 w-4.5 ${stat.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              {stat.icon}
            </svg>
          </div>
          <p className="font-heading text-2xl font-bold text-navy-950">{stat.value}</p>
          <p className="mt-0.5 text-xs text-navy-400">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}

function NarrativeCard({
  narrative,
  commitmentCount,
}: {
  narrative: Narrative;
  commitmentCount: number;
}) {
  const router = useRouter();
  const iconBgMap: Record<string, string> = { active: "bg-green-50", at_risk: "bg-amber-50", completed: "bg-navy-50", draft: "bg-navy-50", archived: "bg-navy-50" };
  const iconColorMap: Record<string, string> = { active: "text-green-600", at_risk: "text-amber-600", completed: "text-navy-500", draft: "text-navy-500", archived: "text-navy-500" };
  const iconBg = iconBgMap[narrative.status] || "bg-navy-50";
  const iconColor = iconColorMap[narrative.status] || "text-navy-500";

  return (
    <button
      type="button"
      onClick={() => router.push(`/dashboard/narratives/${narrative.id}`)}
      className="w-full cursor-pointer rounded-xl border border-navy-100 bg-white p-6 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start gap-4">
        {/* Icon container */}
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
          <svg className={`h-5 w-5 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
          </svg>
        </div>
        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="font-heading text-lg font-semibold text-navy-950">
                {narrative.title}
              </h3>
              {narrative.context && (
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-navy-600">
                  {narrative.context}
                </p>
              )}
            </div>
            <StatusBadge status={narrative.status} />
          </div>
          <div className="mt-4 flex items-center gap-3 text-xs text-navy-400">
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
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {commitmentCount} {commitmentCount === 1 ? "commitment" : "commitments"}
            </span>
            <span className="text-navy-200">&middot;</span>
            <span>{formatDate(narrative.createdAt)}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function NarrativesPage() {
  const [narratives, setNarratives] = useState<Narrative[]>([]);
  const [commitmentCounts, setCommitmentCounts] = useState<
    Record<string, number>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [narrativesRes, treeRes] = await Promise.all([
          fetch("/api/narratives"),
          fetch("/api/nct-tree"),
        ]);

        const narrativesData: Narrative[] = narrativesRes.ok
          ? await narrativesRes.json()
          : [];

        const counts: Record<string, number> = {};

        if (treeRes.ok) {
          const treeData = await treeRes.json();
          // Extract narratives from the workspace tree structure
          const allNarratives: TreeNarrative[] = [];

          // Collect from years → cycles → teams → narratives
          if (treeData.years) {
            for (const year of treeData.years) {
              for (const cycle of year.cycles || []) {
                for (const team of cycle.teams || []) {
                  allNarratives.push(...(team.narratives || []));
                }
              }
            }
          }
          // Also collect uncategorized narratives
          if (treeData.uncategorized) {
            allNarratives.push(...treeData.uncategorized);
          }

          for (const node of allNarratives) {
            counts[node.id] = node.commitments?.length ?? 0;
          }
        }

        setNarratives(narrativesData);
        setCommitmentCounts(counts);
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-navy-950">
            Narratives
          </h1>
          <p className="mt-1 text-sm text-navy-400">
            Strategic stories that provide context and direction for your work.
          </p>
        </div>
        {narratives.length > 0 && (
          <a
            href="/dashboard/narratives/new"
            className="rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800"
          >
            + New Narrative
          </a>
        )}
      </div>

      {!loading && narratives.length > 0 && (
        <div className="mt-6">
          <StatsRow narratives={narratives} />
        </div>
      )}

      <div className="mt-8">
        {loading ? (
          <LoadingSkeleton />
        ) : narratives.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4">
            {narratives.map((n) => (
              <NarrativeCard
                key={n.id}
                narrative={n}
                commitmentCount={commitmentCounts[n.id] ?? 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
