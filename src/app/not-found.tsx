import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-6">
      <div className="text-center">
        <p className="font-heading text-6xl font-bold text-navy-900">404</p>
        <h1 className="mt-4 font-heading text-2xl font-semibold text-navy-900">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-navy-400">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-800"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="rounded-lg border border-navy-200 bg-white px-4 py-2.5 text-sm font-medium text-navy-700 transition-colors hover:bg-navy-50"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
