import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";

// ─── Better Auth tables ───────────────────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Workspace & Planning enums ──────────────────────────────────────

export const planningRhythmEnum = pgEnum("planning_rhythm", [
  "quarters",
  "cycles",
  "custom",
]);

export const cycleStatusEnum = pgEnum("cycle_status", [
  "planning",
  "active",
  "review",
  "archived",
]);

export const pillarStatusEnum = pgEnum("pillar_status", [
  "active",
  "archived",
]);

export const workspaceRoleEnum = pgEnum("workspace_role", [
  "owner",
  "admin",
  "editor",
  "viewer",
]);

export const inviteTypeEnum = pgEnum("invite_type", ["email", "link"]);

// ─── Workspace tables ────────────────────────────────────────────────

export const workspace = pgTable("workspace", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  vision: text("vision"),
  strategyDocUrl: text("strategy_doc_url"),
  planningRhythm: planningRhythmEnum("planning_rhythm")
    .notNull()
    .default("quarters"),
  cycleLengthWeeks: integer("cycle_length_weeks"),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const workspaceMember = pgTable("workspace_member", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspace.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: workspaceRoleEnum("role").notNull().default("editor"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("workspace_member_workspace_id_idx").on(t.workspaceId),
  index("workspace_member_user_id_idx").on(t.userId),
]);

export const workspaceInvite = pgTable("workspace_invite", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspace.id, { onDelete: "cascade" }),
  invitedBy: text("invited_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: inviteTypeEnum("type").notNull(),
  email: text("email"),
  role: workspaceRoleEnum("role").notNull().default("editor"),
  code: text("code").notNull().unique(),
  expiresAt: timestamp("expires_at"),
  acceptedAt: timestamp("accepted_at"),
  acceptedBy: text("accepted_by").references(() => user.id, {
    onDelete: "set null",
  }),
  revokedAt: timestamp("revoked_at"),
  maxUses: integer("max_uses"),
  useCount: integer("use_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("workspace_invite_workspace_id_idx").on(t.workspaceId),
  index("workspace_invite_code_idx").on(t.code),
]);

export const year = pgTable("year", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspace.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("year_workspace_id_idx").on(t.workspaceId),
]);

export const cycle = pgTable("cycle", {
  id: text("id").primaryKey(),
  yearId: text("year_id")
    .notNull()
    .references(() => year.id, { onDelete: "cascade" }),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspace.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: cycleStatusEnum("status").notNull().default("planning"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("cycle_workspace_id_idx").on(t.workspaceId),
  index("cycle_year_id_idx").on(t.yearId),
]);

export const team = pgTable("team", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspace.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("team_workspace_id_idx").on(t.workspaceId),
]);

export const teamMember = pgTable("team_member", {
  id: text("id").primaryKey(),
  teamId: text("team_id")
    .notNull()
    .references(() => team.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("team_member_team_id_idx").on(t.teamId),
  index("team_member_user_id_idx").on(t.userId),
]);

export const strategicPillar = pgTable("strategic_pillar", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspace.id, { onDelete: "cascade" }),
  yearId: text("year_id")
    .notNull()
    .references(() => year.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  order: integer("order").notNull().default(0),
  status: pillarStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("strategic_pillar_workspace_id_idx").on(t.workspaceId),
]);

export const kpi = pgTable("kpi", {
  id: text("id").primaryKey(),
  pillarId: text("pillar_id")
    .notNull()
    .references(() => strategicPillar.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  targetValue: text("target_value").notNull(),
  currentValue: text("current_value"),
  unit: text("unit"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("kpi_pillar_id_idx").on(t.pillarId),
]);

// ─── Subscription ───────────────────────────────────────────────────

export const planEnum = pgEnum("plan", ["free", "business", "pro"]);

export const billingIntervalEnum = pgEnum("billing_interval", [
  "monthly",
  "annual",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "canceled",
  "past_due",
  "trialing",
  "incomplete",
]);

export const subscription = pgTable("subscription", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspace.id, { onDelete: "cascade" }),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  stripeSubscriptionId: text("stripe_subscription_id"),
  plan: planEnum("plan").notNull().default("free"),
  billingInterval: billingIntervalEnum("billing_interval")
    .notNull()
    .default("monthly"),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("subscription_workspace_id_idx").on(t.workspaceId),
]);

// ─── NCT enums ───────────────────────────────────────────────────────

export const nctStatusEnum = pgEnum("nct_status", [
  "draft",
  "active",
  "at_risk",
  "completed",
  "archived",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "todo",
  "in_progress",
  "done",
  "blocked",
]);

// ─── NCT tables ──────────────────────────────────────────────────────

export const narrative = pgTable("narrative", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  context: text("context"),
  whyNow: text("why_now"),
  successLooksLike: text("success_looks_like"),
  status: nctStatusEnum("status").notNull().default("draft"),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // Workspace hierarchy (nullable for backward compat)
  workspaceId: text("workspace_id").references(() => workspace.id, {
    onDelete: "cascade",
  }),
  cycleId: text("cycle_id").references(() => cycle.id, {
    onDelete: "set null",
  }),
  teamId: text("team_id").references(() => team.id, {
    onDelete: "set null",
  }),
  pillarId: text("pillar_id").references(() => strategicPillar.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("narrative_workspace_id_idx").on(t.workspaceId),
  index("narrative_team_id_idx").on(t.teamId),
  index("narrative_cycle_id_idx").on(t.cycleId),
  index("narrative_owner_id_idx").on(t.ownerId),
]);

export const commitment = pgTable("commitment", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  outcome: text("outcome"),
  keyResults: text("key_results"),
  status: nctStatusEnum("status").notNull().default("draft"),
  dueDate: timestamp("due_date"),
  narrativeId: text("narrative_id")
    .notNull()
    .references(() => narrative.id, { onDelete: "cascade" }),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // Workspace hierarchy (nullable for backward compat)
  workspaceId: text("workspace_id").references(() => workspace.id, {
    onDelete: "cascade",
  }),
  teamId: text("team_id").references(() => team.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("commitment_narrative_id_idx").on(t.narrativeId),
  index("commitment_workspace_id_idx").on(t.workspaceId),
  index("commitment_owner_id_idx").on(t.ownerId),
]);

export const task = pgTable("task", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  acceptanceCriteria: text("acceptance_criteria"),
  status: taskStatusEnum("status").notNull().default("todo"),
  dueDate: timestamp("due_date"),
  commitmentId: text("commitment_id")
    .notNull()
    .references(() => commitment.id, { onDelete: "cascade" }),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // Workspace hierarchy (nullable for backward compat)
  workspaceId: text("workspace_id").references(() => workspace.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("task_commitment_id_idx").on(t.commitmentId),
  index("task_workspace_id_idx").on(t.workspaceId),
  index("task_owner_id_idx").on(t.ownerId),
]);

// ─── Marketing / Leads ───────────────────────────────────────────────

export const leads = pgTable("leads", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  source: text("source").notNull().default("guide"), // guide | newsletter | etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [
  index("leads_email_idx").on(t.email),
]);
