"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

interface InviteInfo {
  valid: boolean;
  workspaceName?: string;
  inviterName?: string;
  role?: string;
  error?: string;
}

export default function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = useSession();

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/invites/validate?code=${code}`)
      .then((res) => res.json())
      .then((data) => setInfo(data))
      .catch(() => setInfo({ valid: false, error: "Failed to validate invite" }))
      .finally(() => setLoading(false));
  }, [code]);

  async function handleAccept() {
    setAccepting(true);
    setError("");
    try {
      const res = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to accept invite");
        setAccepting(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Failed to accept invite");
      setAccepting(false);
    }
  }

  const roleBadge = info?.role === "admin"
    ? { bg: "bg-blue-50", text: "text-blue-700" }
    : { bg: "bg-navy-50", text: "text-navy-600" };

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream p-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold text-navy-950">ncts</span>
            <span className="text-2xl font-bold text-amber-500">.</span>
            <span className="text-2xl font-bold text-navy-950">app</span>
          </Link>
        </div>

        <div className="rounded-xl border border-navy-100 bg-white p-8">
          {loading || sessionLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-navy-50" />
              <div className="mx-auto h-5 w-48 rounded bg-navy-50" />
              <div className="mx-auto h-4 w-64 rounded bg-navy-50" />
            </div>
          ) : !info?.valid ? (
            /* Invalid invite */
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <h1 className="text-lg font-semibold text-navy-950">
                Invalid Invite
              </h1>
              <p className="mt-2 text-sm text-navy-400">
                {info?.error || "This invite link is no longer valid."}
              </p>
              <Link
                href="/login"
                className="mt-6 inline-block rounded-lg bg-navy-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-800"
              >
                Go to Login
              </Link>
            </div>
          ) : session ? (
            /* Valid invite + logged in → accept */
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
                <svg className="h-7 w-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>
              <h1 className="text-lg font-semibold text-navy-950">
                Join {info.workspaceName}
              </h1>
              <p className="mt-2 text-sm text-navy-400">
                <strong>{info.inviterName}</strong> invited you to join as a{" "}
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${roleBadge.bg} ${roleBadge.text}`}>
                  {info.role}
                </span>
              </p>

              {error && (
                <p className="mt-3 text-sm text-red-600">{error}</p>
              )}

              <button
                onClick={handleAccept}
                disabled={accepting}
                className="mt-6 w-full rounded-lg bg-navy-950 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800 disabled:opacity-50"
              >
                {accepting ? "Joining..." : "Accept Invite"}
              </button>
            </div>
          ) : (
            /* Valid invite + not logged in → sign up / login */
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
                <svg className="h-7 w-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
              </div>
              <h1 className="text-lg font-semibold text-navy-950">
                Join {info.workspaceName}
              </h1>
              <p className="mt-2 text-sm text-navy-400">
                <strong>{info.inviterName}</strong> invited you to join as a{" "}
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${roleBadge.bg} ${roleBadge.text}`}>
                  {info.role}
                </span>
              </p>
              <p className="mt-1 text-sm text-navy-400">
                Sign up or log in to accept this invite.
              </p>

              <div className="mt-6 space-y-3">
                <Link
                  href={`/signup?invite=${code}`}
                  className="block w-full rounded-lg bg-navy-950 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-navy-800"
                >
                  Create Account
                </Link>
                <Link
                  href={`/login?invite=${code}`}
                  className="block w-full rounded-lg border border-navy-200 py-2.5 text-center text-sm font-medium text-navy-900 transition-colors hover:bg-navy-50"
                >
                  Already have an account? Log in
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
