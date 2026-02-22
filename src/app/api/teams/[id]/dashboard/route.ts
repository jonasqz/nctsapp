import { getSessionAndWorkspace } from "@/lib/workspace";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eq, and, inArray } from "drizzle-orm";
import { team, narrative, commitment, task, teamMember, user } from "@/lib/db/schema";

function isPastDue(date: Date | string | null): boolean {
  if (!date) return false;
  const d = typeof date === "string" ? new Date(date) : date;
  return d.getTime() < Date.now();
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await getSessionAndWorkspace();
  if (!ctx)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspace: ws } = ctx;
  const { id } = await params;

  // Verify team exists and belongs to workspace
  const teamRow = await db
    .select()
    .from(team)
    .where(and(eq(team.id, id), eq(team.workspaceId, ws.id)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!teamRow) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  // Fetch narratives for this team
  const teamNarratives = await db
    .select()
    .from(narrative)
    .where(
      and(eq(narrative.workspaceId, ws.id), eq(narrative.teamId, id)),
    );

  const narrativeIds = teamNarratives.map((n) => n.id);

  // Fetch commitments for these narratives
  const teamCommitments =
    narrativeIds.length > 0
      ? await db
          .select()
          .from(commitment)
          .where(
            and(
              eq(commitment.workspaceId, ws.id),
              inArray(commitment.narrativeId, narrativeIds),
            ),
          )
      : [];

  const commitmentIds = teamCommitments.map((c) => c.id);

  // Fetch tasks for these commitments
  const teamTasks =
    commitmentIds.length > 0
      ? await db
          .select()
          .from(task)
          .where(
            and(
              eq(task.workspaceId, ws.id),
              inArray(task.commitmentId, commitmentIds),
            ),
          )
      : [];

  // Compute stats
  const stats = {
    totalNarratives: teamNarratives.length,
    activeNarratives: teamNarratives.filter((n) => n.status === "active")
      .length,
    draftNarratives: teamNarratives.filter((n) => n.status === "draft").length,
    atRiskNarratives: teamNarratives.filter((n) => n.status === "at_risk")
      .length,
    completedNarratives: teamNarratives.filter(
      (n) => n.status === "completed",
    ).length,
    totalCommitments: teamCommitments.length,
    activeCommitments: teamCommitments.filter((c) => c.status === "active")
      .length,
    atRiskCommitments: teamCommitments.filter((c) => c.status === "at_risk")
      .length,
    completedCommitments: teamCommitments.filter(
      (c) => c.status === "completed",
    ).length,
    totalTasks: teamTasks.length,
    completedTasks: teamTasks.filter((t) => t.status === "done").length,
    inProgressTasks: teamTasks.filter((t) => t.status === "in_progress").length,
    overdueTasks: teamTasks.filter(
      (t) => t.status !== "done" && isPastDue(t.dueDate),
    ).length,
    blockedTasks: teamTasks.filter((t) => t.status === "blocked").length,
  };

  // Build enriched narrative list with commitment/task counts
  const commitmentsByNarrative = new Map<string, typeof teamCommitments>();
  for (const c of teamCommitments) {
    const list = commitmentsByNarrative.get(c.narrativeId) ?? [];
    list.push(c);
    commitmentsByNarrative.set(c.narrativeId, list);
  }

  const tasksByCommitment = new Map<string, typeof teamTasks>();
  for (const t of teamTasks) {
    if (t.commitmentId) {
      const list = tasksByCommitment.get(t.commitmentId) ?? [];
      list.push(t);
      tasksByCommitment.set(t.commitmentId, list);
    }
  }

  // Sort: active first, then at_risk, then draft, then completed, then archived
  const statusOrder: Record<string, number> = {
    active: 0,
    at_risk: 1,
    draft: 2,
    completed: 3,
    archived: 4,
  };

  const narrativesWithCounts = teamNarratives
    .map((n) => {
      const nCommitments = commitmentsByNarrative.get(n.id) ?? [];
      let taskCount = 0;
      let tasksDone = 0;
      for (const c of nCommitments) {
        const cTasks = tasksByCommitment.get(c.id) ?? [];
        taskCount += cTasks.length;
        tasksDone += cTasks.filter((t) => t.status === "done").length;
      }
      return {
        id: n.id,
        title: n.title,
        status: n.status,
        cycleId: n.cycleId,
        commitmentCount: nCommitments.length,
        taskCount,
        tasksDone,
      };
    })
    .sort(
      (a, b) => (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99),
    );

  // Fetch team members with user info
  const members = await db
    .select({
      id: teamMember.id,
      userId: teamMember.userId,
      createdAt: teamMember.createdAt,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image,
    })
    .from(teamMember)
    .innerJoin(user, eq(user.id, teamMember.userId))
    .where(eq(teamMember.teamId, id));

  return NextResponse.json({
    team: { id: teamRow.id, name: teamRow.name },
    stats,
    narratives: narrativesWithCounts,
    members: members.map((m) => ({
      id: m.id,
      userId: m.userId,
      createdAt: m.createdAt,
      user: {
        id: m.userId,
        name: m.userName,
        email: m.userEmail,
        image: m.userImage,
      },
    })),
  });
}
