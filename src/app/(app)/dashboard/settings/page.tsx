"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSession, authClient } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PLANS, type PlanId } from "@/lib/plans";

// ─── Types ───────────────────────────────────────────────────────────

interface Workspace {
  id: string;
  name: string;
  vision: string | null;
  strategyDocUrl: string | null;
  planningRhythm: string;
  cycleLengthWeeks: number | null;
}

interface Team {
  id: string;
  name: string;
}

interface MemberUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

interface Member {
  id: string;
  userId: string;
  role: string;
  createdAt: string;
  user: MemberUser;
}

interface Invite {
  id: string;
  type: string;
  email: string | null;
  role: string;
  code: string;
  expiresAt: string | null;
  acceptedAt: string | null;
  revokedAt: string | null;
  useCount: number;
  createdAt: string;
}

type SettingsTab = "workspace" | "planning" | "teams" | "members" | "account" | "billing";

// ─── Tab config ──────────────────────────────────────────────────────

const tabConfig: {
  id: SettingsTab;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "workspace",
    label: "Workspace",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z"
      />
    ),
  },
  {
    id: "planning",
    label: "Planning Rhythm",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
      />
    ),
  },
  {
    id: "teams",
    label: "Teams",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
      />
    ),
  },
  {
    id: "members",
    label: "Members",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
      />
    ),
  },
  {
    id: "account",
    label: "Account",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      />
    ),
  },
  {
    id: "billing",
    label: "Billing",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
      />
    ),
  },
];

function getInitialTab(): SettingsTab {
  if (typeof window !== "undefined") {
    const hash = window.location.hash.replace("#", "");
    if (
      hash === "planning" ||
      hash === "teams" ||
      hash === "workspace" ||
      hash === "members" ||
      hash === "account" ||
      hash === "billing"
    ) {
      return hash;
    }
  }
  return "workspace";
}

// ─── Helpers ────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}

function getRoleBadgeClasses(role: string): string {
  switch (role) {
    case "owner":
      return "bg-amber-50 text-amber-700";
    case "admin":
      return "bg-blue-50 text-blue-700";
    case "editor":
      return "bg-green-50 text-green-700";
    case "viewer":
      return "bg-purple-50 text-purple-700";
    default:
      return "bg-navy-50 text-navy-500";
  }
}

function getRoleLabel(role: string): string {
  switch (role) {
    case "owner": return "Owner";
    case "admin": return "Admin";
    case "editor": return "Editor";
    case "viewer": return "Viewer";
    default: return role;
  }
}

// ─── Saved feedback ──────────────────────────────────────────────────

function SavedBadge() {
  return (
    <span className="flex items-center gap-1.5 text-sm font-medium text-green-600">
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 12.75l6 6 9-13.5"
        />
      </svg>
      Saved
    </span>
  );
}

// ─── Page ────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl animate-pulse space-y-6">
          <div className="h-8 w-32 rounded-lg bg-navy-100" />
          <div className="h-4 w-64 rounded bg-navy-50" />
          <div className="mt-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-navy-50" />
            ))}
          </div>
        </div>
      }
    >
      <SettingsPageInner />
    </Suspense>
  );
}

function SettingsPageInner() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<SettingsTab>("workspace");
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Workspace save state
  const [savingWorkspace, setSavingWorkspace] = useState(false);
  const [savedWorkspace, setSavedWorkspace] = useState(false);

  // Planning save state
  const [savingPlanning, setSavingPlanning] = useState(false);
  const [savedPlanning, setSavedPlanning] = useState(false);

  // Editable workspace fields
  const [name, setName] = useState("");
  const [vision, setVision] = useState("");
  const [strategyDocUrl, setStrategyDocUrl] = useState("");
  const [planningRhythm, setPlanningRhythm] = useState("quarters");
  const [cycleLengthWeeks, setCycleLengthWeeks] = useState<number | "">("");

  // Team management
  const [newTeamName, setNewTeamName] = useState("");
  const [addingTeam, setAddingTeam] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editingTeamName, setEditingTeamName] = useState("");

  // Members tab state
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersLoaded, setMembersLoaded] = useState(false);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Invite link state
  const [generatingLink, setGeneratingLink] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Confirmation dialog state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "team" | "invite" | "member";
    id: string;
    name: string;
  } | null>(null);

  // Account tab state
  const [displayName, setDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savedName, setSavedName] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Billing tab state
  const searchParams = useSearchParams();
  const [billingPlan, setBillingPlan] = useState<string>("free");
  const [billingInterval, setBillingInterval] = useState<string>("monthly");
  const [billingStatus, setBillingStatus] = useState<string>("active");
  const [billingPeriodEnd, setBillingPeriodEnd] = useState<string | null>(null);
  const [billingCancelAt, setBillingCancelAt] = useState(false);
  const [billingHasStripe, setBillingHasStripe] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [checkoutInterval, setCheckoutInterval] = useState<"monthly" | "annual">("monthly");
  const [billingUsage, setBillingUsage] = useState<{
    editors: number;
    viewers: number;
    editorLimit: number;
    viewerLimit: number;
  } | null>(null);

  // Initialize tab from hash or search params
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "billing") {
      setActiveTab("billing");
    } else {
      setActiveTab(getInitialTab());
    }
  }, [searchParams]);

  function switchTab(tab: SettingsTab) {
    setActiveTab(tab);
    window.history.replaceState({}, "", `#${tab}`);
  }

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [wsRes, teamsRes] = await Promise.all([
        fetch("/api/workspaces"),
        fetch("/api/teams"),
      ]);

      if (wsRes.ok) {
        const workspaces = await wsRes.json();
        if (workspaces.length > 0) {
          const ws = workspaces[0];
          setWorkspace(ws);
          setName(ws.name);
          setVision(ws.vision || "");
          setStrategyDocUrl(ws.strategyDocUrl || "");
          setPlanningRhythm(ws.planningRhythm || "quarters");
          setCycleLengthWeeks(ws.cycleLengthWeeks || "");
        }
      }

      if (teamsRes.ok) {
        setTeams(await teamsRes.json());
      }
    } catch {
      // silent
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Load members data when tab becomes active ────────────────────

  const loadMembersData = useCallback(async () => {
    setMembersLoading(true);
    try {
      const [membersRes, invitesRes] = await Promise.all([
        fetch("/api/members"),
        fetch("/api/invites"),
      ]);

      if (membersRes.ok) {
        setMembers(await membersRes.json());
      }
      if (invitesRes.ok) {
        setInvites(await invitesRes.json());
      }
    } catch {
      // silent
    }
    setMembersLoading(false);
    setMembersLoaded(true);
  }, []);

  useEffect(() => {
    if (activeTab === "members" && !membersLoaded) {
      loadMembersData();
    }
  }, [activeTab, membersLoaded, loadMembersData]);

  // Load billing data when billing tab is active
  const loadBillingData = useCallback(async () => {
    setBillingLoading(true);
    try {
      const res = await fetch("/api/subscription");
      if (res.ok) {
        const data = await res.json();
        setBillingPlan(data.plan);
        setBillingInterval(data.billingInterval || "monthly");
        setBillingStatus(data.status);
        setBillingPeriodEnd(data.currentPeriodEnd);
        setBillingCancelAt(data.cancelAtPeriodEnd);
        setBillingHasStripe(data.hasStripeSubscription);
        if (data.usage) setBillingUsage(data.usage);
      }
    } catch {
      // silent
    }
    setBillingLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === "billing") {
      loadBillingData();
    }
  }, [activeTab, loadBillingData]);

  // ─── Derived state ────────────────────────────────────────────────

  const currentUserId = session?.user?.id;
  const currentMember = members.find((m) => m.userId === currentUserId);
  const currentUserRole = currentMember?.role;
  const isAdminOrOwner =
    currentUserRole === "admin" || currentUserRole === "owner";

  const activeLinkInvite = invites.find(
    (inv) =>
      inv.type === "link" && inv.acceptedAt === null && inv.revokedAt === null,
  );

  const pendingEmailInvites = invites.filter(
    (inv) =>
      inv.type === "email" && inv.acceptedAt === null && inv.revokedAt === null,
  );

  // ─── Workspace save ────────────────────────────────────────────────

  async function handleSaveWorkspace(e: React.FormEvent) {
    e.preventDefault();
    if (!workspace) return;

    setSavingWorkspace(true);
    setSavedWorkspace(false);

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          vision: vision.trim() || null,
          strategyDocUrl: strategyDocUrl.trim() || null,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setWorkspace(updated);
        setSavedWorkspace(true);
        setTimeout(() => setSavedWorkspace(false), 2000);
        toast.success("Workspace settings saved");
      } else {
        toast.error("Failed to save workspace settings");
      }
    } catch {
      toast.error("Failed to save workspace settings");
    }
    setSavingWorkspace(false);
  }

  // ─── Planning save ─────────────────────────────────────────────────

  async function handleSavePlanning(e: React.FormEvent) {
    e.preventDefault();
    if (!workspace) return;

    setSavingPlanning(true);
    setSavedPlanning(false);

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planningRhythm,
          cycleLengthWeeks:
            planningRhythm === "cycles" && cycleLengthWeeks
              ? Number(cycleLengthWeeks)
              : null,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setWorkspace(updated);
        setSavedPlanning(true);
        setTimeout(() => setSavedPlanning(false), 2000);
        toast.success("Planning settings saved");
      } else {
        toast.error("Failed to save planning settings");
      }
    } catch {
      toast.error("Failed to save planning settings");
    }
    setSavingPlanning(false);
  }

  // ─── Team handlers ─────────────────────────────────────────────────

  async function handleAddTeam() {
    if (!newTeamName.trim()) return;
    setAddingTeam(true);

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTeamName.trim() }),
      });

      if (res.ok) {
        const team = await res.json();
        setTeams([...teams, team]);
        setNewTeamName("");
        toast.success("Team created");
      } else {
        toast.error("Failed to create team");
      }
    } catch {
      toast.error("Failed to create team");
    }
    setAddingTeam(false);
  }

  async function handleRenameTeam(teamId: string) {
    if (!editingTeamName.trim()) return;

    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingTeamName.trim() }),
      });

      if (res.ok) {
        setTeams(
          teams.map((t) =>
            t.id === teamId ? { ...t, name: editingTeamName.trim() } : t,
          ),
        );
        setEditingTeamId(null);
        setEditingTeamName("");
        toast.success("Team renamed");
      } else {
        toast.error("Failed to rename team");
      }
    } catch {
      toast.error("Failed to rename team");
    }
  }

  async function handleDeleteTeam(teamId: string) {
    try {
      const res = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setTeams(teams.filter((t) => t.id !== teamId));
        toast.success("Team deleted");
      } else {
        toast.error("Failed to delete team");
      }
    } catch {
      toast.error("Failed to delete team");
    }
  }

  // ─── Member handlers ──────────────────────────────────────────────

  async function handleSendEmailInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setSendingInvite(true);
    setInviteFeedback(null);

    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "email",
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setInvites((prev) => [...prev, data.invite]);
        setInviteEmail("");
        setInviteRole("editor");
        setInviteFeedback({
          type: "success",
          message: `Invite sent to ${inviteEmail.trim()}`,
        });
        toast.success(`Invite sent to ${inviteEmail.trim()}`);
        setTimeout(() => setInviteFeedback(null), 3000);
      } else {
        const error = await res.json().catch(() => null);
        setInviteFeedback({
          type: "error",
          message: error?.message || "Failed to send invite",
        });
        toast.error(error?.message || "Failed to send invite");
      }
    } catch {
      setInviteFeedback({ type: "error", message: "Failed to send invite" });
      toast.error("Failed to send invite");
    }
    setSendingInvite(false);
  }

  async function handleGenerateInviteLink() {
    setGeneratingLink(true);
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "link" }),
      });

      if (res.ok) {
        const data = await res.json();
        setInvites((prev) => [...prev, data.invite]);
        toast.success("Invite link generated");
      } else {
        toast.error("Failed to generate invite link");
      }
    } catch {
      toast.error("Failed to generate invite link");
    }
    setGeneratingLink(false);
  }

  async function handleRevokeInvite(inviteId: string) {
    try {
      const res = await fetch(`/api/invites/${inviteId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setInvites((prev) =>
          prev.map((inv) =>
            inv.id === inviteId
              ? { ...inv, revokedAt: new Date().toISOString() }
              : inv,
          ),
        );
        toast.success("Invite revoked");
      } else {
        toast.error("Failed to revoke invite");
      }
    } catch {
      toast.error("Failed to revoke invite");
    }
  }

  async function handleUpdateMemberRole(memberId: string, newRole: string) {
    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)),
        );
        toast.success(`Role updated to ${newRole}`);
      } else {
        toast.error("Failed to update role");
      }
    } catch {
      toast.error("Failed to update role");
    }
  }

  async function handleRemoveMember(memberId: string) {
    try {
      const res = await fetch(`/api/members/${memberId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
        toast.success("Member removed");
      } else {
        toast.error("Failed to remove member");
      }
    } catch {
      toast.error("Failed to remove member");
    }
  }

  function copyInviteLink(code: string) {
    const url = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  // ─── Account handlers ──────────────────────────────────────────────

  // Sync display name from session
  useEffect(() => {
    if (session?.user?.name) {
      setDisplayName(session.user.name);
    }
  }, [session?.user?.name]);

  async function handleSaveDisplayName(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;

    setSavingName(true);
    setSavedName(false);

    const { error } = await authClient.updateUser({
      name: displayName.trim(),
    });

    if (!error) {
      setSavedName(true);
      toast.success("Display name updated");
      setTimeout(() => setSavedName(false), 2000);
    } else {
      toast.error("Failed to update display name");
    }
    setSavingName(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword.length < 8) {
      setPasswordFeedback({
        type: "error",
        message: "New password must be at least 8 characters",
      });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordFeedback({
        type: "error",
        message: "New passwords don't match",
      });
      return;
    }

    setSavingPassword(true);

    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
    });

    if (error) {
      setPasswordFeedback({
        type: "error",
        message: error.message ?? "Failed to change password",
      });
      toast.error("Failed to change password");
    } else {
      setPasswordFeedback({
        type: "success",
        message: "Password changed successfully",
      });
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setTimeout(() => setPasswordFeedback(null), 3000);
    }
    setSavingPassword(false);
  }

  // ─── Billing handlers ─────────────────────────────────────────────

  async function handleCheckout(planId: PlanId) {
    setCheckoutLoading(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billingInterval: checkoutInterval }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        toast.error("Failed to start checkout");
      }
    } catch {
      toast.error("Failed to start checkout");
    }
    setCheckoutLoading(null);
  }

  async function handleManageBilling() {
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        toast.error("Failed to open billing portal");
      }
    } catch {
      toast.error("Failed to open billing portal");
    }
  }

  // ─── Shared classes ────────────────────────────────────────────────

  const inputClasses =
    "w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none";
  const selectClasses =
    "w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none";

  // ─── Loading state ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="font-heading text-2xl font-semibold text-navy-950">
          Settings
        </h1>
        <p className="mt-1 text-sm text-navy-400">
          Manage your workspace configuration.
        </p>
        <div className="mt-8 animate-pulse space-y-6">
          <div className="flex gap-6 border-b border-navy-200 pb-3">
            <div className="h-5 w-24 rounded bg-navy-100" />
            <div className="h-5 w-32 rounded bg-navy-50" />
            <div className="h-5 w-16 rounded bg-navy-50" />
          </div>
          <div className="h-12 rounded-lg bg-navy-50" />
          <div className="h-24 rounded-lg bg-navy-50" />
          <div className="h-12 rounded-lg bg-navy-50" />
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="font-heading text-2xl font-semibold text-navy-950">
          Settings
        </h1>
        <p className="mt-4 text-navy-400">
          No workspace found. Complete onboarding first.
        </p>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <h1 className="font-heading text-2xl font-semibold text-navy-950">
        Settings
      </h1>
      <p className="mt-1 text-sm text-navy-400">
        Manage your workspace configuration.
      </p>

      {/* Tab bar */}
      <div className="mt-6 border-b border-navy-200">
        <nav className="-mb-px flex gap-1" aria-label="Settings tabs">
          {tabConfig.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-amber-500 text-navy-950"
                    : "border-transparent text-navy-400 hover:border-navy-200 hover:text-navy-600"
                }`}
              >
                <svg
                  className="h-4.5 w-4.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  {tab.icon}
                </svg>
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <div className="mt-8">
        {/* ── Workspace Tab ─────────────────────────────────────────── */}
        {activeTab === "workspace" && (
          <form onSubmit={handleSaveWorkspace} className="space-y-6">
            <div className="rounded-xl border border-navy-100 bg-white p-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50">
                  <svg
                    className="h-4 w-4 text-navy-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-navy-950">
                    General
                  </h2>
                  <p className="text-sm text-navy-400">
                    Your workspace identity and strategy.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="ws-name"
                    className="mb-1.5 block text-sm font-medium text-navy-900"
                  >
                    Name
                  </label>
                  <input
                    id="ws-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className={inputClasses}
                    placeholder="e.g., Acme Corp"
                  />
                </div>

                <div>
                  <label
                    htmlFor="ws-vision"
                    className="mb-1.5 block text-sm font-medium text-navy-900"
                  >
                    Vision{" "}
                    <span className="font-normal text-navy-400">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    id="ws-vision"
                    rows={3}
                    value={vision}
                    onChange={(e) => setVision(e.target.value)}
                    className={inputClasses}
                    placeholder="Your company's long-term vision..."
                  />
                </div>

                <div>
                  <label
                    htmlFor="ws-strategy-url"
                    className="mb-1.5 block text-sm font-medium text-navy-900"
                  >
                    Strategy document URL{" "}
                    <span className="font-normal text-navy-400">
                      (optional)
                    </span>
                  </label>
                  <input
                    id="ws-strategy-url"
                    type="url"
                    value={strategyDocUrl}
                    onChange={(e) => setStrategyDocUrl(e.target.value)}
                    className={inputClasses}
                    placeholder="https://docs.google.com/..."
                  />
                </div>
              </div>
            </div>

            {/* Save button */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={savingWorkspace || !name.trim()}
                className="rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800 disabled:opacity-50"
              >
                {savingWorkspace ? "Saving..." : "Save Changes"}
              </button>
              {savedWorkspace && <SavedBadge />}
            </div>

            {/* Danger Zone */}
            <div className="rounded-xl border border-red-200 bg-white p-6">
              <h2 className="text-base font-semibold text-red-600">
                Danger Zone
              </h2>
              <p className="mt-0.5 text-sm text-navy-400">
                These actions are irreversible.
              </p>

              <div className="mt-4 flex items-center justify-between rounded-lg border border-red-100 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-navy-900">
                    Delete workspace
                  </p>
                  <p className="mt-0.5 text-xs text-navy-400">
                    Permanently delete this workspace and all its data.
                  </p>
                </div>
                <button
                  type="button"
                  disabled
                  className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 opacity-50"
                  title="Contact support for workspace deletion"
                >
                  Delete
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ── Planning Rhythm Tab ───────────────────────────────────── */}
        {activeTab === "planning" && (
          <form onSubmit={handleSavePlanning} className="space-y-6">
            <div className="rounded-xl border border-navy-100 bg-white p-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                  <svg
                    className="h-4 w-4 text-amber-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-navy-950">
                    Planning Rhythm
                  </h2>
                  <p className="text-sm text-navy-400">
                    How your team organizes work over time.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="ws-rhythm"
                    className="mb-1.5 block text-sm font-medium text-navy-900"
                  >
                    Rhythm
                  </label>
                  <select
                    id="ws-rhythm"
                    value={planningRhythm}
                    onChange={(e) => setPlanningRhythm(e.target.value)}
                    className={selectClasses}
                  >
                    <option value="quarters">Quarters (Q1-Q4)</option>
                    <option value="cycles">Cycles (flexible length)</option>
                    <option value="custom">Custom</option>
                  </select>
                  <p className="mt-2 text-xs text-navy-400">
                    {planningRhythm === "quarters" &&
                      "Work is organized into standard calendar quarters. New cycles will auto-fill with Q1\u2013Q4 dates."}
                    {planningRhythm === "cycles" &&
                      "Work is organized into fixed-length cycles. Set the length below."}
                    {planningRhythm === "custom" &&
                      "You define custom start and end dates for each cycle."}
                  </p>
                </div>

                {planningRhythm === "cycles" && (
                  <div>
                    <label
                      htmlFor="ws-cycle-length"
                      className="mb-1.5 block text-sm font-medium text-navy-900"
                    >
                      Cycle length (weeks)
                    </label>
                    <input
                      id="ws-cycle-length"
                      type="number"
                      min={1}
                      max={52}
                      value={cycleLengthWeeks}
                      onChange={(e) =>
                        setCycleLengthWeeks(
                          e.target.value ? Number(e.target.value) : "",
                        )
                      }
                      className={inputClasses}
                      placeholder="e.g., 6"
                    />
                    <p className="mt-1.5 text-xs text-navy-400">
                      New cycles will automatically span this many weeks.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Save button */}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={savingPlanning}
                className="rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800 disabled:opacity-50"
              >
                {savingPlanning ? "Saving..." : "Save Changes"}
              </button>
              {savedPlanning && <SavedBadge />}
            </div>
          </form>
        )}

        {/* ── Teams Tab ─────────────────────────────────────────────── */}
        {activeTab === "teams" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-navy-100 bg-white p-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50">
                  <svg
                    className="h-4 w-4 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-navy-950">
                    Teams
                  </h2>
                  <p className="text-sm text-navy-400">
                    Manage the teams in your workspace.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {teams.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-navy-200 px-4 py-8 text-center">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-navy-50">
                      <svg
                        className="h-5 w-5 text-navy-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-navy-700">
                      No teams yet
                    </p>
                    <p className="mt-1 text-xs text-navy-400">
                      Teams help organize narratives by group or department.
                    </p>
                  </div>
                ) : (
                  teams.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-lg border border-navy-100 px-4 py-3 transition-colors hover:bg-navy-50/50"
                    >
                      {editingTeamId === t.id ? (
                        <div className="flex flex-1 items-center gap-2">
                          <input
                            type="text"
                            value={editingTeamName}
                            onChange={(e) =>
                              setEditingTeamName(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRenameTeam(t.id);
                              if (e.key === "Escape") setEditingTeamId(null);
                            }}
                            className="flex-1 rounded-lg border border-navy-200 px-3 py-1.5 text-sm text-navy-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => handleRenameTeam(t.id)}
                            className="rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-800"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingTeamId(null)}
                            className="rounded-lg border border-navy-200 px-3 py-1.5 text-xs font-medium text-navy-600 hover:bg-navy-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50">
                              <svg
                                className="h-4 w-4 text-navy-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.5}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                                />
                              </svg>
                            </div>
                            <span className="text-sm font-medium text-navy-900">
                              {t.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingTeamId(t.id);
                                setEditingTeamName(t.name);
                              }}
                              className="rounded-lg p-1.5 text-navy-400 transition-colors hover:bg-navy-50 hover:text-navy-900"
                              title="Rename"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() =>
                                setDeleteConfirm({
                                  type: "team",
                                  id: t.id,
                                  name: t.name,
                                })
                              }
                              className="rounded-lg p-1.5 text-navy-400 transition-colors hover:bg-red-50 hover:text-red-600"
                              title="Delete"
                            >
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                                />
                              </svg>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Add team */}
              <div className="mt-4 flex items-center gap-2">
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTeam();
                    }
                  }}
                  placeholder="New team name..."
                  className="flex-1 rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
                <button
                  onClick={handleAddTeam}
                  disabled={addingTeam || !newTeamName.trim()}
                  className="rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800 disabled:opacity-50"
                >
                  {addingTeam ? "Adding..." : "Add Team"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Account Tab ───────────────────────────────────────────── */}
        {activeTab === "account" && (
          <div className="space-y-6">
            {/* Display Name */}
            <form
              onSubmit={handleSaveDisplayName}
              className="rounded-xl border border-navy-100 bg-white p-6"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50">
                  <svg
                    className="h-4 w-4 text-navy-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-navy-950">
                    Profile
                  </h2>
                  <p className="text-sm text-navy-400">
                    Your personal account details.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="account-email"
                    className="mb-1.5 block text-sm font-medium text-navy-900"
                  >
                    Email
                  </label>
                  <input
                    id="account-email"
                    type="email"
                    value={session?.user?.email || ""}
                    disabled
                    className={`${inputClasses} bg-navy-50 text-navy-500`}
                  />
                  <p className="mt-1.5 text-xs text-navy-400">
                    Your email address cannot be changed.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="account-name"
                    className="mb-1.5 block text-sm font-medium text-navy-900"
                  >
                    Display name
                  </label>
                  <input
                    id="account-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className={inputClasses}
                    placeholder="Your name"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={savingName || !displayName.trim()}
                  className="rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800 disabled:opacity-50"
                >
                  {savingName ? "Saving..." : "Save"}
                </button>
                {savedName && <SavedBadge />}
              </div>
            </form>

            {/* Change Password */}
            <form
              onSubmit={handleChangePassword}
              className="rounded-xl border border-navy-100 bg-white p-6"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                  <svg
                    className="h-4 w-4 text-amber-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base font-semibold text-navy-950">
                    Change Password
                  </h2>
                  <p className="text-sm text-navy-400">
                    Update your account password.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <label
                    htmlFor="current-password"
                    className="mb-1.5 block text-sm font-medium text-navy-900"
                  >
                    Current password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className={inputClasses}
                    placeholder="Enter current password"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-password"
                    className="mb-1.5 block text-sm font-medium text-navy-900"
                  >
                    New password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className={inputClasses}
                    placeholder="Min. 8 characters"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirm-new-password"
                    className="mb-1.5 block text-sm font-medium text-navy-900"
                  >
                    Confirm new password
                  </label>
                  <input
                    id="confirm-new-password"
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className={inputClasses}
                    placeholder="Re-enter new password"
                  />
                </div>
              </div>

              {passwordFeedback && (
                <p
                  className={`mt-4 text-sm ${
                    passwordFeedback.type === "success"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {passwordFeedback.message}
                </p>
              )}

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={
                    savingPassword ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmNewPassword
                  }
                  className="rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800 disabled:opacity-50"
                >
                  {savingPassword ? "Changing..." : "Change Password"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Members Tab ───────────────────────────────────────────── */}
        {activeTab === "members" && (
          <div className="space-y-6">
            {membersLoading ? (
              <div className="animate-pulse space-y-6">
                <div className="h-32 rounded-xl bg-navy-50" />
                <div className="h-48 rounded-xl bg-navy-50" />
              </div>
            ) : (
              <>
                {/* ── Invite Section (admin/owner only) ──────────── */}
                {isAdminOrOwner && (
                  <div className="rounded-xl border border-navy-100 bg-white p-6">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50">
                        <svg
                          className="h-4 w-4 text-navy-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-navy-950">
                          Invite People
                        </h2>
                        <p className="text-sm text-navy-400">
                          Invite new members to your workspace.
                        </p>
                      </div>
                    </div>

                    {/* Email invite form */}
                    <form
                      onSubmit={handleSendEmailInvite}
                      className="mt-6"
                    >
                      <label className="mb-1.5 block text-sm font-medium text-navy-900">
                        Invite by email
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="colleague@company.com"
                          required
                          className="flex-1 rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        />
                        <select
                          value={inviteRole}
                          onChange={(e) => setInviteRole(e.target.value)}
                          className="rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        >
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          type="submit"
                          disabled={sendingInvite || !inviteEmail.trim()}
                          className="rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800 disabled:opacity-50"
                        >
                          {sendingInvite ? "Sending..." : "Send Invite"}
                        </button>
                      </div>
                      {inviteFeedback && (
                        <p
                          className={`mt-2 text-sm ${
                            inviteFeedback.type === "success"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {inviteFeedback.message}
                        </p>
                      )}
                    </form>

                    {/* Invite link */}
                    <div className="mt-6">
                      <label className="mb-1.5 block text-sm font-medium text-navy-900">
                        Invite link
                      </label>
                      {activeLinkInvite ? (
                        <div className="flex items-center gap-2 rounded-lg border border-navy-200 bg-navy-50/50 px-3.5 py-2.5">
                          <span className="flex-1 truncate text-sm text-navy-600">
                            {typeof window !== "undefined"
                              ? `${window.location.origin}/invite/${activeLinkInvite.code}`
                              : `/invite/${activeLinkInvite.code}`}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              copyInviteLink(activeLinkInvite.code)
                            }
                            className="rounded-lg border border-navy-200 bg-white px-3 py-1.5 text-xs font-medium text-navy-700 transition-colors hover:bg-navy-50"
                          >
                            {copiedLink ? "Copied!" : "Copy"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteConfirm({
                                type: "invite",
                                id: activeLinkInvite.id,
                                name: "invite link",
                              })
                            }
                            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                          >
                            Revoke
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleGenerateInviteLink}
                          disabled={generatingLink}
                          className="rounded-lg border border-navy-200 px-4 py-2.5 text-sm font-medium text-navy-700 transition-colors hover:bg-navy-50 disabled:opacity-50"
                        >
                          {generatingLink
                            ? "Generating..."
                            : "Generate Invite Link"}
                        </button>
                      )}
                      <p className="mt-1.5 text-xs text-navy-400">
                        Anyone with this link can join your workspace.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Workspace Members ──────────────────────────── */}
                <div className="rounded-xl border border-navy-100 bg-white p-6">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50">
                      <svg
                        className="h-4 w-4 text-navy-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-navy-950">
                        Workspace Members
                      </h2>
                      <p className="text-sm text-navy-400">
                        {members.length}{" "}
                        {members.length === 1 ? "member" : "members"} in this
                        workspace.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {members.map((member) => {
                      const isSelf = member.userId === currentUserId;
                      const isOwner = member.role === "owner";
                      const canManage =
                        isAdminOrOwner && !isSelf && !isOwner;
                      const initial = (
                        member.user.name?.[0] || member.user.email[0]
                      ).toUpperCase();

                      return (
                        <div
                          key={member.id}
                          className="flex items-center justify-between rounded-lg border border-navy-100 px-4 py-3 transition-colors hover:bg-navy-50/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-100 text-sm font-semibold text-navy-700">
                              {initial}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-navy-900">
                                {member.user.name || "Unnamed"}
                                {isSelf && (
                                  <span className="ml-1.5 text-xs font-normal text-navy-400">
                                    (you)
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-navy-400">
                                {member.user.email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getRoleBadgeClasses(member.role)}`}
                            >
                              {getRoleLabel(member.role)}
                            </span>

                            {canManage && (
                              <div className="flex items-center gap-1">
                                {member.role === "viewer" && (
                                  <button
                                    onClick={() => handleUpdateMemberRole(member.id, "editor")}
                                    className="rounded-lg border border-navy-200 px-2.5 py-1 text-xs font-medium text-navy-600 transition-colors hover:bg-navy-50"
                                  >
                                    Make Editor
                                  </button>
                                )}
                                {member.role === "editor" && (
                                  <>
                                    <button
                                      onClick={() => handleUpdateMemberRole(member.id, "viewer")}
                                      className="rounded-lg border border-navy-200 px-2.5 py-1 text-xs font-medium text-navy-600 transition-colors hover:bg-navy-50"
                                    >
                                      Make Viewer
                                    </button>
                                    {currentUserRole === "owner" && (
                                      <button
                                        onClick={() => handleUpdateMemberRole(member.id, "admin")}
                                        className="rounded-lg border border-navy-200 px-2.5 py-1 text-xs font-medium text-navy-600 transition-colors hover:bg-navy-50"
                                      >
                                        Make Admin
                                      </button>
                                    )}
                                  </>
                                )}
                                {member.role === "admin" && currentUserRole === "owner" && (
                                  <button
                                    onClick={() => handleUpdateMemberRole(member.id, "editor")}
                                    className="rounded-lg border border-navy-200 px-2.5 py-1 text-xs font-medium text-navy-600 transition-colors hover:bg-navy-50"
                                  >
                                    Make Editor
                                  </button>
                                )}
                                <button
                                  onClick={() =>
                                    setDeleteConfirm({
                                      type: "member",
                                      id: member.id,
                                      name: member.user.name || member.user.email,
                                    })
                                  }
                                  className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Pending Invites (admin/owner only) ─────────── */}
                {isAdminOrOwner && pendingEmailInvites.length > 0 && (
                  <div className="rounded-xl border border-navy-100 bg-white p-6">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-50">
                        <svg
                          className="h-4 w-4 text-navy-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                          />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-navy-950">
                          Pending Invites
                        </h2>
                        <p className="text-sm text-navy-400">
                          {pendingEmailInvites.length} pending{" "}
                          {pendingEmailInvites.length === 1
                            ? "invite"
                            : "invites"}
                          .
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      {pendingEmailInvites.map((invite) => (
                        <div
                          key={invite.id}
                          className="flex items-center justify-between rounded-lg border border-navy-100 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-50 text-sm font-semibold text-navy-400">
                              {(invite.email?.[0] || "?").toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-navy-900">
                                {invite.email}
                              </p>
                              <p className="text-xs text-navy-400">
                                <span
                                  className={`mr-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getRoleBadgeClasses(invite.role)}`}
                                >
                                  {invite.role}
                                </span>
                                Sent {timeAgo(invite.createdAt)}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                type: "invite",
                                id: invite.id,
                                name: invite.email || "this invite",
                              })
                            }
                            className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                          >
                            Revoke
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
        {/* ── Billing Tab ───────────────────────────────────────────── */}
        {activeTab === "billing" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-navy-950">
                Billing & Plan
              </h2>
              <p className="mt-1 text-sm text-navy-400">
                Manage your subscription and billing details.
              </p>
            </div>

            {billingLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-32 rounded-xl bg-navy-50" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-48 rounded-xl bg-navy-50" />
                  <div className="h-48 rounded-xl bg-navy-50" />
                </div>
              </div>
            ) : (
              <>
                {/* Current plan card */}
                <div className="rounded-xl border border-navy-100 bg-white p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-navy-400">
                        Current Plan
                      </p>
                      <p className="mt-1 text-lg font-semibold text-navy-950">
                        {PLANS[billingPlan as PlanId]?.name || "Free"}
                      </p>
                      <p className="mt-0.5 text-sm text-navy-500">
                        {PLANS[billingPlan as PlanId]?.pricing[billingInterval as "monthly" | "annual"]?.label || "Free"}
                        {billingInterval === "annual" && billingPlan !== "free" && (
                          <span className="ml-1.5 text-xs text-navy-400">(billed annually)</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          billingStatus === "active"
                            ? "bg-green-100 text-green-700"
                            : billingStatus === "past_due"
                              ? "bg-red-100 text-red-700"
                              : billingStatus === "canceled"
                                ? "bg-navy-100 text-navy-600"
                                : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {billingStatus === "active"
                          ? "Active"
                          : billingStatus === "past_due"
                            ? "Past Due"
                            : billingStatus === "canceled"
                              ? "Canceled"
                              : billingStatus}
                      </span>
                      {billingPeriodEnd && (
                        <p className="mt-1.5 text-xs text-navy-400">
                          {billingCancelAt
                            ? "Cancels on "
                            : "Renews on "}
                          {new Date(billingPeriodEnd).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Usage counts */}
                  {billingUsage && (
                    <div className="mt-4 flex gap-4">
                      <div className="rounded-lg bg-navy-50 px-3 py-2 text-xs">
                        <span className="font-semibold text-navy-900">
                          {billingUsage.editors}
                        </span>
                        <span className="text-navy-500">
                          {billingUsage.editorLimit === -1
                            ? " Editors"
                            : ` / ${billingUsage.editorLimit} Editors`}
                        </span>
                      </div>
                      <div className="rounded-lg bg-navy-50 px-3 py-2 text-xs">
                        <span className="font-semibold text-navy-900">
                          {billingUsage.viewers}
                        </span>
                        <span className="text-navy-500">
                          {billingUsage.viewerLimit === -1
                            ? " Viewers"
                            : ` / ${billingUsage.viewerLimit} Viewers`}
                        </span>
                      </div>
                    </div>
                  )}

                  {billingHasStripe && (
                    <button
                      onClick={handleManageBilling}
                      className="mt-4 rounded-lg border border-navy-200 px-4 py-2 text-sm font-medium text-navy-900 transition-colors hover:bg-navy-50"
                    >
                      Manage Subscription
                    </button>
                  )}
                </div>

                {/* Plan comparison cards */}
                {billingPlan === "free" && (
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-navy-950">
                        Upgrade your plan
                      </h3>
                      <div className="flex items-center gap-1 rounded-lg bg-navy-50 p-0.5">
                        <button
                          onClick={() => setCheckoutInterval("monthly")}
                          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                            checkoutInterval === "monthly"
                              ? "bg-white text-navy-900 shadow-sm"
                              : "text-navy-500 hover:text-navy-700"
                          }`}
                        >
                          Monthly
                        </button>
                        <button
                          onClick={() => setCheckoutInterval("annual")}
                          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                            checkoutInterval === "annual"
                              ? "bg-white text-navy-900 shadow-sm"
                              : "text-navy-500 hover:text-navy-700"
                          }`}
                        >
                          Annual
                          <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold text-green-700">
                            Save 20%
                          </span>
                        </button>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {(["business", "pro"] as PlanId[]).map((planId) => {
                        const plan = PLANS[planId];
                        const pricing = plan.pricing[checkoutInterval];
                        const isComingSoon = plan.comingSoon;
                        return (
                          <div
                            key={planId}
                            className={`rounded-xl border p-6 ${
                              planId === "business"
                                ? "border-amber-300 bg-amber-50/30"
                                : "border-navy-100 bg-white opacity-75"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {planId === "business" && (
                                <span className="inline-block rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-semibold text-white">
                                  Popular
                                </span>
                              )}
                              {isComingSoon && (
                                <span className="inline-block rounded-full bg-navy-200 px-2.5 py-0.5 text-xs font-semibold text-navy-600">
                                  Coming Soon
                                </span>
                              )}
                            </div>
                            <h4 className="mt-3 text-base font-semibold text-navy-950">
                              {plan.name}
                            </h4>
                            <div className="mt-2 flex items-baseline gap-1">
                              <span className="text-sm text-navy-400">&euro;</span>
                              <span className="font-heading text-2xl font-bold text-navy-950">
                                {pricing.price}
                              </span>
                              <span className="text-sm text-navy-400">/mo</span>
                            </div>
                            {checkoutInterval === "annual" && pricing.price > 0 && (
                              <p className="mt-0.5 text-xs text-navy-400">
                                billed annually
                              </p>
                            )}
                            {planId === "business" && (
                              <p className="mt-1 text-xs text-navy-500">
                                3 Editors included, +&euro;{pricing.perEditorPrice}/editor
                              </p>
                            )}
                            <p className="mt-2 text-xs text-navy-500">
                              {plan.description}
                            </p>
                            <ul className="mt-4 space-y-2">
                              {plan.features.map((feature) => (
                                <li
                                  key={feature}
                                  className="flex items-start gap-2 text-xs text-navy-600"
                                >
                                  <svg
                                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M4.5 12.75l6 6 9-13.5"
                                    />
                                  </svg>
                                  {feature}
                                </li>
                              ))}
                            </ul>
                            {isComingSoon ? (
                              <button
                                onClick={() => handleCheckout("business")}
                                disabled={checkoutLoading !== null}
                                className="mt-5 w-full rounded-lg bg-navy-100 px-4 py-2.5 text-sm font-medium text-navy-600 transition-colors hover:bg-navy-200 disabled:opacity-50"
                              >
                                Try Business
                              </button>
                            ) : (
                              <button
                                onClick={() => handleCheckout(planId)}
                                disabled={checkoutLoading !== null}
                                className="mt-5 w-full rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-amber-400 disabled:opacity-50"
                              >
                                {checkoutLoading === planId
                                  ? "Loading..."
                                  : `Upgrade to ${plan.name}`}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Feature list for current plan */}
                <div className="rounded-xl border border-navy-100 bg-white p-6">
                  <h3 className="text-sm font-medium text-navy-950">
                    Included in your plan
                  </h3>
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                    {PLANS[billingPlan as PlanId]?.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-navy-600"
                      >
                        <svg
                          className="mt-0.5 h-4 w-4 shrink-0 text-green-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirm !== null}
        title={
          deleteConfirm?.type === "team"
            ? "Delete team"
            : deleteConfirm?.type === "invite"
              ? "Revoke invite"
              : "Remove member"
        }
        description={
          deleteConfirm?.type === "team"
            ? `Are you sure you want to delete "${deleteConfirm.name}"? This will remove all team associations.`
            : deleteConfirm?.type === "invite"
              ? `Are you sure you want to revoke the invite for ${deleteConfirm.name}?`
              : `Are you sure you want to remove ${deleteConfirm?.name} from this workspace?`
        }
        confirmLabel={
          deleteConfirm?.type === "invite" ? "Revoke" : deleteConfirm?.type === "member" ? "Remove" : "Delete"
        }
        variant={deleteConfirm?.type === "invite" ? "warning" : "danger"}
        onConfirm={async () => {
          if (!deleteConfirm) return;
          if (deleteConfirm.type === "team") {
            await handleDeleteTeam(deleteConfirm.id);
          } else if (deleteConfirm.type === "invite") {
            await handleRevokeInvite(deleteConfirm.id);
          } else {
            await handleRemoveMember(deleteConfirm.id);
          }
          setDeleteConfirm(null);
        }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
