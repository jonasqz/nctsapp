import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  workspace,
  workspaceMember,
  year,
  cycle,
  team,
} from "@/lib/db/schema";

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    name,
    vision,
    strategyDocUrl,
    planningRhythm,
    cycleLengthWeeks,
    teams,
  } = body as {
    name: string;
    vision?: string;
    strategyDocUrl?: string;
    planningRhythm: "quarters" | "cycles" | "custom";
    cycleLengthWeeks?: number;
    teams: string[];
  };

  const now = new Date();
  const currentYear = now.getFullYear();

  // Create workspace
  const [createdWorkspace] = await db
    .insert(workspace)
    .values({
      id: `ws-${Date.now()}`,
      name,
      vision,
      strategyDocUrl,
      planningRhythm,
      cycleLengthWeeks,
      createdBy: session.user.id,
    })
    .returning();

  // Create workspace member with owner role
  await db.insert(workspaceMember).values({
    id: `wm-${Date.now()}`,
    workspaceId: createdWorkspace.id,
    userId: session.user.id,
    role: "owner",
  });

  // Create year record for current year
  const [createdYear] = await db
    .insert(year)
    .values({
      id: `yr-${Date.now()}`,
      workspaceId: createdWorkspace.id,
      year: currentYear,
    })
    .returning();

  // Determine cycle name, start date, and end date based on planning rhythm
  let cycleName: string;
  let startDate: Date;
  let endDate: Date;

  if (planningRhythm === "quarters") {
    cycleName = `Q1 ${currentYear}`;
    startDate = new Date(currentYear, 0, 1); // Jan 1
    endDate = new Date(currentYear, 2, 31); // Mar 31
  } else if (planningRhythm === "cycles" && cycleLengthWeeks) {
    cycleName = "Cycle 1";
    startDate = now;
    endDate = new Date(
      now.getTime() + cycleLengthWeeks * 7 * 24 * 60 * 60 * 1000
    );
  } else {
    // custom
    cycleName = "Cycle 1";
    startDate = now;
    endDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  }

  // Create first cycle
  await db.insert(cycle).values({
    id: `cy-${Date.now()}`,
    yearId: createdYear.id,
    workspaceId: createdWorkspace.id,
    name: cycleName,
    startDate,
    endDate,
    status: "active",
  });

  // Create teams (default to "My Team" if none provided)
  const teamNames = teams && teams.length > 0 ? teams : ["My Team"];

  for (let i = 0; i < teamNames.length; i++) {
    await db.insert(team).values({
      id: `tm-${Date.now()}-${i}`,
      workspaceId: createdWorkspace.id,
      name: teamNames[i],
    });
  }

  return NextResponse.json(createdWorkspace, { status: 201 });
}
