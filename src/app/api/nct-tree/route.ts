import { db } from "@/lib/db";
import {
  year,
  cycle,
  team,
  narrative,
  commitment,
  task,
} from "@/lib/db/schema";
import { getSessionAndWorkspace } from "@/lib/workspace";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const ctx = await getSessionAndWorkspace();
  if (!ctx)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { workspace: ws } = ctx;

  // Fetch all workspace data in parallel
  const [years, cycles, teams, narratives, commitments, tasks] =
    await Promise.all([
      db.select().from(year).where(eq(year.workspaceId, ws.id)),
      db.select().from(cycle).where(eq(cycle.workspaceId, ws.id)),
      db.select().from(team).where(eq(team.workspaceId, ws.id)),
      db.select().from(narrative).where(eq(narrative.workspaceId, ws.id)),
      db.select().from(commitment).where(eq(commitment.workspaceId, ws.id)),
      db.select().from(task).where(eq(task.workspaceId, ws.id)),
    ]);

  type Narrative = (typeof narratives)[number];
  type Commitment = (typeof commitments)[number];
  type Task = (typeof tasks)[number];

  // Index commitments by narrativeId
  const commitmentsByNarrative = new Map<string, Commitment[]>();
  for (const c of commitments) {
    const list = commitmentsByNarrative.get(c.narrativeId) ?? [];
    list.push(c);
    commitmentsByNarrative.set(c.narrativeId, list);
  }

  // Index tasks by commitmentId
  const tasksByCommitment = new Map<string, Task[]>();
  for (const t of tasks) {
    const list = tasksByCommitment.get(t.commitmentId) ?? [];
    list.push(t);
    tasksByCommitment.set(t.commitmentId, list);
  }

  // Helper: build narrative subtree
  function buildNarrative(n: Narrative) {
    const nCommitments = (commitmentsByNarrative.get(n.id) ?? []).map((c) => ({
      id: c.id,
      title: c.title,
      status: c.status,
      tasks: (tasksByCommitment.get(c.id) ?? []).map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
      })),
    }));

    return {
      id: n.id,
      title: n.title,
      status: n.status,
      commitments: nCommitments,
    };
  }

  // Separate categorized vs uncategorized narratives
  const categorized = narratives.filter((n) => n.cycleId && n.teamId);
  const uncategorized = narratives.filter((n) => !n.cycleId || !n.teamId);

  // Index categorized narratives by "cycleId:teamId"
  const narrativesByCycleTeam = new Map<string, Narrative[]>();
  for (const n of categorized) {
    const key = `${n.cycleId}:${n.teamId}`;
    const list = narrativesByCycleTeam.get(key) ?? [];
    list.push(n);
    narrativesByCycleTeam.set(key, list);
  }

  // Index cycles by yearId
  type Cycle = (typeof cycles)[number];
  const cyclesByYear = new Map<string, Cycle[]>();
  for (const c of cycles) {
    const list = cyclesByYear.get(c.yearId) ?? [];
    list.push(c);
    cyclesByYear.set(c.yearId, list);
  }

  // Build the tree
  const yearNodes = years
    .sort((a, b) => a.year - b.year)
    .map((y) => {
      const yCycles = (cyclesByYear.get(y.id) ?? []).map((c) => {
        const teamNodes = teams.map((t) => {
          const key = `${c.id}:${t.id}`;
          const teamNarratives = (narrativesByCycleTeam.get(key) ?? []).map(
            buildNarrative,
          );

          return {
            id: t.id,
            name: t.name,
            narratives: teamNarratives,
          };
        });

        return {
          id: c.id,
          name: c.name,
          status: c.status,
          startDate: c.startDate,
          endDate: c.endDate,
          teams: teamNodes,
        };
      });

      return {
        id: y.id,
        year: y.year,
        cycles: yCycles,
      };
    });

  // Build uncategorized section (if any legacy data exists)
  const uncategorizedNarratives = uncategorized.map(buildNarrative);

  return NextResponse.json({
    workspace: { id: ws.id, name: ws.name },
    strategy: ws.vision ?? null,
    years: yearNodes,
    ...(uncategorizedNarratives.length > 0
      ? { uncategorized: uncategorizedNarratives }
      : {}),
  });
}
