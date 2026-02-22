"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface AlignmentGap {
  severity: "critical" | "warning" | "info";
  type: string;
  message: string;
  action: { label: string; href: string };
  entityId: string;
}

interface AlignmentData {
  gaps: AlignmentGap[];
  score: number;
}

function ScoreBadge({ score }: { score: number }) {
  let color: string;
  let dotColor: string;
  if (score >= 80) {
    color = "bg-green-100 text-green-700";
    dotColor = "bg-green-400";
  } else if (score >= 60) {
    color = "bg-amber-100 text-amber-700";
    dotColor = "bg-amber-400";
  } else {
    color = "bg-red-100 text-red-700";
    dotColor = "bg-red-400";
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${color}`}>
      <span className={`h-2 w-2 rounded-full ${dotColor}`} />
      {score}/100
    </span>
  );
}

function GapCard({ gap }: { gap: AlignmentGap }) {
  const styles = {
    critical: {
      bg: "bg-red-50 border-red-200",
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      text: "text-red-700",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
      ),
    },
    warning: {
      bg: "bg-amber-50 border-amber-200",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      text: "text-amber-700",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      ),
    },
    info: {
      bg: "bg-blue-50 border-blue-200",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      text: "text-blue-700",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
      ),
    },
  };

  const s = styles[gap.severity];

  return (
    <div className={`rounded-xl border p-4 ${s.bg}`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${s.iconBg}`}>
          <svg className={`h-4 w-4 ${s.iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            {s.icon}
          </svg>
        </div>
        <div className="flex-1 space-y-1">
          <p className={`text-sm font-medium ${s.text}`}>{gap.message}</p>
          <Link
            href={gap.action.href}
            className={`inline-flex items-center gap-1 text-sm font-medium ${s.text} underline decoration-current/30 hover:decoration-current`}
          >
            {gap.action.label}
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function SeveritySection({
  label,
  gaps,
}: {
  label: string;
  gaps: AlignmentGap[];
}) {
  if (gaps.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-navy-950">
        {label} ({gaps.length})
      </h2>
      <div className="space-y-2">
        {gaps.map((gap) => (
          <GapCard key={`${gap.type}-${gap.entityId}`} gap={gap} />
        ))}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-48 rounded bg-navy-100" />
          <div className="mt-2 h-4 w-72 rounded bg-navy-100" />
        </div>
        <div className="h-8 w-24 rounded-full bg-navy-100" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <div className="h-5 w-32 rounded bg-navy-100" />
          <div className="h-16 rounded-xl bg-navy-100" />
          <div className="h-16 rounded-xl bg-navy-100" />
        </div>
      ))}
    </div>
  );
}

export default function AlignmentRadarPage() {
  const [data, setData] = useState<AlignmentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/alignment")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton />;

  if (!data) {
    return (
      <p className="text-sm text-navy-400">
        Failed to load alignment data. Please try again.
      </p>
    );
  }

  const critical = data.gaps.filter((g) => g.severity === "critical");
  const warnings = data.gaps.filter((g) => g.severity === "warning");
  const info = data.gaps.filter((g) => g.severity === "info");
  const isEmpty = data.gaps.length === 0;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-navy-950">
            Alignment Radar
          </h1>
          <p className="mt-1 text-sm text-navy-400">
            Check how well your NCTs connect to strategy.
          </p>
        </div>
        <ScoreBadge score={data.score} />
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="rounded-xl border border-navy-100 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <p className="mt-3 text-lg font-semibold text-navy-950">Perfect alignment!</p>
          <p className="mt-1 text-sm text-navy-400">
            All narratives, commitments, and tasks are properly connected to your strategy.
          </p>
        </div>
      )}

      {/* Score visualization */}
      {!isEmpty && (
        <div className="rounded-xl border border-navy-100 bg-white p-6">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm font-medium text-navy-400">Alignment Score</p>
              <p className={`mt-1 font-heading text-4xl font-bold ${data.score >= 80 ? "text-green-700" : data.score >= 60 ? "text-amber-600" : "text-red-700"}`}>
                {data.score}
              </p>
            </div>
            <div className="flex-1">
              <div className="h-3 w-full overflow-hidden rounded-full bg-navy-100">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${data.score >= 80 ? "bg-green-400" : data.score >= 60 ? "bg-amber-400" : "bg-red-400"}`}
                  style={{ width: `${data.score}%` }}
                />
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-navy-400">
                {critical.length > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-400" />{critical.length} critical</span>}
                {warnings.length > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" />{warnings.length} warnings</span>}
                {info.length > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-400" />{info.length} info</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gap sections */}
      <SeveritySection label="Critical" gaps={critical} />
      <SeveritySection label="Warnings" gaps={warnings} />
      <SeveritySection label="Info" gaps={info} />
    </div>
  );
}
