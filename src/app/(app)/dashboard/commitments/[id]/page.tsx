"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";

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

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  commitmentId: string;
  dueDate: string | null;
  createdAt: string;
}

interface Narrative {
  id: string;
  title: string;
}

const STATUS_OPTIONS = ["active", "at_risk", "blocked", "completed", "draft"] as const;

const TASK_STATUS_CYCLE: Record<string, string> = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
  blocked: "todo",
};

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

function TaskStatusIcon({ status, onClick }: { status: string; onClick: () => void }) {
  const base = "h-5 w-5 shrink-0 cursor-pointer transition-colors";

  if (status === "done") {
    return (
      <button onClick={onClick} className={`${base} text-green-500 hover:text-green-700`} title="Done - click to reset">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    );
  }

  if (status === "in_progress") {
    return (
      <button onClick={onClick} className={`${base} text-amber-500 hover:text-amber-700`} title="In progress - click to complete">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    );
  }

  if (status === "blocked") {
    return (
      <button onClick={onClick} className={`${base} text-red-400 hover:text-red-600`} title="Blocked - click to unblock">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 11-12.728 12.728 9 9 0 0112.728-12.728zM5.636 18.364L18.364 5.636" />
        </svg>
      </button>
    );
  }

  // todo (default)
  return (
    <button onClick={onClick} className={`${base} text-navy-300 hover:text-navy-500`} title="To do - click to start">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="9" />
      </svg>
    </button>
  );
}

export default function CommitmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [commitment, setCommitment] = useState<Commitment | null>(null);
  const [narrative, setNarrative] = useState<Narrative | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editOutcome, setEditOutcome] = useState("");
  const [editKeyResults, setEditKeyResults] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  // New task form
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [addingTask, setAddingTask] = useState(false);

  // Saving / deleting state
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    Promise.all([
      fetch(`/api/commitments/${id}`).then((r) => r.json()),
      fetch(`/api/tasks?commitmentId=${id}`).then((r) => r.json()),
    ])
      .then(([commitmentData, tasksData]) => {
        setCommitment(commitmentData);
        setTasks(tasksData);
        setEditTitle(commitmentData.title);
        setEditOutcome(commitmentData.outcome || "");
        setEditKeyResults(commitmentData.keyResults || "");
        setEditDueDate(
          commitmentData.dueDate
            ? new Date(commitmentData.dueDate).toISOString().split("T")[0]
            : ""
        );

        // Fetch parent narrative
        if (commitmentData.narrativeId) {
          fetch(`/api/narratives/${commitmentData.narrativeId}`)
            .then((r) => r.json())
            .then((n) => setNarrative(n))
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    if (!commitment) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/commitments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          outcome: editOutcome || null,
          keyResults: editKeyResults || null,
          dueDate: editDueDate || null,
        }),
      });
      const updated = await res.json();
      setCommitment(updated);
      setEditing(false);
      toast.success("Commitment updated");
    } catch {
      toast.error("Failed to update commitment");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!commitment) return;
    setStatusOpen(false);

    try {
      const res = await fetch(`/api/commitments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const updated = await res.json();
      setCommitment(updated);
      toast.success(`Status changed to ${newStatus.replace("_", " ")}`);
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setDeleting(true);
    try {
      await fetch(`/api/commitments/${id}`, { method: "DELETE" });
      toast.success("Commitment deleted");
      router.push("/dashboard/commitments");
    } catch {
      toast.error("Failed to delete commitment");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function handleAddTask(e: FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setAddingTask(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTaskTitle.trim(), commitmentId: id }),
      });
      const created = await res.json();
      setTasks((prev) => [...prev, created]);
      setNewTaskTitle("");
      toast.success("Task added");
    } catch {
      toast.error("Failed to add task");
    } finally {
      setAddingTask(false);
    }
  }

  async function handleTaskStatusToggle(task: Task) {
    const newStatus = TASK_STATUS_CYCLE[task.status] || "todo";

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );

    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      // Revert on error
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: task.status } : t))
      );
      toast.error("Failed to update task status");
    }
  }

  async function handleDeleteTask(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));

    try {
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
      // Refetch on error
      const res = await fetch(`/api/tasks?commitmentId=${id}`);
      const data = await res.json();
      setTasks(data);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-navy-400">Loading...</p>
      </div>
    );
  }

  if (!commitment) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-lg font-semibold text-navy-900">Commitment not found</h2>
        <Link
          href="/dashboard/commitments"
          className="mt-4 inline-block text-sm text-amber-500 hover:text-amber-600"
        >
          Back to Commitments
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-navy-400">
        <Link href="/dashboard/narratives" className="hover:text-navy-600 transition-colors">
          Narratives
        </Link>
        <span>/</span>
        {narrative ? (
          <Link
            href={`/dashboard/narratives/${narrative.id}`}
            className="hover:text-navy-600 transition-colors"
          >
            {narrative.title}
          </Link>
        ) : (
          <span>...</span>
        )}
        <span>/</span>
        <span className="text-navy-600 font-medium">{commitment.title}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-2xl font-semibold text-navy-950 focus:border-amber-500 focus:outline-none"
            />
          ) : (
            <h1 className="text-2xl font-semibold text-navy-950">{commitment.title}</h1>
          )}
        </div>

        {/* Status badge with dropdown */}
        <div className="relative">
          <button
            onClick={() => setStatusOpen(!statusOpen)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-opacity hover:opacity-80 ${statusBadgeClass(commitment.status)}`}
          >
            {commitment.status.replace("_", " ")}
            <svg className="ml-1 inline-block h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {statusOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg border border-navy-100 bg-white py-1 shadow-lg">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  className={`block w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-navy-50 ${
                    commitment.status === s ? "font-medium text-navy-950" : "text-navy-600"
                  }`}
                >
                  <span className={`mr-2 inline-block h-2 w-2 rounded-full ${statusBadgeClass(s).split(" ")[0]}`} />
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Due date */}
      <div className="mt-3 flex items-center gap-4 text-sm text-navy-400">
        {editing ? (
          <label className="flex items-center gap-2">
            <span>Due:</span>
            <input
              type="date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
              className="rounded-lg border border-navy-200 px-3.5 py-1.5 text-sm text-navy-950 focus:border-amber-500 focus:outline-none"
            />
          </label>
        ) : commitment.dueDate ? (
          <span>
            Due{" "}
            {new Date(commitment.dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        ) : (
          <span>No due date</span>
        )}
        <span>&middot;</span>
        <span>
          Created{" "}
          {new Date(commitment.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Task progress card */}
      {tasks.length > 0 && (
        <div className="mt-6 rounded-xl border border-navy-100 bg-white p-5">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
                  <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-bold text-navy-950">{tasks.filter(t => t.status === "done").length}</p>
                  <p className="text-xs text-navy-400">Done</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                  <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-bold text-navy-950">{tasks.filter(t => t.status === "in_progress").length}</p>
                  <p className="text-xs text-navy-400">In Progress</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
                  <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-bold text-navy-950">{tasks.filter(t => t.status === "blocked").length}</p>
                  <p className="text-xs text-navy-400">Blocked</p>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="mb-1 flex items-center justify-between text-xs text-navy-500">
                <span>Progress</span>
                <span className="font-medium">{tasks.length > 0 ? Math.round((tasks.filter(t => t.status === "done").length / tasks.length) * 100) : 0}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-navy-100">
                <div className="h-full rounded-full bg-green-400 transition-all duration-500" style={{ width: `${tasks.length > 0 ? Math.round((tasks.filter(t => t.status === "done").length / tasks.length) * 100) : 0}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Outcome & Key Results */}
      <div className="mt-8 space-y-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50">
              <svg className="h-4 w-4 text-navy-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium uppercase tracking-wider text-navy-400">Outcome</h3>
          </div>
          {editing ? (
            <textarea
              value={editOutcome}
              onChange={(e) => setEditOutcome(e.target.value)}
              rows={3}
              placeholder="What measurable outcome will this commitment deliver?"
              className="mt-2 w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-950 focus:border-amber-500 focus:outline-none"
            />
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-navy-600">
              {commitment.outcome || "No outcome defined yet."}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
              <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium uppercase tracking-wider text-navy-400">Key Results</h3>
          </div>
          {editing ? (
            <textarea
              value={editKeyResults}
              onChange={(e) => setEditKeyResults(e.target.value)}
              rows={3}
              placeholder="How will you measure success?"
              className="mt-2 w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-950 focus:border-amber-500 focus:outline-none"
            />
          ) : (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-navy-600">
              {commitment.keyResults || "No key results defined yet."}
            </p>
          )}
        </div>
      </div>

      {/* Edit / Save / Delete buttons */}
      <div className="mt-6 flex items-center gap-3">
        {editing ? (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy-800 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setEditTitle(commitment.title);
                setEditOutcome(commitment.outcome || "");
                setEditKeyResults(commitment.keyResults || "");
                setEditDueDate(
                  commitment.dueDate
                    ? new Date(commitment.dueDate).toISOString().split("T")[0]
                    : ""
                );
              }}
              className="rounded-lg border border-navy-200 px-4 py-2 text-sm font-medium text-navy-600 transition-colors hover:bg-navy-50"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg border border-navy-200 px-4 py-2 text-sm font-medium text-navy-600 transition-colors hover:bg-navy-50"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                confirmDelete
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "border border-red-200 text-red-500 hover:bg-red-50"
              } disabled:opacity-50`}
            >
              {deleting
                ? "Deleting..."
                : confirmDelete
                  ? "Confirm Delete"
                  : "Delete"}
            </button>
            {confirmDelete && (
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-sm text-navy-400 hover:text-navy-600"
              >
                Cancel
              </button>
            )}
          </>
        )}
      </div>

      {/* Divider */}
      <hr className="my-8 border-navy-100" />

      {/* Tasks Section */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-navy-950">Tasks</h2>
          <span className="text-sm text-navy-400">{tasks.length} task{tasks.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Task list */}
        {tasks.length > 0 ? (
          <div className="mt-4 space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="group flex items-center gap-3 rounded-lg border border-navy-100 bg-white px-4 py-3 transition-all hover:border-navy-200"
              >
                <TaskStatusIcon
                  status={task.status}
                  onClick={() => handleTaskStatusToggle(task)}
                />
                <span
                  className={`flex-1 text-sm ${
                    task.status === "done"
                      ? "text-navy-400 line-through"
                      : "text-navy-900"
                  }`}
                >
                  {task.title}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    task.status === "done"
                      ? "bg-green-100 text-green-700"
                      : task.status === "in_progress"
                        ? "bg-amber-100 text-amber-700"
                        : task.status === "blocked"
                          ? "bg-red-100 text-red-700"
                          : "bg-navy-50 text-navy-400"
                  }`}
                >
                  {task.status.replace("_", " ")}
                </span>
                <button
                  onClick={() => setDeleteTaskId(task.id)}
                  className="shrink-0 rounded p-1 text-navy-300 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                  title="Delete task"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border-2 border-dashed border-navy-200 bg-white p-8 text-center">
            <p className="text-sm text-navy-400">No tasks yet. Add one below.</p>
          </div>
        )}

        {/* Add Task form */}
        <form onSubmit={handleAddTask} className="mt-4 flex items-center gap-3">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add a task..."
            className="flex-1 rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-950 placeholder:text-navy-300 focus:border-amber-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={addingTask || !newTaskTitle.trim()}
            className="shrink-0 rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800 disabled:opacity-50"
          >
            {addingTask ? "Adding..." : "+ Add Task"}
          </button>
        </form>
      </div>

      {/* Delete task confirmation */}
      <ConfirmDialog
        open={deleteTaskId !== null}
        title="Delete task"
        description="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (deleteTaskId) {
            handleDeleteTask(deleteTaskId);
            setDeleteTaskId(null);
          }
        }}
        onCancel={() => setDeleteTaskId(null)}
      />
    </div>
  );
}
