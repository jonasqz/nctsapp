import Link from "next/link";
import { PricingSection } from "@/components/pricing-section";

function Nav() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-navy-100 bg-cream/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-heading text-xl font-semibold text-navy-900">
          ncts<span className="text-amber-500">.</span>app
        </Link>
        <div className="flex items-center gap-6">
          <Link href="#pricing" className="text-sm text-navy-600 transition-colors hover:text-navy-900">Pricing</Link>
          <Link href="https://github.com/jonasqz/nctsapp" className="text-sm text-navy-600 transition-colors hover:text-navy-900">GitHub</Link>
          <Link href="/login" className="text-sm text-navy-600 transition-colors hover:text-navy-900">Sign in</Link>
          <Link href="/signup" className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy-800">Get Started</Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="px-6 pt-32 pb-24">
      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-6 inline-block rounded-full border border-amber-200 bg-amber-200/20 px-4 py-1.5 text-sm font-medium text-amber-500">
          Open Source · NCT-native · AI-ready
        </div>
        <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] font-semibold text-navy-950">
          The NCT Framework,<br />
          <em className="text-amber-500">finally a tool.</em>
        </h1>
        <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-navy-600">
          The first dedicated workspace for Narratives, Commitments &amp; Tasks. Connect strategy to execution without another spreadsheet.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/signup" className="rounded-lg bg-navy-900 px-6 py-3 text-base font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-navy-800 hover:shadow-lg">Start for free</Link>
          <Link href="https://github.com/jonasqz/nctsapp" className="rounded-lg border border-navy-200 bg-white px-6 py-3 text-base font-medium text-navy-900 transition-all hover:-translate-y-0.5 hover:border-navy-300 hover:shadow-md">View on GitHub</Link>
        </div>
      </div>
    </section>
  );
}

function Framework() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-semibold text-navy-950">
          Strategy &rarr; Execution,<br /><span className="text-navy-400">in one hierarchy.</span>
        </h2>
        <div className="mt-12">
          <div className="rounded-t-xl border border-navy-200 bg-navy-900 p-8 text-white">
            <div className="mb-2 text-xs font-semibold tracking-widest text-amber-400 uppercase">Narrative</div>
            <p className="font-heading text-xl font-medium italic">&ldquo;We&apos;re becoming the go-to platform for mid-market teams&rdquo;</p>
            <p className="mt-2 text-sm text-navy-400">The story. Strategic context. Why this matters now.</p>
          </div>
          <div className="border-x border-b border-navy-200 bg-navy-800 p-8 text-white">
            <div className="mb-2 text-xs font-semibold tracking-widest text-amber-300 uppercase">Commitment</div>
            <p className="font-heading text-lg font-medium italic">&ldquo;Launch self-serve onboarding with &lt;5 min time-to-value&rdquo;</p>
            <p className="mt-2 text-sm text-navy-400">Measurable outcome. What you&apos;re promising to deliver.</p>
          </div>
          <div className="rounded-b-xl border-x border-b border-navy-200 bg-navy-700 p-8 text-white">
            <div className="mb-2 text-xs font-semibold tracking-widest text-amber-200 uppercase">Tasks</div>
            <ul className="space-y-1.5 font-mono text-sm text-navy-200">
              <li className="flex items-center gap-2"><span className="inline-block h-4 w-4 rounded border border-navy-400" />Build onboarding wizard</li>
              <li className="flex items-center gap-2"><span className="inline-block h-4 w-4 rounded border border-navy-400" />Reduce signup form to 3 fields</li>
              <li className="flex items-center gap-2"><span className="inline-block h-4 w-4 rounded border border-navy-400" />Add progress indicator</li>
            </ul>
            <p className="mt-3 text-sm text-navy-400">The work. Every task knows why it exists.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    { title: "NCT-native", description: "Built specifically for the NCT methodology. The hierarchy is enforced, not suggested." },
    { title: "AI-ready via MCP", description: "Exposes strategic context to any AI tool via Model Context Protocol. Your AI finally knows your priorities." },
    { title: "Async-first", description: "Weekly digests and proactive nudges. The tool comes to you — you don't stare at a dashboard." },
    { title: "Open Source core", description: "Free to use and self-host. No lock-in. Audit the code. Trust your strategy tool." },
  ];
  return (
    <section className="bg-cream-warm px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-semibold text-navy-950">
          What makes ncts.app <em className="text-amber-500">different.</em>
        </h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title}>
              <h3 className="text-lg font-semibold text-navy-900">{f.title}</h3>
              <p className="mt-2 leading-relaxed text-navy-600">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="bg-navy-900 px-6 py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-[clamp(1.75rem,4vw,2.5rem)] font-semibold text-white">
          Stop drifting. <em className="text-amber-400">Start aligning.</em>
        </h2>
        <p className="mt-6 text-lg leading-relaxed text-navy-400">
          ncts.app gives your team a shared workspace for strategy and execution. Free, open source, ready in minutes.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link href="/signup" className="rounded-lg bg-amber-500 px-6 py-3 text-base font-medium text-white transition-all hover:-translate-y-0.5 hover:bg-amber-400 hover:shadow-lg">Get started for free</Link>
          <Link href="https://github.com/jonasqz/nctsapp" className="rounded-lg border border-navy-700 px-6 py-3 text-base font-medium text-navy-300 transition-all hover:border-navy-500 hover:text-white">View on GitHub</Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-navy-100 bg-cream px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="font-heading text-lg font-semibold text-navy-900">ncts<span className="text-amber-500">.</span>app</div>
        <div className="flex gap-8 text-sm text-navy-400">
          <Link href="https://github.com/jonasqz/nctsapp" className="hover:text-navy-600">GitHub</Link>
          <Link href="#pricing" className="hover:text-navy-600">Pricing</Link>
          <Link href="/login" className="hover:text-navy-600">Sign in</Link>
        </div>
        <p className="text-sm text-navy-400">&copy; {new Date().getFullYear()} ncts.app</p>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Framework />
        <Features />
        <PricingSection />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
