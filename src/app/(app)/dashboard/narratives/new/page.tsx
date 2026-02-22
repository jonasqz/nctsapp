"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { toast } from "sonner";

interface Team {
  id: string;
  name: string;
}

interface Cycle {
  id: string;
  name: string;
  status: string;
}

interface Pillar {
  id: string;
  title: string;
}

export default function NewNarrativePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl animate-pulse space-y-6">
          <div className="h-8 w-48 rounded-lg bg-navy-100" />
          <div className="h-4 w-72 rounded bg-navy-50" />
          <div className="mt-8 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-navy-50" />
            ))}
          </div>
        </div>
      }
    >
      <NewNarrativePageInner />
    </Suspense>
  );
}

function NewNarrativePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTeamId = searchParams.get("teamId") || "";

  const [title, setTitle] = useState("");
  const [context, setContext] = useState("");
  const [whyNow, setWhyNow] = useState("");
  const [successLooksLike, setSuccessLooksLike] = useState("");
  const [teamId, setTeamId] = useState(preselectedTeamId);
  const [cycleId, setCycleId] = useState("");
  const [pillarId, setPillarId] = useState("");
  const [loading, setLoading] = useState(false);

  // Dropdown options
  const [teams, setTeams] = useState<Team[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/teams")
        .then((res) => (res.ok ? res.json() : []))
        .catch(() => []),
      fetch("/api/cycles")
        .then((res) => (res.ok ? res.json() : []))
        .catch(() => []),
      fetch("/api/pillars")
        .then((res) => (res.ok ? res.json() : []))
        .catch(() => []),
    ])
      .then(([teamsData, cyclesData, pillarsData]) => {
        setTeams(Array.isArray(teamsData) ? teamsData : []);
        const cyclesList = Array.isArray(cyclesData) ? cyclesData : [];
        setCycles(cyclesList);
        setPillars(Array.isArray(pillarsData) ? pillarsData : []);

        // Pre-select the active cycle
        const activeCycle = cyclesList.find(
          (c: Cycle) => c.status === "active"
        );
        if (activeCycle) {
          setCycleId(activeCycle.id);
        }

        setOptionsLoading(false);
      })
      .catch(() => {
        setOptionsLoading(false);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/narratives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        context,
        whyNow,
        successLooksLike,
        teamId: teamId || undefined,
        cycleId: cycleId || undefined,
        pillarId: pillarId || undefined,
      }),
    });

    if (res.ok) {
      toast.success("Narrative created");
      router.push("/dashboard/narratives");
    } else {
      toast.error("Failed to create narrative");
    }
    setLoading(false);
  }

  const selectClasses =
    "w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-navy-950">New Narrative</h1>
      <p className="mt-1 text-navy-400">
        Define the strategic context. Why does this matter now?
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label
            htmlFor="title"
            className="mb-1.5 block text-sm font-medium text-navy-900"
          >
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            placeholder="e.g. Q1 Market Expansion"
          />
        </div>

        {/* Workspace context dropdowns */}
        {optionsLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-10 rounded-lg bg-navy-50" />
            <div className="h-10 rounded-lg bg-navy-50" />
            <div className="h-10 rounded-lg bg-navy-50" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="team"
                className="mb-1.5 block text-sm font-medium text-navy-900"
              >
                Team <span className="text-red-500">*</span>
              </label>
              <select
                id="team"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                required
                className={selectClasses}
              >
                <option value="">Select team...</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="cycle"
                className="mb-1.5 block text-sm font-medium text-navy-900"
              >
                Cycle
              </label>
              <select
                id="cycle"
                value={cycleId}
                onChange={(e) => setCycleId(e.target.value)}
                className={selectClasses}
              >
                <option value="">Select cycle...</option>
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.status === "active" ? " (active)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="pillar"
                className="mb-1.5 block text-sm font-medium text-navy-900"
              >
                Strategic Pillar{" "}
                <span className="font-normal text-navy-400">(optional)</span>
              </label>
              <select
                id="pillar"
                value={pillarId}
                onChange={(e) => setPillarId(e.target.value)}
                className={selectClasses}
              >
                <option value="">None</option>
                {pillars.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="context"
            className="mb-1.5 block text-sm font-medium text-navy-900"
          >
            Context
          </label>
          <textarea
            id="context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            placeholder="What's the strategic context? What's happening that makes this relevant?"
          />
        </div>

        <div>
          <label
            htmlFor="whyNow"
            className="mb-1.5 block text-sm font-medium text-navy-900"
          >
            Why now?
          </label>
          <textarea
            id="whyNow"
            value={whyNow}
            onChange={(e) => setWhyNow(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            placeholder="Why is this the right time to pursue this?"
          />
        </div>

        <div>
          <label
            htmlFor="success"
            className="mb-1.5 block text-sm font-medium text-navy-900"
          >
            Success looks like
          </label>
          <textarea
            id="success"
            value={successLooksLike}
            onChange={(e) => setSuccessLooksLike(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            placeholder="What does success look like for this narrative?"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || optionsLoading}
            className="rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Narrative"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-navy-200 px-5 py-2.5 text-sm font-medium text-navy-900 transition-colors hover:bg-navy-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
