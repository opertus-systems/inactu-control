import { HeroSection } from "../../components/sections/hero-section";
import { PricingGrid } from "../../components/sections/pricing-grid";
import { pricingTiers } from "../../lib/site-content";

export default function PricingPage() {
  return (
    <main className="page shell-stack">
      <HeroSection
        content={{
          chip: "Adoption",
          title: "Open-source first, security validation before rollout.",
          description:
            "Current repository state does not publish managed-cloud packaging or SLA commitments; use these tracks as implementation guidance."
        }}
      />
      <PricingGrid tiers={pricingTiers} />
    </main>
  );
}
