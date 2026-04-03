import { LiquidityProvideButton } from "./components/liquidity-provide-button";
import { LiquidityProvideForm } from "./components/liquidity-provide-form";
import { LiquidityProvideFormHeader } from "./components/liquidity-provide-form-header";
import { LiquidityProvideSimulationPreview } from "./components/liquidity-provide-simulation";
import { PoolCommentsSection } from "./components/pool-comments-section";
import { WatchlistToggle } from "./components/watchlist-toggle";

export default function LiquidityProvidePage() {
  return (
    <section className="mx-auto w-full max-w-[500px] pt-4 md:pt-12 flex flex-col gap-4">
      <LiquidityProvideFormHeader />
      <LiquidityProvideForm />
      <LiquidityProvideSimulationPreview />
      <WatchlistToggle />
      <LiquidityProvideButton />
      <PoolCommentsSection />
    </section>
  );
}
