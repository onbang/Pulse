import { PoolsBrowser } from "./components/pools-browser";

export default function PoolsPage() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 py-4 md:py-10">
      <div className="hero-shell">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="eyebrow">Liquidity terminal</p>
            <h1 className="page-heading mt-3">
              Discover the pools that matter right now.
            </h1>
            <p className="page-subheading mt-4">
              Scan the deepest routes, compare pair pricing, and save standout
              pools to your watchlist in a cleaner, readable discovery flow.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[24px] border border-sky-100 bg-white/88 px-4 py-4 backdrop-blur-xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Coverage
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Live</p>
              <p className="mt-2 text-sm text-slate-600">
                Built from current STON asset and pair data.
              </p>
            </div>
            <div className="rounded-[24px] border border-sky-100 bg-white/88 px-4 py-4 backdrop-blur-xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Signal
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Social
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Watchlist-ready with community-driven pool context.
              </p>
            </div>
            <div className="rounded-[24px] border border-sky-100 bg-white/88 px-4 py-4 backdrop-blur-xl">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Goal
              </p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                Actionable
              </p>
              <p className="mt-2 text-sm text-slate-600">
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
