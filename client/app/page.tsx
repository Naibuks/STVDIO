import ApiStatus from "@/components/ApiStatus";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col justify-between p-8 sm:p-16">
      <header>
        <h1 className="text-5xl font-medium tracking-tight sm:text-7xl">
          STVDIO<span className="align-super text-[0.4em]">°</span>
        </h1>
        <p className="mt-4 max-w-md text-current/60">
          A creative networking, portfolio, collaboration and marketplace
          platform.
        </p>
      </header>

      <section className="mt-16 w-full max-w-md font-mono text-xs uppercase tracking-widest">
        <ApiStatus />
        <div className="flex items-baseline justify-between gap-6 border-t border-current/15 py-2">
          <span className="text-current/50">Phase</span>
          <span>01 — Foundation</span>
        </div>
      </section>
    </main>
  );
}
