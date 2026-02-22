"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[error-boundary]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-6">
      <div className="text-center">
        <p className="font-heading text-6xl font-bold text-navy-900">500</p>
        <h1 className="mt-4 font-heading text-2xl font-semibold text-navy-900">
          Something went wrong
        </h1>
        <p className="mt-2 max-w-md text-sm text-navy-400">
          An unexpected error occurred. Please try again or contact support if
          the problem persists.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="rounded-lg border border-navy-200 bg-white px-4 py-2.5 text-sm font-medium text-navy-700 transition-colors hover:bg-navy-50"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
