// ─── Workspace & Planning ────────────────────────────────────────────

export interface Workspace {
  id: string;
  name: string;
  vision: string | null;
  strategyDocUrl: string | null;
  planningRhythm: "quarters" | "cycles" | "custom";
  cycleLengthWeeks: number | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: "owner" | "admin" | "editor" | "viewer";
  createdAt: string;
}

export interface Year {
  id: string;
  workspaceId: string;
  year: number;
  createdAt: string;
}

export interface Cycle {
  id: string;
  yearId: string;
  workspaceId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "planning" | "active" | "review" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface StrategicPillar {
  id: string;
  workspaceId: string;
  yearId: string;
  title: string;
  description: string | null;
  order: number;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
}

export interface KPI {
  id: string;
  pillarId: string;
  name: string;
  targetValue: string;
  currentValue: string | null;
  unit: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── NCT Entities ────────────────────────────────────────────────────

export interface Narrative {
  id: string;
  title: string;
  context: string | null;
  whyNow: string | null;
  successLooksLike: string | null;
  status: string;
  ownerId: string;
  workspaceId: string | null;
  cycleId: string | null;
  teamId: string | null;
  pillarId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Commitment {
  id: string;
  title: string;
  outcome: string | null;
  keyResults: string | null;
  status: string;
  dueDate: string | null;
  narrativeId: string;
  ownerId: string;
  workspaceId: string | null;
  teamId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  acceptanceCriteria: string | null;
  status: string;
  dueDate: string | null;
  commitmentId: string;
  ownerId: string;
  workspaceId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Dashboard & Health ──────────────────────────────────────────────

export interface HealthData {
  score: number;
  status: "healthy" | "needs_attention" | "at_risk";
  issues: string[];
  stats: {
    activeNarratives: number;
    totalNarratives: number;
    atRiskCommitments: number;
    totalCommitments: number;
    completedTasks: number;
    totalTasks: number;
    orphanTasks: number;
    blockedTasks: number;
    overdueTasks: number;
    onTrackCommitments: number;
    staleNarratives: number;
  };
}

// ─── Tree View ───────────────────────────────────────────────────────

export interface TreeTask {
  id: string;
  title: string;
  status: string;
}

export interface TreeCommitment {
  id: string;
  title: string;
  status: string;
  tasks: TreeTask[];
}

export interface TreeNarrative {
  id: string;
  title: string;
  status: string;
  commitments: TreeCommitment[];
}

export interface TreeTeam {
  id: string;
  name: string;
  narratives: TreeNarrative[];
}

export interface TreeCycle {
  id: string;
  name: string;
  status: string;
  teams: TreeTeam[];
}

export interface TreeYear {
  id: string;
  year: number;
  cycles: TreeCycle[];
}

export interface WorkspaceTree {
  workspace: { id: string; name: string };
  strategy: string | null;
  years: TreeYear[];
}

// ─── Onboarding ──────────────────────────────────────────────────────

export interface OnboardingPayload {
  name: string;
  vision?: string;
  strategyDocUrl?: string;
  planningRhythm: "quarters" | "cycles" | "custom";
  cycleLengthWeeks?: number;
  teams: string[];
}

export interface OnboardingStatus {
  needsOnboarding: boolean;
  workspaceId?: string;
}
