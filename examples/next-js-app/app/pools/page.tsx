import { PoolsBrowser } from "./components/pools-browser";

export default function PoolsPage() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-4 md:py-10">
      <div className="hero-shell">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="eyebrow">Liquidity arena</p>
            <h1 className="page-heading mt-3">
              Discover the pools that matter right now.
            </h1>
            <p className="page-subheading mt-4">
              Scan the deepest routes, compare pair pricing, and save standout
              pools to your watchlist before you provide liquidity.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/70">
                Coverage
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">Live</p>
              <p className="mt-2 text-sm text-white/74">
                Built from current STON asset and pair data.
              </p>
            </div>
            <div className="rounded-[24px] border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/70">
                Signal
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">
                Social
              </p>
              <p className="mt-2 text-sm text-white/74">
                Watchlist-ready with community-driven pool context.
              </p>
            </div>
            <div className="rounded-[24px] border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-white/70">
                Goal
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight">
                Actionable
              </p>
              <p className="mt-2 text-sm text-white/74">
                Move from discovery to providing liquidity in one flow.
              </p>
            </div>
          </div>
        </div>
      </div>

      <PoolsBrowser />
    </section>
  );
}
