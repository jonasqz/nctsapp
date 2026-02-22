import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left: branding panel */}
      <div className="hidden w-1/2 flex-col justify-between bg-navy-900 p-12 lg:flex">
        <Link href="/" className="font-heading text-2xl font-semibold text-white">
          ncts<span className="text-amber-500">.</span>app
        </Link>
        <div>
          <p className="font-heading text-3xl leading-snug font-semibold text-white">
            Connect strategy
            <br />
            to execution.
          </p>
          <p className="mt-4 max-w-sm text-navy-400">
            The first dedicated workspace for Narratives, Commitments &amp; Tasks.
            Open source, AI-ready, async-first.
          </p>
        </div>
        <p className="text-sm text-navy-700">
          &copy; {new Date().getFullYear()} ncts.app
        </p>
      </div>

      {/* Right: form */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
