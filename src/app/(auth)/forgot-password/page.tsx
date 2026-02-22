"use client";

import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });

    if (error) {
      setError(error.message ?? "Something went wrong");
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-navy-950">Check your email</h1>
        <p className="mt-2 text-sm text-navy-400 leading-relaxed">
          If an account exists for <strong className="text-navy-700">{email}</strong>,
          we&apos;ve sent a password reset link. Check your inbox and follow the
          instructions.
        </p>
        <p className="mt-6 text-center text-sm text-navy-400">
          <Link
            href="/login"
            className="font-medium text-amber-500 hover:text-amber-400"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-navy-950">
          Forgot your password?
        </h1>
        <p className="mt-2 text-sm text-navy-400">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-navy-900"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-navy-200 px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
            placeholder="you@company.com"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-navy-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-navy-400">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-medium text-amber-500 hover:text-amber-400"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
