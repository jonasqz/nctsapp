"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

interface Narrative {
  id: string;
  title: string;
  context: string | null;
  whyNow: string | null;
  successLooksLike: string | null;
  status: string;
  teamId: string | null;
  cycleId: string | null;
  pillarId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Commitment {
  id: string;
  title: string;
  outcome: string | null;
  keyResults: string | null;
  status: string;
  dueDate: string | null;
  narrativeId: string;
  createdAt: string;
}

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

const statusBadge: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  at_risk: "bg-amber-100 text-amber-700",
  completed: "bg-navy-100 text-navy-600",
  draft: "bg-navy-50 text-navy-400",
};

const statusDot: Record<string, string> = {
  active: "bg-green-400",
  on_track: "bg-green-400",
  at_risk: "bg-amber-400",
  blocked: "bg-red-400",
  completed: "bg-navy-400",
  done: "bg-green-400",
  draft: "bg-navy-600",
};

export default function NarrativeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [narrative, setNarrative] = useState<Narrative | null>(null);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Workspace context lookups
  const [teams, setTeams] = useState<Team[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [pillars, setPillars] = useState<Pillar[]>([]);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContext, setEditContext] = useState("");
  const [editWhyNow, setEditWhyNow] = useState("");
  const [editSuccess, setEditSuccess] = useState("");
  const [editTeamId, setEditTeamId] = useState("");
  const [editCycleId, setEditCycleId] = useState("");
  const [editPillarId, setEditPillarId] = useState("");
  const [saving, setSaving] = useState(false);

  // Inline title edit
  const [editingTitle, setEditingTitle] = useState(false);
  const [inlineTitle, setInlineTitle] = useState("");

  // Add commitment form
  const [showAddCommitment, setShowAddCommitment] = useState(false);
  const [newCommitmentTitle, setNewCommitmentTitle] = useState("");
  const [newCommitmentOutcome, setNewCommitmentOutcome] = useState("");
  const [newCommitmentDueDate, setNewCommitmentDueDate] = useState("");
  const [addingCommitment, setAddingCommitment] = useState(false);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchCommitments = useCallback(async () => {
    const res = await fetch(`/api/commitments?narrativeId=${id}`);
    if (res.ok) {
      const data: Commitment[] = await res.json();
      setCommitments(data);

      // Fetch task counts for each commitment
      const counts: Record<string, number> = {};
      await Promise.all(
        data.map(async (c) => {
          const taskRes = await fetch(`/api/tasks?commitmentId=${c.id}`);
          if (taskRes.ok) {
            const tasks = await taskRes.json();
            counts[c.id] = tasks.length;
          } else {
            counts[c.id] = 0;
          }
        })
      );
      setTaskCounts(counts);
    }
  }, [id]);

  useEffect(() => {
    async function load() {
      try {
        const [narrativeRes, teamsData, cyclesData, pillarsData] =
          await Promise.all([
            fetch(`/api/narratives/${id}`),
            fetch("/api/teams")
              .then((res) => (res.ok ? res.json() : []))
              .catch(() => []),
            fetch("/api/cycles")
              .then((res) => (res.ok ? res.json() : []))
              .catch(() => []),
            fetch("/api/pillars")
              .then((res) => (res.ok ? res.json() : []))
              .catch(() => []),
          ]);

        if (!narrativeRes.ok) {
          setError("Narrative not found");
          setLoading(false);
          return;
        }

        const narrativeData: Narrative = await narrativeRes.json();
        setNarrative(narrativeData);
        setInlineTitle(narrativeData.title);

        setTeams(Array.isArray(teamsData) ? teamsData : []);
        setCycles(Array.isArray(cyclesData) ? cyclesData : []);
        setPillars(Array.isArray(pillarsData) ? pillarsData : []);

        await fetchCommitments();
      } catch {
        setError("Failed to load narrative");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, fetchCommitments]);

  // Helper: get name by id
  function getTeamName(teamId: string | null): string | null {
    if (!teamId) return null;
    return teams.find((t) => t.id === teamId)?.name || null;
  }

  function getCycleName(cycleId: string | null): string | null {
    if (!cycleId) return null;
    return cycles.find((c) => c.id === cycleId)?.name || null;
  }

  function getPillarName(pillarId: string | null): string | null {
    if (!pillarId) return null;
    return pillars.find((p) => p.id === pillarId)?.title || null;
  }

  function startEditing() {
    if (!narrative) return;
    setEditTitle(narrative.title);
    setEditContext(narrative.context || "");
    setEditWhyNow(narrative.whyNow || "");
    setEditSuccess(narrative.successLooksLike || "");
    setEditTeamId(narrative.teamId || "");
    setEditCycleId(narrative.cycleId || "");
    setEditPillarId(narrative.pillarId || "");
    setEditing(true);
  }

  async function saveEdit() {
    setSaving(true);
    const res = await fetch(`/api/narratives/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        context: editContext || null,
        whyNow: editWhyNow || null,
        successLooksLike: editSuccess || null,
        teamId: editTeamId || null,
        cycleId: editCycleId || null,
        pillarId: editPillarId || null,
      }),
    });

    if (res.ok) {
      const updated = await res.json();
      setNarrative(updated);
      setInlineTitle(updated.title);
      setEditing(false);
      toast.success("Narrative updated");
    } else {
      toast.error("Failed to update narrative");
    }
    setSaving(false);
  }

  async function saveInlineTitle() {
    if (!inlineTitle.trim() || inlineTitle === narrative?.title) {
      setEditingTitle(false);
      setInlineTitle(narrative?.title || "");
      return;
    }
    const res = await fetch(`/api/narratives/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: inlineTitle }),
    });
    if (res.ok) {
      const updated = await res.json();
      setNarrative(updated);
      setInlineTitle(updated.title);
      toast.success("Title updated");
    }
    setEditingTitle(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/narratives/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Narrative deleted");
      router.push("/dashboard/narratives");
    } else {
      toast.error("Failed to delete narrative");
    }
    setDeleting(false);
  }

  async function handleAddCommitment(e: React.FormEvent) {
    e.preventDefault();
    if (!newCommitmentTitle.trim()) return;

    setAddingCommitment(true);
    const res = await fetch("/api/commitments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newCommitmentTitle,
        outcome: newCommitmentOutcome || null,
        dueDate: newCommitmentDueDate || null,
        narrativeId: id,
      }),
    });

    if (res.ok) {
      setNewCommitmentTitle("");
      setNewCommitmentOutcome("");
      setNewCommitmentDueDate("");
      setShowAddCommitment(false);
      await fetchCommitments();
      toast.success("Commitment added");
    } else {
      toast.error("Failed to add commitment");
    }
    setAddingCommitment(false);
  }

  const selectClasses =
    "w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-navy-400">Loading...</p>
      </div>
    );
  }

  if (error || !narrative) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-navy-400">{error || "Narrative not found"}</p>
        <Link
          href="/dashboard/narratives"
          className="mt-4 text-sm font-medium text-amber-500 hover:text-amber-600"
        >
          Back to Narratives
        </Link>
      </div>
    );
  }

  const teamName = getTeamName(narrative.teamId);
  const cycleName = getCycleName(narrative.cycleId);
  const pillarName = getPillarName(narrative.pillarId);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-navy-400">
        <Link
          href="/dashboard/narratives"
          className="transition-colors hover:text-navy-900"
        >
          Narratives
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
        <span className="font-medium text-navy-900">{narrative.title}</span>
      </nav>

      {/* Back link */}
      <Link
        href="/dashboard/narratives"
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
        Back to Narratives
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {editingTitle && !editing ? (
            <input
              type="text"
              value={inlineTitle}
              onChange={(e) => setInlineTitle(e.target.value)}
              onBlur={saveInlineTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveInlineTitle();
                if (e.key === "Escape") {
                  setEditingTitle(false);
                  setInlineTitle(narrative.title);
                }
              }}
              autoFocus
              className="w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-2xl font-semibold text-navy-950 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          ) : (
            <h1
              onClick={() => {
                if (!editing) {
                  setEditingTitle(true);
                  setInlineTitle(narrative.title);
                }
              }}
              className={`text-2xl font-semibold text-navy-950 ${
                !editing ? "cursor-pointer hover:text-navy-800" : ""
              }`}
            >
              {narrative.title}
            </h1>
          )}
        </div>
        <div className="ml-4 flex items-center gap-3">
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
              statusBadge[narrative.status] || "bg-navy-50 text-navy-400"
            }`}
          >
            {narrative.status}
          </span>
          {teamName && (
            <span className="shrink-0 rounded-full bg-navy-100 px-2.5 py-0.5 text-xs font-medium text-navy-700">
              {teamName}
            </span>
          )}
          {!editing && (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Summary badges */}
      {!editing && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-navy-50 px-3 py-1.5">
            <svg className="h-4 w-4 text-navy-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span className="text-sm font-medium text-navy-700">{commitments.length} {commitments.length === 1 ? "commitment" : "commitments"}</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-navy-50 px-3 py-1.5">
            <svg className="h-4 w-4 text-navy-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
            </svg>
            <span className="text-sm font-medium text-navy-700">{Object.values(taskCounts).reduce((a, b) => a + b, 0)} tasks</span>
          </div>
          {teamName && (
            <div className="flex items-center gap-2 rounded-lg bg-navy-50 px-3 py-1.5">
              <svg className="h-4 w-4 text-navy-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
              </svg>
              <span className="text-sm font-medium text-navy-700">{teamName}</span>
            </div>
          )}
          {cycleName && (
            <div className="flex items-center gap-2 rounded-lg bg-navy-50 px-3 py-1.5">
              <svg className="h-4 w-4 text-navy-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
              </svg>
              <span className="text-sm font-medium text-navy-700">{cycleName}</span>
            </div>
          )}
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-900">
            Are you sure you want to delete this narrative?
          </p>
          <p className="mt-1 text-sm text-red-600">
            This will permanently remove the narrative and cannot be undone.
          </p>
          <div className="mt-3 flex gap-3">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Yes, delete"}
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

      {/* Edit mode */}
      {editing ? (
        <div className="mt-6 space-y-5 rounded-xl border border-navy-100 bg-white p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Title
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Workspace context dropdowns */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-900">
                Team
              </label>
              <select
                value={editTeamId}
                onChange={(e) => setEditTeamId(e.target.value)}
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
              <label className="mb-1.5 block text-sm font-medium text-navy-900">
                Cycle
              </label>
              <select
                value={editCycleId}
                onChange={(e) => setEditCycleId(e.target.value)}
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
              <label className="mb-1.5 block text-sm font-medium text-navy-900">
                Strategic Pillar{" "}
                <span className="font-normal text-navy-400">(optional)</span>
              </label>
              <select
                value={editPillarId}
                onChange={(e) => setEditPillarId(e.target.value)}
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

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Context
            </label>
            <textarea
              value={editContext}
              onChange={(e) => setEditContext(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              placeholder="What's the strategic context?"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Why now?
            </label>
            <textarea
              value={editWhyNow}
              onChange={(e) => setEditWhyNow(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              placeholder="Why is this the right time?"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-900">
              Success looks like
            </label>
            <textarea
              value={editSuccess}
              onChange={(e) => setEditSuccess(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              placeholder="What does success look like?"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={saveEdit}
              disabled={saving}
              className="rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg border border-navy-200 px-5 py-2.5 text-sm font-medium text-navy-900 transition-colors hover:bg-navy-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* Display mode */
        <div className="mt-6 space-y-6">
          {narrative.context && (
            <div className="rounded-xl border border-navy-100 bg-white p-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50">
                  <svg className="h-4 w-4 text-navy-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-navy-400">Context</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-navy-900">
                {narrative.context}
              </p>
            </div>
          )}

          {narrative.whyNow && (
            <div className="rounded-xl border border-navy-100 bg-white p-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                  <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-navy-400">Why now?</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-navy-900">
                {narrative.whyNow}
              </p>
            </div>
          )}

          {narrative.successLooksLike && (
            <div className="rounded-xl border border-navy-100 bg-white p-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
                  <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0 1 16.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 0 1-2.4 1.311" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-navy-400">Success looks like</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-navy-900">
                {narrative.successLooksLike}
              </p>
            </div>
          )}

          {!narrative.context &&
            !narrative.whyNow &&
            !narrative.successLooksLike && (
              <div className="rounded-xl border-2 border-dashed border-navy-200 bg-white p-8 text-center">
                <p className="text-sm text-navy-400">
                  No details added yet.{" "}
                  <button
                    onClick={startEditing}
                    className="font-medium text-amber-500 hover:text-amber-600"
                  >
                    Add context
                  </button>{" "}
                  to flesh out this narrative.
                </p>
              </div>
            )}

          <div className="text-xs text-navy-400">
            Created{" "}
            {new Date(narrative.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="my-8 border-t border-navy-100" />

      {/* Commitments section */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-navy-950">Commitments</h2>
        <button
          onClick={() => setShowAddCommitment(true)}
          className="rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800"
        >
          + Add Commitment
        </button>
      </div>

      {/* Add commitment inline form */}
      {showAddCommitment && (
        <form
          onSubmit={handleAddCommitment}
          className="mt-4 rounded-xl border border-navy-100 bg-white p-6"
        >
          <h3 className="mb-4 text-sm font-semibold text-navy-900">
            New Commitment
          </h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-900">
                Title
              </label>
              <input
                type="text"
                value={newCommitmentTitle}
                onChange={(e) => setNewCommitmentTitle(e.target.value)}
                required
                className="w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                placeholder="What are you committing to deliver?"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-900">
                Outcome{" "}
                <span className="font-normal text-navy-400">(optional)</span>
              </label>
              <textarea
                value={newCommitmentOutcome}
                onChange={(e) => setNewCommitmentOutcome(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                placeholder="What's the expected outcome?"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-900">
                Due date{" "}
                <span className="font-normal text-navy-400">(optional)</span>
              </label>
              <input
                type="date"
                value={newCommitmentDueDate}
                onChange={(e) => setNewCommitmentDueDate(e.target.value)}
                className="w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="submit"
              disabled={addingCommitment}
              className="rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800 disabled:opacity-50"
            >
              {addingCommitment ? "Adding..." : "Add Commitment"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddCommitment(false);
                setNewCommitmentTitle("");
                setNewCommitmentOutcome("");
                setNewCommitmentDueDate("");
              }}
              className="rounded-lg border border-navy-200 px-5 py-2.5 text-sm font-medium text-navy-900 transition-colors hover:bg-navy-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Commitment list */}
      {commitments.length === 0 ? (
        <div className="mt-6 rounded-xl border-2 border-dashed border-navy-200 bg-white p-12 text-center">
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
          <h3 className="text-lg font-semibold text-navy-900">
            No commitments yet
          </h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-navy-400">
            Commitments are measurable outcomes that support this narrative. Add
            one to start tracking progress.
          </p>
          {!showAddCommitment && (
            <button
              onClick={() => setShowAddCommitment(true)}
              className="mt-6 inline-block rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800"
            >
              Add your first Commitment
            </button>
          )}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {commitments.map((c) => (
            <Link
              key={c.id}
              href={`/dashboard/commitments/${c.id}`}
              className="block rounded-xl border border-navy-100 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      statusDot[c.status] || "bg-navy-600"
                    }`}
                  />
                  <h4 className="font-medium text-navy-950">{c.title}</h4>
                </div>
                {c.dueDate && (
                  <span className="shrink-0 text-xs text-navy-400">
                    Due{" "}
                    {new Date(c.dueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-navy-400">
                <span>
                  {taskCounts[c.id] ?? 0}{" "}
                  {(taskCounts[c.id] ?? 0) === 1 ? "task" : "tasks"}
                </span>
                <span className="capitalize">{c.status}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
