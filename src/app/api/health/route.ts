import { db } from "@/lib/db";
import {
  narrative,
  commitment,
  task,
  strategicPillar,
} from "@/lib/db/schema";
import { getSessionAndWorkspace } from "@/lib/workspace";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

function daysSince(date: Date | string | null): number {
  if (!date) return 0;
  const d = typeof date === "string" ? new Date(date) : date;
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

function isPastDue(date: Date | string | null): boolean {
  if (!date) return false;
  const d = typeof date === "string" ? new Date(date) : date;
  return d.getTime() < Date.now();
}

export async function GET() {
  const ctx = await getSessionAndWorkspace();
  if (!ctx)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspace: ws } = ctx;

  // Fetch all workspace data in parallel
  const [narratives, commitments, tasks, pillars] = await Promise.all([
    db.select().from(narrative).where(eq(narrative.workspaceId, ws.id)),
    db.select().from(commitment).where(eq(commitment.workspaceId, ws.id)),
    db.select().from(task).where(eq(task.workspaceId, ws.id)),
    db
      .select()
      .from(strategicPillar)
      .where(eq(strategicPillar.workspaceId, ws.id)),
  ]);

  // Calculate health score
  let score = 100;
  const issues: string[] = [];

  // Pillars without narratives (-5 each)
  const activePillars = pillars.filter((p) => p.status === "active");
  for (const pillar of activePillars) {
    const linked = narratives.some((n) => n.pillarId === pillar.id);
    if (!linked) {
      score -= 5;
      issues.push(`Pillar '${pillar.title}' has no linked narratives`);
    }
  }

  // Narratives without commitments (-10 each)
  const orphanNarratives = narratives.filter(
    (n) => !commitments.some((c) => c.narrativeId === n.id),
  );
  score -= orphanNarratives.length * 10;
  if (orphanNarratives.length > 0) {
    issues.push(
      `${orphanNarratives.length} narrative${orphanNarratives.length > 1 ? "s" : ""} without commitments`,
    );
  }

  // Commitments at risk (-5 each)
  const atRiskCommitments = commitments.filter((c) => c.status === "at_risk");
  score -= atRiskCommitments.length * 5;
  if (atRiskCommitments.length > 0) {
    issues.push(
      `${atRiskCommitments.length} commitment${atRiskCommitments.length > 1 ? "s" : ""} at risk`,
    );
  }

  // Archived commitments (minor penalty -2 each)
  const archivedCommitments = commitments.filter(
    (c) => c.status === "archived",
  );
  score -= archivedCommitments.length * 2;

  // Tasks without commitment (-3 each)
  const orphanTasks = tasks.filter(
    (t) => !commitments.some((c) => c.id === t.commitmentId),
  );
  score -= orphanTasks.length * 3;

  // Stale narratives (no activity 30+ days) (-5 each)
  const staleNarratives = narratives.filter(
    (n) => n.status === "active" && daysSince(n.updatedAt) > 30,
  );
  score -= staleNarratives.length * 5;

  // Overdue tasks (-2 each)
  const overdueTasks = tasks.filter(
    (t) => t.status !== "done" && isPastDue(t.dueDate),
  );
  score -= overdueTasks.length * 2;

  score = Math.max(0, Math.min(100, score));

  // Determine status
  let status: "healthy" | "needs_attention" | "at_risk";
  if (score >= 80) status = "healthy";
  else if (score >= 60) status = "needs_attention";
  else status = "at_risk";

  // Count stats
  const activeNarratives = narratives.filter(
    (n) => n.status === "active",
  ).length;
  const totalNarratives = narratives.length;
  const totalCommitments = commitments.length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const totalTasks = tasks.length;
  const blockedTasks = tasks.filter((t) => t.status === "blocked").length;
  const onTrackCommitments = commitments.filter(
    (c) => c.status === "active" || c.status === "draft",
  ).length;

  return NextResponse.json({
    score,
    status,
    issues,
    stats: {
      activeNarratives,
      totalNarratives,
      atRiskCommitments: atRiskCommitments.length,
      totalCommitments,
      completedTasks,
      totalTasks,
      orphanTasks: orphanTasks.length,
      blockedTasks,
      overdueTasks: overdueTasks.length,
      onTrackCommitments,
      staleNarratives: staleNarratives.length,
    },
  });
}
