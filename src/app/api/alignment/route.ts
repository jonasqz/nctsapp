import { db } from "@/lib/db";
import {
  strategicPillar,
  narrative,
  commitment,
  task,
  team,
  cycle,
} from "@/lib/db/schema";
import { getSessionAndWorkspace } from "@/lib/workspace";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

interface AlignmentGap {
  severity: "critical" | "warning" | "info";
  type:
    | "pillar_no_narratives"
    | "team_no_narratives"
    | "narrative_no_commitments"
    | "commitment_no_tasks"
    | "narrative_no_pillar";
  message: string;
  action: { label: string; href: string };
  entityId: string;
}

export async function GET() {
  const ctx = await getSessionAndWorkspace();
  if (!ctx)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspace: ws } = ctx;

  const [pillars, narratives, commitments, tasks, teams, cycles] =
    await Promise.all([
      db
        .select()
        .from(strategicPillar)
        .where(
          and(
            eq(strategicPillar.workspaceId, ws.id),
            eq(strategicPillar.status, "active"),
          ),
        ),
      db
        .select()
        .from(narrative)
        .where(eq(narrative.workspaceId, ws.id)),
      db
        .select()
        .from(commitment)
        .where(eq(commitment.workspaceId, ws.id)),
      db.select().from(task).where(eq(task.workspaceId, ws.id)),
      db.select().from(team).where(eq(team.workspaceId, ws.id)),
      db.select().from(cycle).where(eq(cycle.workspaceId, ws.id)),
    ]);

  const gaps: AlignmentGap[] = [];

  // 1. Pillars without narratives (critical)
  for (const pillar of pillars) {
    const linked = narratives.some((n) => n.pillarId === pillar.id);
    if (!linked) {
      gaps.push({
        severity: "critical",
        type: "pillar_no_narratives",
        message: `Pillar "${pillar.title}" has no linked narratives`,
        action: {
          label: "Create Narrative",
          href: `/dashboard/narratives/new?pillarId=${pillar.id}`,
        },
        entityId: pillar.id,
      });
    }
  }

  // 2. Teams without narratives in the active cycle (critical)
  const activeCycle = cycles.find((c) => c.status === "active");
  if (activeCycle) {
    for (const t of teams) {
      const hasNarrative = narratives.some(
        (n) => n.teamId === t.id && n.cycleId === activeCycle.id,
      );
      if (!hasNarrative) {
        gaps.push({
          severity: "critical",
          type: "team_no_narratives",
          message: `${t.name} team has no narratives this cycle`,
          action: {
            label: "Create Narrative",
            href: `/dashboard/narratives/new?teamId=${t.id}&cycleId=${activeCycle.id}`,
          },
          entityId: t.id,
        });
      }
    }
  }

  // 3. Narratives without commitments (warning)
  for (const n of narratives) {
    const hasCommitment = commitments.some((c) => c.narrativeId === n.id);
    if (!hasCommitment) {
      gaps.push({
        severity: "warning",
        type: "narrative_no_commitments",
        message: `Narrative "${n.title}" has no commitments`,
        action: {
          label: "Add Commitment",
          href: `/dashboard/narratives/${n.id}`,
        },
        entityId: n.id,
      });
    }
  }

  // 4. Commitments without tasks (warning)
  for (const c of commitments) {
    const hasTask = tasks.some((t) => t.commitmentId === c.id);
    if (!hasTask) {
      gaps.push({
        severity: "warning",
        type: "commitment_no_tasks",
        message: `Commitment "${c.title}" has no tasks`,
        action: {
          label: "Add Task",
          href: `/dashboard/commitments/${c.id}`,
        },
        entityId: c.id,
      });
    }
  }

  // 5. Narratives not linked to any pillar (info)
  for (const n of narratives) {
    if (!n.pillarId) {
      gaps.push({
        severity: "info",
        type: "narrative_no_pillar",
        message: `Narrative "${n.title}" is not linked to a pillar`,
        action: {
          label: "Link to Pillar",
          href: `/dashboard/narratives/${n.id}`,
        },
        entityId: n.id,
      });
    }
  }

  // Calculate alignment score: start at 100, apply penalties
  let score = 100;
  for (const gap of gaps) {
    if (gap.severity === "critical") score -= 10;
    else if (gap.severity === "warning") score -= 5;
    else score -= 2;
  }
  score = Math.max(0, Math.min(100, score));

  return NextResponse.json({ gaps, score });
}
