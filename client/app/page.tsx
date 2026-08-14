import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#080808] text-[#f3efe8]">
      <section className="mx-auto w-full max-w-[1500px] px-4 pb-8 pt-5 sm:px-8 lg:px-10">
        <div className="relative overflow-hidden border border-[#1d1d1d] bg-[#0a0a0a] px-5 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(243,239,232,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(243,239,232,0.05)_1px,transparent_1px)] [background-size:26px_26px]" />
          <div className="absolute inset-y-0 left-[50%] hidden w-px bg-[#c8754d]/30 lg:block" />

          <div className="relative grid gap-8 lg:min-h-[560px] lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div className="relative z-10 max-w-[780px]">
              <div className="flex items-center gap-4">
                <span className="h-px w-10 bg-[#c8754d]/60" />
                <p className="font-mono text-[0.56rem] uppercase tracking-[0.32em] text-[#f3efe8]/60">
                  A home for creativity
                </p>
              </div>

              <h1 className="mt-5 text-[3.5rem] font-medium leading-[0.82] tracking-[-0.09em] text-[#f8f5f1] sm:text-[4.8rem] md:text-[6.4rem] lg:text-[7.5rem]">
                STVDIO
                <span className="align-super text-[0.34em] text-[#bb7551]">°</span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#f3efe8]/70 sm:text-lg">
                The creative network for showcasing work, discovering talent and
                building real connections.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/feed"
                  className="inline-flex items-center gap-2 border border-[#bb7551] bg-[#bb7551] px-4 py-3 text-[0.62rem] font-medium uppercase tracking-[0.22em] text-[#0c0c0c] transition-colors duration-200 hover:bg-[#d78962]"
                >
                  Enter the feed
                  <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href="/explore"
                  className="inline-flex items-center gap-2 border border-[#2a2a2a] bg-transparent px-4 py-3 text-[0.62rem] font-medium uppercase tracking-[0.22em] text-[#f3efe8] transition-colors duration-200 hover:border-[#f3efe8]/40 hover:bg-white/[0.02]"
                >
                  Explore creatives
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>

            <div className="relative z-10 flex min-h-[220px] items-end justify-end sm:min-h-[260px] lg:min-h-[300px]">
              <div className="w-full max-w-[260px] pb-4 lg:pb-10">
                <div className="mb-5 flex items-center justify-between text-[0.52rem] uppercase tracking-[0.28em] text-[#f3efe8]/40">
                  <span>01</span>
                  <span className="text-[#f3efe8]/25">/ 06</span>
                </div>

                <div className="mb-5 h-px w-full bg-[#1d1d1d]" />

                <p className="text-[0.52rem] uppercase tracking-[0.34em] text-[#f3efe8]/50">
                  Creative network
                </p>

                <div className="mt-8 text-[2.2rem] leading-none tracking-[-0.08em] text-[#f3efe8]/15 sm:text-[2.7rem] lg:text-[3.1rem]">
                  CREATIVE
                  <div className="mt-1">NETWORK</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1500px] px-4 pb-16 sm:px-8 lg:px-10">
        <div className="border-t border-[#1d1d1d] pt-5">
          <div className="flex items-center gap-4">
            <p className="font-mono text-[0.56rem] uppercase tracking-[0.28em] text-[#f3efe8]/55">
              Discover
            </p>
            <div className="h-px flex-1 bg-[#1d1d1d]" />
          </div>

          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#f3efe8]/70">
            Explore creative work, talent, and opportunities across STVDIO°.
          </p>

          <nav aria-label="Site discovery" className="mt-8 border-t border-[#1d1d1d] pt-4">
            <ul className="flex flex-col gap-0 sm:flex-row sm:flex-wrap sm:items-center sm:divide-x sm:divide-[#1d1d1d]">
              <li className="py-3 sm:pr-5">
                <Link
                  href="/feed"
                  className="inline-flex items-center gap-2 font-mono text-[0.56rem] uppercase tracking-[0.22em] text-[#f3efe8] transition-colors hover:text-[#d78962]"
                >
                  Explore work
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
              <li className="py-3 sm:px-5">
                <Link
                  href="/explore"
                  className="inline-flex items-center gap-2 font-mono text-[0.56rem] uppercase tracking-[0.22em] text-[#f3efe8] transition-colors hover:text-[#d78962]"
                >
                  Discover creatives
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
              <li className="py-3 sm:px-5">
                <Link
                  href="/market"
                  className="inline-flex items-center gap-2 font-mono text-[0.56rem] uppercase tracking-[0.22em] text-[#f3efe8] transition-colors hover:text-[#d78962]"
                >
                  Market
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
              <li className="py-3 sm:pl-5">
                <Link
                  href="/collaborations"
                  className="inline-flex items-center gap-2 font-mono text-[0.56rem] uppercase tracking-[0.22em] text-[#f3efe8] transition-colors hover:text-[#d78962]"
                >
                  Briefs
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </section>
    </main>
  );
}
