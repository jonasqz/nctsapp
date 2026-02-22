"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96" />}>
      <ResetPasswordInner />
    </Suspense>
  );
}

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const tokenError = searchParams.get("error");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (tokenError === "INVALID_TOKEN" || !token) {
    return (
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-navy-950">
          Invalid or expired link
        </h1>
        <p className="mt-2 text-sm text-navy-400 leading-relaxed">
          This password reset link is invalid or has expired. Please request a
          new one.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/forgot-password"
            className="w-full rounded-lg bg-navy-900 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-navy-800"
          >
            Request new link
          </Link>
          <Link
            href="/login"
            className="w-full rounded-lg border border-navy-200 bg-white py-2.5 text-center text-sm font-medium text-navy-700 transition-colors hover:bg-navy-50"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-navy-950">
          Password reset!
        </h1>
        <p className="mt-2 text-sm text-navy-400 leading-relaxed">
          Your password has been updated successfully. You can now sign in with
          your new password.
        </p>
        <Link
          href="/login"
          className="mt-6 block w-full rounded-lg bg-navy-900 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-navy-800"
        >
          Sign in
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);

    const { error } = await authClient.resetPassword({
      newPassword: password,
      token: token!,
    });

    if (error) {
      setError(error.message ?? "Something went wrong");
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-navy-950">
          Set new password
        </h1>
        <p className="mt-2 text-sm text-navy-400">
          Choose a new password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-navy-900"
          >
            New password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            placeholder="Min. 8 characters"
          />
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1.5 block text-sm font-medium text-navy-900"
          >
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            placeholder="Re-enter your password"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-navy-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800 disabled:opacity-50"
        >
          {loading ? "Resetting..." : "Reset password"}
        </button>
      </form>
    </>
  );
}
