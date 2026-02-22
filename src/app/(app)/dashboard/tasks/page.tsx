"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  commitmentId: string;
  dueDate: string | null;
  createdAt: string;
}

interface Commitment {
  id: string;
  title: string;
}

const TASK_STATUS_CYCLE: Record<string, string> = {
  todo: "in_progress",
  in_progress: "done",
  done: "todo",
  blocked: "todo",
};

function TaskStatusIcon({
  status,
  onClick,
}: {
  status: string;
  onClick: () => void;
}) {
  const base = "h-5 w-5 shrink-0 cursor-pointer transition-colors";

  if (status === "done") {
    return (
      <button
        onClick={onClick}
        className={`${base} text-green-500 hover:text-green-700`}
        title="Done - click to reset"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    );
  }

  if (status === "in_progress") {
    return (
      <button
        onClick={onClick}
        className={`${base} text-amber-500 hover:text-amber-700`}
        title="In progress - click to complete"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    );
  }

  if (status === "blocked") {
    return (
      <button
        onClick={onClick}
        className={`${base} text-red-400 hover:text-red-600`}
        title="Blocked - click to unblock"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18.364 5.636a9 9 0 11-12.728 12.728 9 9 0 0112.728-12.728zM5.636 18.364L18.364 5.636"
          />
        </svg>
      </button>
    );
  }

  // todo (default)
  return (
    <button
      onClick={onClick}
      className={`${base} text-navy-300 hover:text-navy-500`}
      title="To do - click to start"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="9" />
      </svg>
    </button>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/tasks").then((r) => r.json()),
      fetch("/api/commitments").then((r) => r.json()),
    ])
      .then(([tasksData, commitmentsData]) => {
        setTasks(tasksData);
        setCommitments(commitmentsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleStatusToggle(task: Task) {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-navy-400">Loading...</p>
      </div>
    );
  }

  const commitmentMap = new Map<string, Commitment>();
  for (const c of commitments) {
    commitmentMap.set(c.id, c);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-navy-950">Tasks</h1>
          <p className="mt-1 text-navy-400">
            The work that gets done. Every task knows why it exists.
          </p>
        </div>
      </div>

      {tasks.length === 0 ? (
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-navy-900">No tasks yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-navy-400">
            Create a commitment first, then add tasks that fulfill it.
          </p>
          <Link
            href="/dashboard/commitments"
            className="mt-6 inline-block rounded-lg border border-navy-200 px-5 py-2.5 text-sm font-medium text-navy-900 transition-colors hover:bg-navy-50"
          >
            Go to Commitments
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-2">
          {tasks.map((task) => {
            const parentCommitment = commitmentMap.get(task.commitmentId);
            return (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-xl border border-navy-100 bg-white px-5 py-4 transition-all hover:border-navy-200"
              >
                <TaskStatusIcon
                  status={task.status}
                  onClick={() => handleStatusToggle(task)}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium ${
                      task.status === "done"
                        ? "text-navy-400 line-through"
                        : "text-navy-900"
                    }`}
                  >
                    {task.title}
                  </p>
                  {parentCommitment && (
                    <p className="mt-0.5 text-xs text-navy-400">
                      <Link
                        href={`/dashboard/commitments/${parentCommitment.id}`}
                        className="hover:text-navy-600 transition-colors"
                      >
                        {parentCommitment.title}
                      </Link>
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
