"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Commitment {
  id: string;
  title: string;
  outcome: string | null;
  keyResults: string | null;
  status: string;
  dueDate: string | null;
  narrativeId: string;
  createdAt: string;
  tasksCount?: number;
}

interface Narrative {
  id: string;
  title: string;
  status: string;
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-700";
    case "at_risk":
      return "bg-amber-100 text-amber-700";
    case "blocked":
      return "bg-red-100 text-red-700";
    case "completed":
      return "bg-navy-100 text-navy-600";
    default:
      return "bg-navy-50 text-navy-400";
  }
}

export default function CommitmentsPage() {
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [narratives, setNarratives] = useState<Narrative[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/commitments").then((r) => r.json()),
      fetch("/api/narratives").then((r) => r.json()),
    ])
      .then(([commitmentsData, narrativesData]) => {
        setCommitments(commitmentsData);
        setNarratives(narrativesData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-navy-400">Loading...</p>
      </div>
    );
  }

  // Group commitments by narrative
  const narrativeMap = new Map<string, Narrative>();
  for (const n of narratives) {
    narrativeMap.set(n.id, n);
  }

  const grouped = new Map<string, Commitment[]>();
  for (const c of commitments) {
    const key = c.narrativeId;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(c);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-navy-950">Commitments</h1>
          <p className="mt-1 text-navy-400">
            Measurable outcomes your team is promising to deliver.
          </p>
        </div>
      </div>

      {commitments.length === 0 ? (
        <div className="mt-12 rounded-xl border-2 border-dashed border-navy-200 bg-white p-16 text-center">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-navy-900">No commitments yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-navy-400">
            Create a narrative first, then add commitments that support it.
          </p>
          <Link
            href="/dashboard/narratives"
            className="mt-6 inline-block rounded-lg border border-navy-200 px-5 py-2.5 text-sm font-medium text-navy-900 transition-colors hover:bg-navy-50"
          >
            Go to Narratives
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {Array.from(grouped.entries()).map(([narrativeId, items]) => {
            const narr = narrativeMap.get(narrativeId);
            return (
              <div key={narrativeId}>
                {/* Narrative group header */}
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-navy-100">
                    <svg
                      className="h-3.5 w-3.5 text-navy-500"
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
                  <h3 className="text-sm font-medium text-navy-600">
                    {narr ? narr.title : "Unknown Narrative"}
                  </h3>
                </div>

                {/* Commitment cards */}
                <div className="space-y-3">
                  {items.map((c) => (
                    <Link
                      key={c.id}
                      href={`/dashboard/commitments/${c.id}`}
                      className="block rounded-xl border border-navy-100 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-heading text-base font-semibold text-navy-950">
                            {c.title}
                          </h4>
                          {c.outcome && (
                            <p className="mt-1.5 line-clamp-1 text-sm text-navy-500">
                              {c.outcome}
                            </p>
                          )}
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(c.status)}`}
                        >
                          {c.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-xs text-navy-400">
                        {c.dueDate && (
                          <>
                            <span>
                              Due{" "}
                              {new Date(c.dueDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            <span>&middot;</span>
                          </>
                        )}
                        <span>
                          {c.tasksCount !== undefined ? c.tasksCount : 0} task
                          {(c.tasksCount ?? 0) !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
